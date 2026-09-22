// app/api/generate-plan/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { stats, isTired } = await req.json();

    const prompt = `Act as an expert personal trainer and nutritionist. 
    User: Age ${stats.age}, Weight ${stats.weight}kg, Height ${stats.height}cm, Goal: ${stats.goal}. 
    ${isTired ? "USER IS TIRED TODAY. Adjust the routine for active recovery and lower calories." : ""}
    
    Return ONLY a valid JSON object matching this exact structure, with no markdown formatting or backticks around it:
    {
      "exercisePlan": {
        "overview": "Short motivational overview",
        "weeklyRoutine": [
          { 
            "day": "Monday", 
            "focus": "Upper Body / Push", 
            "duration": "45 mins", 
            "intensity": "High", 
            "exercises": ["Bench Press (3x10)", "Overhead Press (3x12)"] 
          }
        ]
      },
      "nutritionPlan": {
        "dailyCalories": 2200,
        "macros": { "protein": 150, "carbs": 200, "fat": 65 },
        "meals": [
          { "time": "Breakfast", "name": "Protein Oatmeal", "calories": 450, "desc": "Oats with whey and berries" }
        ]
      }
    }`;

    let retries = 3;
    let response;
    
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" } // Forces JSON output
        });
        break;
      } catch (err: any) {
        if (err?.status === 'UNAVAILABLE' && retries > 1) {
          retries--;
          await new Promise(res => setTimeout(res, 2000));
        } else {
          throw err;
        }
      }
    }

    const data = JSON.parse(response?.text || "{}");
    return NextResponse.json({ exercisePlan: data.exercisePlan, nutritionPlan: data.nutritionPlan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}