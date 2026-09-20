import mongoose, { Schema, Document, Model } from 'mongoose';

export type PrescriptionStatus =
  | 'CREATED'
  | 'SENT_TO_PHARMACY'
  | 'ACCEPTED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'DISPENSED'
  | 'COMPLETED'
  | 'PARTIALLY_AVAILABLE'
  | 'PARTIALLY_DISPENSED'
  | 'CANCELLED';

export interface IPrescriptionItem {
  medicineName: string;
  strength: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
  quantity: number;
  instructions?: string;
}

export interface IPrescription extends Document {
  _id: mongoose.Types.ObjectId;
  prescriptionId: string; // Unique human readable e.g., RX-894215
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  pharmacyId: mongoose.Types.ObjectId;
  status: PrescriptionStatus;
  items: IPrescriptionItem[];
  followUpDate?: Date;
  additionalNotes?: string;
  aiStructured: boolean;
  doctorConfirmedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionItemSchema = new Schema<IPrescriptionItem>(
  {
    medicineName: { type: String, required: true, trim: true },
    strength: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    timing: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    instructions: { type: String, default: '' },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema<IPrescription>(
  {
    prescriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
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
      enum: [
        'CREATED',
        'SENT_TO_PHARMACY',
        'ACCEPTED',
        'PROCESSING',
        'READY_FOR_PICKUP',
        'DISPENSED',
        'COMPLETED',
        'PARTIALLY_AVAILABLE',
        'PARTIALLY_DISPENSED',
        'CANCELLED',
      ],
      default: 'CREATED',
      required: true,
    },
    items: {
      type: [PrescriptionItemSchema],
      required: true,
      validate: [(val: IPrescriptionItem[]) => val.length > 0, 'Prescription must contain at least one item'],
    },
    followUpDate: {
      type: Date,
    },
    additionalNotes: {
      type: String,
      default: '',
    },
    aiStructured: {
      type: Boolean,
      default: false,
    },
    doctorConfirmedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Prescription: Model<IPrescription> =
  mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
