// app/api/generate-plan/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { stats, isTired } = await req.json();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const prompt = `Act as an expert personal trainer and nutritionist. 
    User: Age ${stats.age}, Weight ${stats.weight}kg, Height ${stats.height}cm, Goal: ${stats.goal}. 
    Equipment Available: ${stats.equipment?.length > 0 ? stats.equipment.join(", ") : "Bodyweight only"}.
    Swimming Pool Access: ${stats.swimmingPool ? "Yes" : "No"}.

    ${isTired ? "USER IS TIRED TODAY. Adjust today's routine for active recovery and lower calories." : ""}
    
    CONSTRAINTS:
    1. SCHEDULE: Today is ${today}. Generate a 7-day schedule. Make Saturday and Sunday rest or light recovery days.
    2. SWIMMING: If Swimming Pool Access is Yes, you MUST ONLY schedule swimming activities on Saturday or Sunday. Do not schedule swimming on weekdays.
    3. NUTRITION: Meals must be very easy to find and easy to prepare.
    4. IMAGES: For every exercise, provide a short 3-5 word descriptive prompt showing a person doing the movement.

    You MUST output a valid JSON object matching this exact structure:
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

const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a fitness and nutrition AI. You only output valid JSON. Do not include markdown tags like ```json or any other text.",
        },
        {
          role: "user",
          content: prompt,
        }
      ],
      model: "llama-3.3-70b-versatile", // <-- Update this line to the new model
      temperature: 0.5,
      response_format: { type: "json_object" }, 
    });

    const textResponse = chatCompletion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(textResponse);

    return NextResponse.json({ exercisePlan: data.exercisePlan, nutritionPlan: data.nutritionPlan });
  } catch (error: any) {
    console.error("Groq API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to connect to AI" }, { status: 500 });
  }
}