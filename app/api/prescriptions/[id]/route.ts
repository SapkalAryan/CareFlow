import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { Prescription, PrescriptionStatus } from '@/lib/models/Prescription';
import { TimelineEvent, EventType } from '@/lib/models/TimelineEvent';
import { updatePrescriptionStatusSchema } from '@/lib/validators/prescription';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';


export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const profileId = (session.user as any).profileId;

    await dbConnect();

    const prescription = await Prescription.findById(params.id)
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
      });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    // Authorization check
    if (
      role === 'patient' &&
      prescription.patientId._id.toString() !== profileId
    ) {
      return NextResponse.json({ error: 'Forbidden: Unauthorized access to prescription' }, { status: 403 });
    }

    if (
      role === 'pharmacy' &&
      prescription.pharmacyId._id.toString() !== profileId
    ) {
      return NextResponse.json({ error: 'Forbidden: Prescription not assigned to your pharmacy' }, { status: 403 });
    }

    // Sanitized response for Pharmacy (Rule 2 & Security requirement)
    if (role === 'pharmacy') {
      const sanitized = {
        _id: prescription._id,
        prescriptionId: prescription.prescriptionId,
        status: prescription.status,
        patientName: (prescription.patientId as any)?.userId?.fullName || 'Patient',
        patientPhone: (prescription.patientId as any)?.userId?.phone || '',
        items: prescription.items,
        doctorConfirmedAt: prescription.doctorConfirmedAt,
        createdAt: prescription.createdAt,
      };

      await logAuditEvent({
        userId: (session.user as any).id,
        action: 'READ_PRESCRIPTION_SANITIZED',
        resourceType: 'Prescription',
        resourceId: prescription._id.toString(),
        authorizationResult: 'ALLOWED',
      });

      return NextResponse.json({ prescription: sanitized });
    }

    await logAuditEvent({
      userId: (session.user as any).id,
      action: 'READ_PRESCRIPTION_FULL',
      resourceType: 'Prescription',
      resourceId: prescription._id.toString(),
      authorizationResult: 'ALLOWED',
    });

    return NextResponse.json({ prescription });
  } catch (error: any) {
    console.error('Error fetching prescription:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const profileId = (session.user as any).profileId;

    const body = await req.json();
    const validationResult = updatePrescriptionStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { status, notes } = validationResult.data;

    await dbConnect();

    const prescription = await Prescription.findById(params.id);
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    // Role verification: Doctors & Pharmacies can update prescription status
    if (role === 'pharmacy' && prescription.pharmacyId.toString() !== profileId) {
      return NextResponse.json({ error: 'Forbidden: Prescription not assigned to your pharmacy' }, { status: 403 });
    }

    if (role === 'doctor' && prescription.doctorId.toString() !== profileId) {
      return NextResponse.json({ error: 'Forbidden: You did not write this prescription' }, { status: 403 });
    }

    prescription.status = status as PrescriptionStatus;
    if (notes) {
      prescription.additionalNotes = (prescription.additionalNotes ? prescription.additionalNotes + '\n' : '') + notes;
    }
    await prescription.save();

    // Map status to Timeline Event
    let eventType: EventType = 'PROCESSING';
    let statusDesc = `Prescription ${prescription.prescriptionId} status updated to ${status}.`;

    if (status === 'ACCEPTED') {
      eventType = 'PHARMACY_ACCEPTED';
      statusDesc = `Pharmacy has accepted prescription ${prescription.prescriptionId}. Preparation started.`;
    } else if (status === 'READY_FOR_PICKUP') {
      eventType = 'READY_FOR_PICKUP';
      statusDesc = `Prescription ${prescription.prescriptionId} is ready for pickup/delivery!`;
    } else if (status === 'DISPENSED' || status === 'COMPLETED') {
      eventType = 'DISPENSED';
      statusDesc = `Prescription ${prescription.prescriptionId} has been dispensed.`;
    } else if (status === 'PARTIALLY_AVAILABLE') {
      eventType = 'PROCESSING';
      statusDesc = `Pharmacy marked prescription ${prescription.prescriptionId} as partially available.`;
    }

    await TimelineEvent.create({
      patientId: prescription.patientId,
      eventType,
      relatedId: prescription._id,
      description: statusDesc,
    });

    await logAuditEvent({
      userId: (session.user as any).id,
      action: `UPDATE_PRESCRIPTION_STATUS_${status}`,
      resourceType: 'Prescription',
      resourceId: prescription._id.toString(),
      authorizationResult: 'ALLOWED',
    });

    return NextResponse.json({
      message: 'Prescription status updated successfully',
      prescription,
    });
  } catch (error: any) {
    console.error('Error updating prescription status:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
