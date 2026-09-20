import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { Patient } from '@/lib/models/Patient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if ((session.user as any).role !== 'patient') {
      return NextResponse.json(
        { error: 'Patient access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const userId = (session.user as any).id;

    const user = await User.findById(userId).select(
      'fullName email phone'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const patient = await Patient.findOne({ userId: user._id });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile: {
        _id: patient._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: patient.address || '',
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        emergencyContact: patient.emergencyContact,
      },
    });
  } catch (error: any) {
    console.error('Error fetching patient profile:', error);

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}