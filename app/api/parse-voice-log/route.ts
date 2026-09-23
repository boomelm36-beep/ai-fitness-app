// app/api/parse-voice-log/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const jsonSchema = `{
      "exerciseName": "Bench Press",
      "weight": 60,
      "reps": 10,
      "sets": 1
    }`;

    const prompt = `Parse the following spoken fitness log into structured JSON data.
    Spoken text: "${transcript}"

    Rules:
    - "exerciseName": The exercise mentioned (e.g. Squats, Pushups, Dumbbell Curl). Capitalize properly.
    - "weight": Number in kg or lbs (if mentioned, otherwise 0).
    - "reps": Integer count of repetitions (if mentioned, default 10).
    - "sets": Integer count of sets (if mentioned, default 1).

    Return ONLY JSON in this exact structure:
    ${jsonSchema}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Voice parse error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}