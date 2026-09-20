import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPatient extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  address: string;
  emergencyContact: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: false,
    },
    dateOfBirth: {
      type: String,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    emergencyContact: {
      type: String,
      required: [true, 'Emergency contact is required'],
    },
  },
  {
    timestamps: true,
  }
);

export const Patient: Model<IPatient> =
  mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);
