// app/api/generate-plan/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { stats, isTired, currentPlan } = body;

    let prompt = `Act as an expert personal trainer and nutritionist. 
    User Profile: Age ${stats.age}, Weight ${stats.weight}kg, Height ${stats.height}cm, Goal: ${stats.goal}. 
    Please provide a concise 7-day Exercise Plan and a daily Nutrition Plan. Return the response in two clear sections: "EXERCISE_PLAN" and "NUTRITION_PLAN".`;

    // Dynamic prompt if the user hits the "I'm too tired" button
    if (isTired) {
      prompt = `The user is feeling too tired to complete their current exercise plan today. 
      Here is their current plan: ${currentPlan}.
      Please modify today's and tomorrow's workout to be an active recovery or lighter session, and adjust the nutrition slightly to match the lower energy expenditure. Return the response in two sections: "EXERCISE_PLAN" and "NUTRITION_PLAN".`;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const text = response.text || "";
    
    // Simple parsing (in a production app, use JSON schema generation with Gemini)
    const exerciseSplit = text.split('NUTRITION_PLAN');
    const exercisePlan = exerciseSplit[0].replace('EXERCISE_PLAN', '').trim();
    const nutritionPlan = exerciseSplit[1] ? exerciseSplit[1].trim() : "No nutrition plan generated.";

    return NextResponse.json({ exercisePlan, nutritionPlan });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}