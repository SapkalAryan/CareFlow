import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { Prescription } from '@/lib/models/Prescription';
import { Doctor } from '@/lib/models/Doctor';
import { TimelineEvent } from '@/lib/models/TimelineEvent';
import { createPrescriptionSchema } from '@/lib/validators/prescription';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const profileId = (session.user as any).profileId;

    await dbConnect();

    let query: any = {};
    if (role === 'doctor') {
      query.doctorId = profileId;
    } else if (role === 'patient') {
      query.patientId = profileId;
    } else if (role === 'pharmacy') {
      query.pharmacyId = profileId;
    }

    const prescriptions = await Prescription.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .populate({
        path: 'pharmacyId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .sort({ createdAt: -1 });

    if (role === 'pharmacy') {
      const sanitizedPrescriptions = prescriptions.map((prescription: any) => ({
        _id: prescription._id,
        prescriptionId: prescription.prescriptionId,
        status: prescription.status,
        patientName: prescription.patientId?.userId?.fullName || 'Patient',
        patientPhone: prescription.patientId?.userId?.phone || '',
        items: prescription.items || [],
        doctorConfirmedAt: prescription.doctorConfirmedAt,
        createdAt: prescription.createdAt,
      }));

      return NextResponse.json({ prescriptions: sanitizedPrescriptions });
    }

    return NextResponse.json({ prescriptions });
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || (session.user as any).role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized: Doctor role required' }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = createPrescriptionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { patientId, pharmacyId, items, followUpDate, additionalNotes, aiStructured } =
      validationResult.data;

    await dbConnect();

    const doctorProfileId = (session.user as any).profileId;
    const doctor = await Doctor.findById(doctorProfileId);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const randomRxNumber = Math.floor(100000 + Math.random() * 900000);
    const prescriptionCode = `RX-${randomRxNumber}`;

    // Create prescription with initial status SENT_TO_PHARMACY
    const newPrescription = await Prescription.create({
      prescriptionId: prescriptionCode,
      doctorId: doctor._id,
      patientId,
      pharmacyId,
      status: 'SENT_TO_PHARMACY',
      items,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      additionalNotes: additionalNotes || '',
      aiStructured: Boolean(aiStructured),
      doctorConfirmedAt: new Date(),
    });

    // Create Timeline event for patient
    const medicineNames = items.map((i) => i.medicineName).join(', ');
    await TimelineEvent.create({
      patientId,
      eventType: 'PRESCRIPTION_CREATED',
      relatedId: newPrescription._id,
      description: `New prescription ${prescriptionCode} created with ${items.length} medication(s): ${medicineNames}. Sent to pharmacy.`,
    });

    // Audit log
    await logAuditEvent({
      userId: (session.user as any).id,
      action: 'CREATE_PRESCRIPTION',
      resourceType: 'Prescription',
      resourceId: newPrescription._id.toString(),
      authorizationResult: 'ALLOWED',
    });

    return NextResponse.json(
      {
        message: 'Prescription created and sent to pharmacy successfully',
        prescription: newPrescription,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating prescription:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
