import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { Pharmacy } from '@/lib/models/Pharmacy';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const pharmacies = await Pharmacy.find({})
      .populate('userId', 'fullName email phone')
      .sort({ pharmacyName: 1 });

    return NextResponse.json({ pharmacies });
  } catch (error: any) {
    console.error('Error fetching pharmacies:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
