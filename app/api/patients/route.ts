import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { Patient } from '@/lib/models/Patient';
import { Doctor } from '@/lib/models/Doctor';
import { createPatientSchema } from '@/lib/validators/patient';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const profileId = (session.user as any).profileId;

    await dbConnect();

    // Patients may read only their own profile. Doctors keep the existing
    // doctor-scoped patient list. No other role gets access to patient records.
    if (role === 'patient') {
      const patient = await Patient.findById(profileId).populate({
        path: 'userId',
        select: 'fullName email phone role',
      });

      if (!patient) {
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
      }

      return NextResponse.json({ patients: [patient] });
    }

    if (role !== 'doctor') {
      return NextResponse.json({ error: 'Forbidden: Doctor access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';

    // Find patients linked to this doctor
    const doctor = await Doctor.findById(profileId);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const query: any = { doctorId: doctor._id };

    const patients = await Patient.find(query)
      .populate({
        path: 'userId',
        select: 'fullName email phone role',
      })
      .sort({ createdAt: -1 });

    // Filter by search term if provided
    let filtered = patients;
    if (search.trim()) {
      const lowerSearch = search.toLowerCase().trim();
      filtered = patients.filter((p: any) => {
        const user = p.userId;
        return (
          user?.fullName?.toLowerCase().includes(lowerSearch) ||
          user?.phone?.includes(lowerSearch) ||
          p._id.toString().includes(lowerSearch)
        );
      });
    }

    return NextResponse.json({ patients: filtered });
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || (session.user as any).role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized: Doctor role required' }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = createPatientSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
    } = validationResult.data;

    await dbConnect();

    // Check doctor profile
    const profileId = (session.user as any).profileId;
    const doctor = await Doctor.findById(profileId);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    // Check if user email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create User record for patient
    const newPatientUser = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role: 'patient',
      fullName,
      phone,
    });

    // Create Patient record linked to doctor
    const newPatient = await Patient.create({
      userId: newPatientUser._id,
      doctorId: doctor._id,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
    });

    await logAuditEvent({
      userId: (session.user as any).id,
      action: 'CREATE_PATIENT',
      resourceType: 'Patient',
      resourceId: newPatient._id.toString(),
      authorizationResult: 'ALLOWED',
    });

    return NextResponse.json(
      {
        message: 'Patient registered successfully',
        patient: newPatient,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
