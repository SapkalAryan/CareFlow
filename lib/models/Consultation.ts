import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConsultation extends Document {
  _id: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  consultationDate: Date;
  notes: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationSchema = new Schema<IConsultation>(
  {
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
    consultationDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    notes: {
      type: String,
      required: [true, 'Consultation notes are required'],
    },
    followUpDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Consultation: Model<IConsultation> =
  mongoose.models.Consultation || mongoose.model<IConsultation>('Consultation', ConsultationSchema);
