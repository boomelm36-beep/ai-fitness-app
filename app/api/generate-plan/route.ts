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
    Please provide a 7-day Exercise Plan and a daily Nutrition Plan. 
    
    IMPORTANT: You must format your exact response using these two headers:
    [EXERCISE_START]
    (write the exercise plan here)
    [EXERCISE_END]
    
    [NUTRITION_START]
    (write the nutrition plan here)
    [NUTRITION_END]`;

    if (isTired) {
      prompt = `The user is feeling too tired to complete their current exercise plan today. 
      Here is their current plan: ${currentPlan}.
      Please modify today's and tomorrow's workout to be an active recovery or lighter session, and adjust the nutrition slightly to match the lower energy expenditure. 
      
      IMPORTANT: You must format your exact response using these two headers:
      [EXERCISE_START]
      (write the adjusted exercise plan here)
      [EXERCISE_END]
      
      [NUTRITION_START]
      (write the adjusted nutrition plan here)
      [NUTRITION_END]`;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const text = response.text || "";
    console.log("Raw AI Response:", text); // This will show in your terminal

    // Extract content between the tags
    const exerciseMatch = text.match(/\[EXERCISE_START\]([\s\S]*?)\[EXERCISE_END\]/);
    const nutritionMatch = text.match(/\[NUTRITION_START\]([\s\S]*?)\[NUTRITION_END\]/);

    const exercisePlan = exerciseMatch ? exerciseMatch[1].trim() : "Failed to parse exercise plan.";
    const nutritionPlan = nutritionMatch ? nutritionMatch[1].trim() : "Failed to parse nutrition plan.";

    return NextResponse.json({ exercisePlan, nutritionPlan });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to generate plan' }, { status: 500 });
  }
}