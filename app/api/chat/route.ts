import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is missing');

      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format.' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const sanitizedMessages = messages
      .filter(
        (message: any) =>
          message &&
          typeof message.content === 'string' &&
          (message.role === 'user' || message.role === 'assistant')
      )
      .slice(-8)
      .map((message: any) => ({
        role: message.role,
        content: message.content.slice(0, 4000),
      }));

    const response = await openai.responses.create({
      model: 'gpt-5.6-luna',
      instructions: `
You are CareFlow's Ayurvedic Health Assistant.

Provide clear, patient-friendly educational information about:
- Ayurvedic medicines and herbs
- Traditional Ayurvedic uses
- General wellness
- Possible precautions
- Possible medication interactions
- General differences between Ayurvedic and modern medicine

Safety rules:
- Do not diagnose diseases.
- Do not prescribe or change medications.
- Do not tell patients to stop or start prescribed medication.
- Clearly distinguish traditional Ayurvedic claims from established medical evidence.
- Mention important precautions and interactions when relevant.
- For pregnancy, children, serious illness, chronic conditions, allergies, or medication interactions, recommend consulting a qualified healthcare professional.
- For emergencies or severe symptoms, recommend immediate medical attention.
- Do not present uncertain medical information as fact.
- Keep normal answers concise and easy to understand.

Always remind the user that the information is educational and does not replace professional medical advice.
      `.trim(),
      input: sanitizedMessages,
    });

    return NextResponse.json({
      content:
        response.output_text ||
        'I could not generate a response. Please try again.',
    });
  } catch (error: any) {
    console.error('========== OPENAI CHAT ERROR ==========');
    console.error(error);
    console.error('=======================================');

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Unable to process your request right now.',
      },
      { status: 500 }
    );
  }
}