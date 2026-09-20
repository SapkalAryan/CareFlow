import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { Order, OrderStatus } from '@/lib/models/Order';
import { Prescription } from '@/lib/models/Prescription';
import { TimelineEvent, EventType } from '@/lib/models/TimelineEvent';
import { updateOrderStatusSchema } from '@/lib/validators/order';
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

    const order = await Order.findById(params.id)
      .populate('prescriptionId')
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .populate({
        path: 'pharmacyId',
        populate: { path: 'userId', select: 'fullName email phone' },
      });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (role === 'patient' && order.patientId._id.toString() !== profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (role === 'pharmacy' && order.pharmacyId._id.toString() !== profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (role === 'pharmacy') {
      const sanitized = {
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        prescriptionCode: (order.prescriptionId as any)?.prescriptionId,
        items: (order.prescriptionId as any)?.items || [],
        patientName: (order.patientId as any)?.userId?.fullName || 'Patient',
        patientPhone: order.contactNumber || (order.patientId as any)?.userId?.phone || '',
        deliveryAddress: order.deliveryAddress || (order.patientId as any)?.address || '',
        contactNumber: order.contactNumber || (order.patientId as any)?.userId?.phone || '',
        notes: order.notes,
        createdAt: order.createdAt,
      };
      return NextResponse.json({ order: sanitized });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error fetching order:', error);
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
    const validationResult = updateOrderStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { status, notes } = validationResult.data;

    await dbConnect();

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (role === 'pharmacy' && order.pharmacyId.toString() !== profileId) {
      return NextResponse.json({ error: 'Forbidden: Order not assigned to your pharmacy' }, { status: 403 });
    }

    order.status = status as OrderStatus;
    if (notes) order.notes = notes;
    await order.save();

    // Sync Prescription status
    const prescription = await Prescription.findById(order.prescriptionId);
    if (prescription) {
      if (status === 'ACCEPTED') prescription.status = 'ACCEPTED';
      if (status === 'PROCESSING') prescription.status = 'PROCESSING';
      if (status === 'READY') prescription.status = 'READY_FOR_PICKUP';
      if (status === 'DISPENSED') prescription.status = 'DISPENSED';
      if (status === 'CANCELLED') prescription.status = 'CANCELLED';
      await prescription.save();
    }

    // Timeline event type mapping
    let eventType: EventType = 'PROCESSING';
    let description = `Order ${order.orderId} status updated to ${status}.`;

    if (status === 'ACCEPTED') {
      eventType = 'PHARMACY_ACCEPTED';
      description = `Pharmacy accepted order ${order.orderId}. Processing started.`;
    } else if (status === 'READY') {
      eventType = 'READY_FOR_PICKUP';
      description = `Order ${order.orderId} is READY for pickup!`;
    } else if (status === 'DISPENSED') {
      eventType = 'DISPENSED';
      description = `Order ${order.orderId} has been DISPENSED to patient.`;
    }

    await TimelineEvent.create({
      patientId: order.patientId,
      eventType,
      relatedId: order._id,
      description,
    });

    await logAuditEvent({
      userId: (session.user as any).id,
      action: `UPDATE_ORDER_STATUS_${status}`,
      resourceType: 'Order',
      resourceId: order._id.toString(),
      authorizationResult: 'ALLOWED',
    });

    return NextResponse.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
