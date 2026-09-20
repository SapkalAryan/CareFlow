import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { aiStructureSchema } from '@/lib/validators/ai';
import { parseNaturalLanguagePrescription } from '@/lib/ai/prescriptionAssistant';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || (session.user as any).role !== 'doctor') {
      return NextResponse.json(
        { error: 'Unauthorized: Only registered doctors can access the AI Prescription Assistant' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validationResult = aiStructureSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const structuredData = await parseNaturalLanguagePrescription(
      validationResult.data.naturalLanguage
    );

    // Audit log
    await logAuditEvent({
      userId: (session.user as any).id,
      action: 'AI_STRUCTURE_PRESCRIPTION',
      resourceType: 'PrescriptionAssistant',
      authorizationResult: 'ALLOWED',
    });

    return NextResponse.json({
      success: true,
      data: structuredData,
    });
  } catch (error: any) {
    console.error('AI Structure API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse prescription text' },
      { status: 500 }
    );
  }
}
