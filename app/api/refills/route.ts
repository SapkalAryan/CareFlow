import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { RefillRequest } from '@/lib/models/RefillRequest';
import { Prescription } from '@/lib/models/Prescription';
import { TimelineEvent } from '@/lib/models/TimelineEvent';
import { createRefillSchema } from '@/lib/validators/refill';
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
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const refills = await RefillRequest.find(query)
      .populate('prescriptionId')
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ refills });
  } catch (error: any) {
    console.error('Error fetching refills:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || (session.user as any).role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized: Only patients can request refills' }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = createRefillSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { prescriptionId, reason } = validationResult.data;
    const patientProfileId = (session.user as any).profileId;

    await dbConnect();

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    if (prescription.patientId.toString() !== patientProfileId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this prescription' }, { status: 403 });
    }

    // Check if there is already a pending refill request for this prescription
    const existingPending = await RefillRequest.findOne({
      prescriptionId,
      status: 'PENDING',
    });

    if (existingPending) {
      return NextResponse.json(
        { error: 'A refill request for this prescription is already pending doctor review' },
        { status: 400 }
      );
    }

    const newRefill = await RefillRequest.create({
      prescriptionId,
      patientId: patientProfileId,
      doctorId: prescription.doctorId,
      status: 'PENDING',
      requestedAt: new Date(),
      patientReason: reason || '',
    });

    // Create Timeline event
    await TimelineEvent.create({
      patientId: patientProfileId,
      eventType: 'REFILL_REQUESTED',
      relatedId: newRefill._id,
      description: `Refill requested for prescription ${prescription.prescriptionId}. Pending doctor authorization.`,
    });

    await logAuditEvent({
      userId: (session.user as any).id,
      action: 'REQUEST_REFILL',
      resourceType: 'RefillRequest',
      resourceId: newRefill._id.toString(),
      authorizationResult: 'ALLOWED',
    });

    return NextResponse.json(
      {
        message: 'Refill request submitted to doctor',
        refill: newRefill,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating refill request:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
