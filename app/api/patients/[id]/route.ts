import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { Patient } from '@/lib/models/Patient';
import { Prescription } from '@/lib/models/Prescription';
import { TimelineEvent } from '@/lib/models/TimelineEvent';
import { Consultation } from '@/lib/models/Consultation';
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

    const currentRole = (session.user as any).role;
    const currentProfileId = (session.user as any).profileId;
    const patientId = params.id;

    await dbConnect();

    // Access control:
    // Patient can only view their own profile.
    // Doctor can view assigned patient profile.
    // Pharmacy CANNOT view full patient medical profile here.
    if (currentRole === 'pharmacy') {
      return NextResponse.json(
        { error: 'Forbidden: Pharmacy role does not have access to full patient medical profiles' },
        { status: 403 }
      );
    }

    if (currentRole === 'patient' && currentProfileId !== patientId) {
      await logAuditEvent({
        userId: (session.user as any).id,
        action: 'READ_PATIENT_PROFILE',
        resourceType: 'Patient',
        resourceId: patientId,
        authorizationResult: 'DENIED',
      });
      return NextResponse.json({ error: 'Forbidden: Access denied to other patient profiles' }, { status: 403 });
    }

    const patient = await Patient.findById(patientId)
      .populate('userId', 'fullName email phone')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'fullName email phone' },
      });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Fetch related patient records
    const prescriptions = await Prescription.find({ patientId: patient._id })
      .populate('pharmacyId')
      .sort({ createdAt: -1 });

    const timelineEvents = await TimelineEvent.find({ patientId: patient._id }).sort({
      createdAt: -1,
    });

    const consultations = await Consultation.find({ patientId: patient._id }).sort({
      consultationDate: -1,
    });

    await logAuditEvent({
      userId: (session.user as any).id,
      action: 'READ_PATIENT_PROFILE',
      resourceType: 'Patient',
      resourceId: patientId,
      authorizationResult: 'ALLOWED',
    });

    return NextResponse.json({
      patient,
      prescriptions,
      timelineEvents,
      consultations,
    });
  } catch (error: any) {
    console.error('Error fetching patient details:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
