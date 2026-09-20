import { dbConnect } from '@/lib/db';
import { AuditLog } from '@/lib/models/AuditLog';
import mongoose from 'mongoose';

export async function logAuditEvent({
  userId,
  action,
  resourceType,
  resourceId,
  authorizationResult,
  ipAddress = '127.0.0.1',
}: {
  userId: string | mongoose.Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: string;
  authorizationResult: 'ALLOWED' | 'DENIED';
  ipAddress?: string;
}) {
  try {
    await dbConnect();
    await AuditLog.create({
      userId,
      action,
      resourceType,
      resourceId,
      authorizationResult,
      ipAddress,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
