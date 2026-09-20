import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDoctor extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  specialization: string;
  licenseNumber: string;
  associatedPharmacyIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      trim: true,
    },
    associatedPharmacyIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Pharmacy',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Doctor: Model<IDoctor> =
  mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);
