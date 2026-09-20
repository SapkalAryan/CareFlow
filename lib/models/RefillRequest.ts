import mongoose, { Schema, Document, Model } from 'mongoose';

export type RefillStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONSULTATION_REQUESTED';

export interface IRefillRequest extends Document {
  _id: mongoose.Types.ObjectId;
  prescriptionId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  status: RefillStatus;
  requestedAt: Date;
  respondedAt?: Date;
  patientReason?: string;
  doctorNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefillRequestSchema = new Schema<IRefillRequest>(
  {
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
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CONSULTATION_REQUESTED'],
      default: 'PENDING',
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    respondedAt: {
      type: Date,
    },
    patientReason: {
      type: String,
      default: '',
    },
    doctorNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const RefillRequest: Model<IRefillRequest> =
  mongoose.models.RefillRequest ||
  mongoose.model<IRefillRequest>('RefillRequest', RefillRequestSchema);
