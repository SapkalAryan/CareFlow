import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Doctor } from '@/lib/models/Doctor';
import { Patient } from '@/lib/models/Patient';
import { Pharmacy } from '@/lib/models/Pharmacy';
import { registerSchema } from '@/lib/validators/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const issues = validationResult.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${issues}`, details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      email,
      password,
      fullName,
      phone,
      role,
      specialization,
      licenseNumber,
      pharmacyName,
      address,
      dateOfBirth,
      gender,
      bloodGroup,
      emergencyContact,
    } = validationResult.data;

    try {
      await dbConnect();
    } catch (dbErr: any) {
      console.error('Database connection error in registration:', dbErr);
      return NextResponse.json(
        { error: `Database connection failed. Please ensure MONGODB_URI is properly configured. (${dbErr.message || dbErr})` },
        { status: 500 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in instead.' },
        { status: 400 }
      );
    }

    // Hash password with bcrypt 12 rounds as mandated
    const passwordHash = await bcrypt.hash(password, 12);

    // Create Base User
    const newUser = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role,
      fullName,
      phone,
    });

    if (role === 'doctor') {
      await Doctor.create({
        userId: newUser._id,
        specialization: specialization?.trim() || 'General Medicine',
        licenseNumber: licenseNumber?.trim() || `MD-${Math.floor(100000 + Math.random() * 900000)}`,
        associatedPharmacyIds: [],
      });
    } else if (role === 'pharmacy') {
      await Pharmacy.create({
        userId: newUser._id,
        pharmacyName: pharmacyName?.trim() || `${fullName} Pharmacy`,
        licenseNumber: licenseNumber?.trim() || `PH-${Math.floor(100000 + Math.random() * 900000)}`,
        address: address?.trim() || '123 Health Avenue, Medical District',
        associatedDoctorIds: [],
      });
    } else if (role === 'patient') {
      const anyDoctor = await Doctor.findOne();
      await Patient.create({
        userId: newUser._id,
        doctorId: anyDoctor ? anyDoctor._id : undefined,
        dateOfBirth: dateOfBirth?.trim() || '1990-01-01',
        gender: gender || 'Male',
        bloodGroup: bloodGroup || 'O+',
        address: address?.trim() || 'Patient Residence Address',
        emergencyContact: emergencyContact?.trim() || phone,
      });
    }

    // Audit log
    await logAuditEvent({
      userId: newUser._id,
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: newUser._id.toString(),
      authorizationResult: 'ALLOWED',
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: newUser._id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: error.message || 'An internal server error occurred during registration' },
      { status: 500 }
    );
  }
}
