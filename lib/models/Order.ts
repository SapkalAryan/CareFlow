import mongoose, { Schema, Document, Model } from 'mongoose';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PROCESSING'
  | 'READY'
  | 'DISPENSED'
  | 'CANCELLED';

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: string; // Human-readable ORD-XXXXXX
  prescriptionId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  pharmacyId: mongoose.Types.ObjectId;
  status: OrderStatus;
  notes?: string;
  deliveryAddress?: string;
  contactNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PROCESSING', 'READY', 'DISPENSED', 'CANCELLED'],
      default: 'PENDING',
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    deliveryAddress: {
      type: String,
      default: '',
      trim: true,
    },
    contactNumber: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
