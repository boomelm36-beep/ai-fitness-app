// app/api/generate-plan/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { stats, isTired } = await req.json();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const availableEquipment = stats.equipment?.length > 0 
      ? stats.equipment.join(", ") 
      : "Bodyweight only (NO equipment, NO dumbbells, NO barbells, NO machines)";

    const eatingStyle = stats.eatingMethods?.length > 0 
      ? stats.eatingMethods.join(", ") 
      : "Anything / Standard";

    const allergyList = stats.allergies?.length > 0 
      ? stats.allergies.join(", ") 
      : "None";

    const prompt = `Act as an expert personal trainer and nutritionist. 
    User Stats: Age ${stats.age}, Weight ${stats.weight}kg, Height ${stats.height}cm, Goal: ${stats.goal}. 
    EQUIPMENT AVAILABLE: ${availableEquipment}.
    Swimming Pool Access: ${stats.swimmingPool ? "Yes" : "No"}.
    Food Access (Thailand): ${stats.foodAccess?.length > 0 ? stats.foodAccess.join(", ") : "Standard local options"}.
    DIETARY STYLE / EATING METHOD: ${eatingStyle}.
    STRICT ALLERGIES / RESTRICTED FOODS: ${allergyList}.

    ${isTired ? "USER IS TIRED TODAY. Adjust today's routine for active recovery and light mobility/stretching." : ""}
    
    STRICT CONSTRAINTS:
    1. EQUIPMENT RESTRICTION: ONLY use exercises strictly using listed equipment. If Bodyweight only, do NOT include Dumbbells, Barbells, Kettlebells, or machines.
    2. DIETARY STYLE RESTRICTION: The nutrition plan MUST strictly follow the selected dietary style: "${eatingStyle}".
    3. ALLERGY RESTRICTION: Absolutely DO NOT include any food items containing or derived from: ${allergyList}.
    4. SCHEDULE (CRITICAL): Generate a full 7-day routine. You MUST include exactly 7 objects in the "weeklyRoutine" array (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday). Make Saturday and Sunday rest/light recovery days.
    5. SWIMMING: If Swimming Pool Access is Yes, schedule swimming ONLY on Saturday or Sunday.
    6. NUTRITION (CRITICAL): Suggest realistic Thai options based on Food Access. You MUST provide at least 3-4 meals in the "meals" array (Breakfast, Lunch, Dinner, and optionally Snack).
    7. INSTRUCTIONS & VIDEO: For EVERY exercise, provide 3-4 clear step-by-step instructions and a concise YouTube search term.

    Output ONLY valid JSON matching this exact structure:
    {
      "exercisePlan": {
        "overview": "Short motivational summary tailored to their goal and available equipment.",
        "weeklyRoutine": [
          { 
            "day": "Monday", 
            "focus": "Upper Body", 
            "duration": "45 mins", 
            "intensity": "High", 
            "exercises": [
              { 
                "name": "Push-Ups", 
                "details": "3 sets of 12 reps", 
                "steps": ["Step 1...", "Step 2...", "Step 3..."],
                "youtubeSearch": "Push-Ups form tutorial"
              }
            ] 
          }
        ]
      },
      "nutritionPlan": {
        "dailyCalories": 2200,
        "macros": { "protein": 150, "carbs": 20, "fat": 120 },
        "meals": [
          { "time": "Breakfast", "name": "Meal name", "calories": 400, "desc": "Description..." },
          { "time": "Lunch", "name": "Meal name", "calories": 600, "desc": "Description..." },
          { "time": "Dinner", "name": "Meal name", "calories": 500, "desc": "Description..." }
        ]
      }
    }`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a strict fitness and nutrition AI. You must output a complete 7-day schedule and all daily meals. Output ONLY valid JSON without markdown wrapping.",
        },
        {
          role: "user",
          content: prompt,
        }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      max_tokens: 4000, // <-- CRITICAL: Give the AI enough space to output all 7 days
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