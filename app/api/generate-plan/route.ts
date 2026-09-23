// app/api/generate-plan/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { stats, isTired, feedback } = await req.json();

    if (!stats) {
      return NextResponse.json({ error: "User stats are required" }, { status: 400 });
    }

    const availableEquipment = stats.equipment?.length > 0 ? stats.equipment.join(", ") : "Bodyweight only";
    const eatingStyle = stats.eatingMethods?.length > 0 ? stats.eatingMethods.join(", ") : "Standard / Anything";
    const allergyList = stats.allergies?.length > 0 ? stats.allergies.join(", ") : "None";

    const ifContext = stats.eatingMethods?.includes("Intermittent Fasting") && stats.ifSchedule
      ? `USER PRACTICES INTERMITTENT FASTING. Eating window: ${stats.ifSchedule}. ALL scheduled meals MUST strictly fall within this specific time period.`
      : "";

    let overloadInstructions = "";
    if (feedback === "Too Easy") {
      overloadInstructions = "PROGRESSIVE OVERLOAD: Increase weights or rep targets slightly compared to last week.";
    } else if (feedback === "Too Hard") {
      overloadInstructions = "RECOVERY ADJUSTMENT: Lower the workout intensity slightly to allow recovery.";
    }

    const prompt = `Act as an expert personal trainer and nutritionist. Generate a full exercise and nutrition plan in valid JSON format.

User Profile:
- Age: ${stats.age || 25}, Gender: ${stats.gender || "Not specified"}, Weight: ${stats.weight || 70}kg, Height: ${stats.height || 170}cm
- Goal: ${stats.goal || "Stay fit"}
- Available Equipment: ${availableEquipment}
- Swimming Pool Access: ${stats.swimmingPool ? "Yes" : "No"}
- Food Access: ${stats.foodAccess?.length > 0 ? stats.foodAccess.join(", ") : "Standard options"}
- Dietary Preferences: ${eatingStyle}
- Allergies / Exclusions: ${allergyList}

${ifContext}
${overloadInstructions}
${isTired ? "USER IS TIRED TODAY: Adjust Day 1 for active recovery / mobility." : ""}

STRICT CONSTRAINTS:
1. Keep exercise descriptions and steps concise (max 2 short bullet steps per exercise) to ensure full JSON completion.
2. Equipment: ONLY use listed equipment (${availableEquipment}).
3. Diet: Strictly respect "${eatingStyle}" and DO NOT include forbidden items (${allergyList}).
4. Weekly Routine: Provide 7 daily routines (Monday to Sunday).
5. Nutrition: Provide overall macro targets and 3-4 daily meals.

Required JSON Schema:
{
  "exercisePlan": {
    "overview": "Short strategy summary.",
    "weeklyRoutine": [
      {
        "day": "Monday",
        "focus": "Upper Body",
        "duration": "45 mins",
        "intensity": "High",
        "exercises": [
          {
            "name": "Kettlebell Press",
            "sets": "4",
            "reps": "8 per arm",
            "rest": "60s",
            "details": "4 sets of 8 reps per arm",
            "steps": ["Clean kettlebell to shoulder height.", "Press overhead keeping core engaged."],
            "youtubeQuery": "Kettlebell Press form"
          }
        ]
      }
    ]
  },
  "nutritionPlan": {
    "targetCalories": 2200,
    "targetProtein": 160,
    "targetCarbs": 180,
    "targetFat": 65,
    "meals": [
      {
        "title": "Meal 1",
        "time": "12:00 PM",
        "description": "Short description of meal.",
        "calories": 600,
        "protein": 45,
        "carbs": 50,
        "fat": 18
      }
    ]
  }
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a specialized AI fitness generator. You MUST respond with valid JSON only. Keep descriptions concise."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-70b-versatile",
      temperature: 0.3,
      max_completion_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const textResponse = completion.choices[0]?.message?.content || "{}";
    const parsedData = JSON.parse(textResponse);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Generate Plan Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate plan" }, { status: 500 });
  }
}