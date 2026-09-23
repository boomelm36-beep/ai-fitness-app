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
    2. DIETARY STYLE RESTRICTION: The nutrition plan MUST strictly follow the selected dietary style: "${eatingStyle}". (e.g. If Ketogenic/Low carb, keep carbohydrates extremely low; if Carnivore, emphasize meat/animal products).
    3. ALLERGY RESTRICTION (CRITICAL): Absolutely DO NOT include any food items containing or derived from: ${allergyList}.
    4. SCHEDULE: Today is ${today}. Generate a 7-day routine. Make Saturday and Sunday rest or light recovery days.
    5. SWIMMING: If Swimming Pool Access is Yes, you MUST ONLY schedule swimming on Saturday or Sunday.
    6. NUTRITION: Suggest realistic Thai options based on their Food Access (e.g. 7-11 Thailand items, Thai street food / made-to-order, Grab/LineMan delivery).
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
                "steps": [
                  "Place hands slightly wider than shoulder width.",
                  "Lower body until chest nearly touches floor.",
                  "Push back up keeping core tight."
                ],
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
          { "time": "Breakfast", "name": "7-11 Boiled Eggs & Grilled Chicken", "calories": 400, "desc": "Fits dietary style and avoids restricted ingredients." }
        ]
      }
    }`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a strict fitness and nutrition AI. You strictly respect equipment limitations, dietary methods, and allergen exclusions. Output ONLY valid JSON without markdown wrapping.",
        },
        {
          role: "user",
          content: prompt,
        }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
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