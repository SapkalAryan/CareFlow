import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { Order } from '@/lib/models/Order';
import { Prescription } from '@/lib/models/Prescription';
import { Patient } from '@/lib/models/Patient';
import { TimelineEvent } from '@/lib/models/TimelineEvent';
import { createOrderSchema } from '@/lib/validators/order';
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
    if (role === 'patient') {
      query.patientId = profileId;
    } else if (role === 'pharmacy') {
      query.pharmacyId = profileId;
    } else if (role === 'doctor') {
      // Find orders for prescriptions authored by this doctor
      const docPrescriptions = await Prescription.find({ doctorId: profileId }).select('_id');
      const pIds = docPrescriptions.map((p) => p._id);
      query.prescriptionId = { $in: pIds };
    }

    const orders = await Order.find(query)
      .populate('prescriptionId')
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .populate({
        path: 'pharmacyId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .sort({ createdAt: -1 });

    // Sanitization if requested by Pharmacy (strip unneeded patient records)
    if (role === 'pharmacy') {
      const sanitizedOrders = orders.map((order: any) => ({
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        prescriptionId: order.prescriptionId?._id?.toString() || '',
        prescriptionCode: order.prescriptionId?.prescriptionId || 'RX-XXXX',
        items: order.prescriptionId?.items || [],
        patientName: order.patientId?.userId?.fullName || 'Patient',
        patientPhone: order.patientId?.userId?.phone || '',
        notes: order.notes,
        deliveryAddress: order.deliveryAddress || '',
        contactNumber: order.contactNumber || order.patientId?.userId?.phone || '',
        createdAt: order.createdAt,
      }));
      return NextResponse.json({ orders: sanitizedOrders });
    }

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || (session.user as any).role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized: Only patients can place medication orders' }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = createOrderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { prescriptionId, pharmacyId, notes, deliveryAddress, contactNumber } = validationResult.data;
    const patientProfileId = (session.user as any).profileId;

    await dbConnect();

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    // Verify patient owns this prescription.
    if (prescription.patientId.toString() !== patientProfileId) {
      return NextResponse.json({ error: 'Forbidden: Prescription does not belong to you' }, { status: 403 });
    }

    // The order must go to the pharmacy selected on the prescription. This keeps
    // the Doctor -> Patient -> Associated Pharmacy workflow intact.
    if (prescription.pharmacyId.toString() !== pharmacyId) {
      return NextResponse.json(
        { error: 'This prescription can only be ordered from its assigned pharmacy.' },
        { status: 400 }
      );
    }

    // Do not create two active orders for the same prescription. A completed or
    // cancelled order may be placed again later.
    const existingActiveOrder = await Order.findOne({
      prescriptionId: prescription._id,
      patientId: patientProfileId,
      status: { $nin: ['DISPENSED', 'CANCELLED'] },
    }).sort({ createdAt: -1 });

    if (existingActiveOrder) {
      return NextResponse.json(
        {
          error: 'An active order already exists for this prescription.',
          order: existingActiveOrder,
        },
        { status: 409 }
      );
    }

    const patient = await Patient.findById(patientProfileId);
    if (!patient) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
    }

    const orderCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = await Order.create({
      orderId: orderCode,
      prescriptionId,
      patientId: patientProfileId,
      pharmacyId,
      status: 'PENDING',
      notes: notes || '',
      deliveryAddress: deliveryAddress.trim(),
      contactNumber: contactNumber.trim(),
    });

    // Update prescription status
    prescription.status = 'SENT_TO_PHARMACY';
    await prescription.save();

    // Create Timeline Event
    await TimelineEvent.create({
      patientId: patientProfileId,
      eventType: 'ORDER_PLACED',
      relatedId: newOrder._id,
      description: `Order ${orderCode} placed for prescription ${prescription.prescriptionId}. Sent to pharmacy for fulfillment.`,
    });

    // Audit log
    await logAuditEvent({
      userId: (session.user as any).id,
      action: 'PLACE_MEDICATION_ORDER',
      resourceType: 'Order',
      resourceId: newOrder._id.toString(),
      authorizationResult: 'ALLOWED',
    });

    return NextResponse.json(
      {
        message: 'Medication order placed successfully',
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
