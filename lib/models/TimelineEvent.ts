import mongoose, { Schema, Document, Model } from 'mongoose';

export type EventType =
  | 'CONSULTATION'
  | 'PRESCRIPTION_CREATED'
  | 'ORDER_PLACED'
  | 'PHARMACY_ACCEPTED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'DISPENSED'
  | 'REFILL_REQUESTED'
  | 'REFILL_APPROVED'
  | 'FOLLOW_UP';

export interface ITimelineEvent extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  eventType: EventType;
  relatedId?: mongoose.Types.ObjectId | string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'CONSULTATION',
        'PRESCRIPTION_CREATED',
        'ORDER_PLACED',
        'PHARMACY_ACCEPTED',
        'PROCESSING',
        'READY_FOR_PICKUP',
        'DISPENSED',
        'REFILL_REQUESTED',
        'REFILL_APPROVED',
        'FOLLOW_UP',
      ],
      required: true,
    },
    relatedId: {
      type: Schema.Types.Mixed,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TimelineEvent: Model<ITimelineEvent> =
  mongoose.models.TimelineEvent ||
  mongoose.model<ITimelineEvent>('TimelineEvent', TimelineEventSchema);
