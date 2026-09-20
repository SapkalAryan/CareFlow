import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { RefillRequest, RefillStatus } from '@/lib/models/RefillRequest';
import { Prescription } from '@/lib/models/Prescription';
import { TimelineEvent } from '@/lib/models/TimelineEvent';
import { respondRefillSchema } from '@/lib/validators/refill';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';


export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || (session.user as any).role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized: Only doctors can respond to refill requests' }, { status: 401 });
    }

    const doctorProfileId = (session.user as any).profileId;
    const body = await req.json();

    const validationResult = respondRefillSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { status, doctorNotes } = validationResult.data;

    await dbConnect();

    const refill = await RefillRequest.findById(params.id);
    if (!refill) {
      return NextResponse.json({ error: 'Refill request not found' }, { status: 404 });
    }

    if (refill.doctorId.toString() !== doctorProfileId) {
      return NextResponse.json({ error: 'Forbidden: You are not the assigned doctor for this request' }, { status: 403 });
    }

    refill.status = status as RefillStatus;
    refill.respondedAt = new Date();
    refill.doctorNotes = doctorNotes || '';
    await refill.save();

    const originalPrescription = await Prescription.findById(refill.prescriptionId);

    // If APPROVED, create new authorized prescription duplicate/refill
    if (status === 'APPROVED' && originalPrescription) {
      const newRxCode = `RX-${Math.floor(100000 + Math.random() * 900000)}`;

      const newPrescription = await Prescription.create({
        prescriptionId: newRxCode,
        doctorId: originalPrescription.doctorId,
        patientId: originalPrescription.patientId,
        pharmacyId: originalPrescription.pharmacyId,
        status: 'SENT_TO_PHARMACY',
        items: originalPrescription.items,
        additionalNotes: `Refill authorized by doctor. ${doctorNotes || ''}`,
        aiStructured: false,
        doctorConfirmedAt: new Date(),
      });

      await TimelineEvent.create({
        patientId: refill.patientId,
        eventType: 'REFILL_APPROVED',
        relatedId: newPrescription._id,
        description: `Refill request APPROVED by doctor! New prescription ${newRxCode} generated and sent to pharmacy.`,
      });
    } else if (status === 'REJECTED') {
      await TimelineEvent.create({
        patientId: refill.patientId,
        eventType: 'REFILL_REQUESTED',
        relatedId: refill._id,
        description: `Refill request rejected by doctor. Notes: ${doctorNotes || 'No notes provided.'}`,
      });
    } else if (status === 'CONSULTATION_REQUESTED') {
      await TimelineEvent.create({
        patientId: refill.patientId,
        eventType: 'FOLLOW_UP',
        relatedId: refill._id,
        description: `Doctor requested a consultation before approving refill. Notes: ${doctorNotes || 'Please contact clinic.'}`,
      });
    }

    await logAuditEvent({
      userId: (session.user as any).id,
      action: `RESPOND_REFILL_${status}`,
      resourceType: 'RefillRequest',
      resourceId: refill._id.toString(),
      authorizationResult: 'ALLOWED',
    });

    return NextResponse.json({
      message: `Refill request status updated to ${status}`,
      refill,
    });
  } catch (error: any) {
    console.error('Error updating refill request:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
