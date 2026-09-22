// app/api/generate-plan/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { stats, isTired } = await req.json();
    
    // Get today's day of the week to align the schedule
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const prompt = `Act as an expert personal trainer and nutritionist. 
    User: Age ${stats.age}, Weight ${stats.weight}kg, Height ${stats.height}cm, Goal: ${stats.goal}. 
    Equipment Available: ${stats.equipment.length > 0 ? stats.equipment.join(", ") : "Bodyweight only"}.
    Swimming Pool Access: ${stats.swimmingPool ? "Yes" : "No"}.

    ${isTired ? "USER IS TIRED TODAY. Adjust today's routine for active recovery and lower calories." : ""}
    
    CONSTRAINTS:
    1. SCHEDULE: Today is ${today}. Generate a 7-day schedule. You MUST explicitly make Saturday and Sunday rest or light recovery days. 
    2. NUTRITION: Meals must be very easy to find (standard grocery items or common takeout) and easy/fast to prepare. No complex recipes.

    Return ONLY a valid JSON object matching this exact structure:
    {
      "exercisePlan": {
        "overview": "Short motivational overview based on their equipment and goal.",
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
          { "time": "Breakfast", "name": "Protein Oatmeal", "calories": 450, "desc": "Oats with whey, easy to prep in 2 mins." }
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
            config: { responseMimeType: "application/json" }
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