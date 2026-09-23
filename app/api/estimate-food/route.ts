// app/api/estimate-food/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { food } = await req.json();

    const prompt = `The user ate: "${food}". Estimate the calories for a standard Thai portion. 
    Output ONLY valid JSON matching this exact structure:
    {
      "foodName": "Standardized Name (e.g., Pad Thai with Shrimp)",
      "calories": 450
    }`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      response_format: { type: "json_object" }, 
    });

    const data = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}