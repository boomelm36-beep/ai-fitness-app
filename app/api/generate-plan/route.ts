// app/api/generate-plan/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { stats, isTired } = await req.json();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const prompt = `Act as an expert personal trainer and nutritionist. 
    User: Age ${stats.age}, Weight ${stats.weight}kg, Height ${stats.height}cm, Goal: ${stats.goal}. 
    Equipment Available: ${stats.equipment.length > 0 ? stats.equipment.join(", ") : "Bodyweight only"}.
    Swimming Pool Access: ${stats.swimmingPool ? "Yes" : "No"}.

    ${isTired ? "USER IS TIRED TODAY. Adjust today's routine for active recovery and lower calories." : ""}
    
    CONSTRAINTS:
    1. SCHEDULE: Today is ${today}. Generate a 7-day schedule. Make Saturday and Sunday rest or light recovery days.
    2. SWIMMING: If Swimming Pool Access is Yes, you MUST ONLY schedule swimming activities on Saturday or Sunday. Do not schedule swimming on weekdays.
    3. NUTRITION: Meals must be very easy to find and easy to prepare.
    4. IMAGES: For every exercise, provide a short 3-5 word descriptive prompt showing a person doing the movement (e.g., "man doing dumbbell bicep curl").

    Return ONLY a valid JSON object matching this exact structure:
    {
      "exercisePlan": {
        "overview": "Short motivational overview based on their equipment and goal.",
        "weeklyRoutine": [
          { 
            "day": "Monday", 
            "focus": "Upper Body", 
            "duration": "45 mins", 
            "intensity": "High", 
            "exercises": [
              { "name": "Dumbbell Press", "details": "3 sets of 10 reps", "imagePrompt": "person doing dumbbell chest press" }
            ] 
          }
        ]
      },
      "nutritionPlan": {
        "dailyCalories": 2200,
        "macros": { "protein": 150, "carbs": 200, "fat": 65 },
        "meals": [
          { "time": "Breakfast", "name": "Protein Oatmeal", "calories": 450, "desc": "Oats with whey." }
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