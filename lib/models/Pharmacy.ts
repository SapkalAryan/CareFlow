import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPharmacy extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  pharmacyName: string;
  licenseNumber: string;
  address: string;
  associatedDoctorIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PharmacySchema = new Schema<IPharmacy>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    pharmacyName: {
      type: String,
      required: [true, 'Pharmacy name is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Pharmacy address is required'],
      trim: true,
    },
    associatedDoctorIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Doctor',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Pharmacy: Model<IPharmacy> =
  mongoose.models.Pharmacy || mongoose.model<IPharmacy>('Pharmacy', PharmacySchema);
