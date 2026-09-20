import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { TimelineEvent } from '@/lib/models/TimelineEvent';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const profileId = (session.user as any).profileId;

    const url = new URL(req.url);
    const targetPatientId = url.searchParams.get('patientId') || profileId;

    await dbConnect();

    // Access check
    if (role === 'patient' && targetPatientId !== profileId) {
      return NextResponse.json({ error: 'Forbidden: Cannot view another patient timeline' }, { status: 403 });
    }

    if (role === 'pharmacy') {
      return NextResponse.json({ error: 'Forbidden: Pharmacy role does not have medical timeline access' }, { status: 403 });
    }

    const events = await TimelineEvent.find({ patientId: targetPatientId })
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
