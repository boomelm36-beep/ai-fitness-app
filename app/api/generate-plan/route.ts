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
      ? `USER PRACTICES INTERMITTENT FASTING. Eating window: ${stats.ifSchedule}. ALL scheduled meals MUST fall within this time window.`
      : "";

    let overloadInstructions = "";
    if (feedback === "Too Easy") {
      overloadInstructions = "PROGRESSIVE OVERLOAD: Increase weights or rep targets slightly.";
    } else if (feedback === "Too Hard") {
      overloadInstructions = "RECOVERY ADJUSTMENT: Lower workout intensity slightly.";
    }

    const prompt = `Act as an expert personal trainer and nutritionist. Generate a complete workout and nutrition plan in valid JSON format.

User Profile:
- Age: ${stats.age || 25}, Gender: ${stats.gender || "Not specified"}, Weight: ${stats.weight || 70}kg, Height: ${stats.height || 170}cm
- Goal: ${stats.goal || "Stay fit"}
- Available Equipment: ${availableEquipment}
- Swimming Pool Access: ${stats.swimmingPool ? "Yes" : "No"}
- Dietary Preferences: ${eatingStyle}
- Allergies / Exclusions: ${allergyList}

${ifContext}
${overloadInstructions}
${isTired ? "USER IS TIRED TODAY: Adjust Day 1 for active recovery / mobility." : ""}

STRICT FORMAT RULES:
1. Provide 7 daily routines (Monday to Sunday) with 2 key exercises per day.
2. Keep exercise step descriptions concise (max 2 short bullet steps per exercise).
3. Provide target macros and 3 daily meals.
4. Output MUST strictly follow this JSON structure:

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
            "name": "Pushups",
            "sets": "3",
            "reps": "12",
            "rest": "60s",
            "details": "3 sets of 12 reps",
            "steps": ["Keep core tight.", "Lower chest to ground."],
            "youtubeQuery": "Pushup form"
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
        "title": "Breakfast",
        "time": "12:00 PM",
        "description": "Scrambled eggs with spinach.",
        "calories": 500,
        "protein": 35,
        "carbs": 10,
        "fat": 25
      }
    ]
  }
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a specialized AI fitness coach. Output valid JSON only." },
        { role: "user", content: prompt }
      ],
      model: "openai/gpt-oss-20b", // Free model hosted on Groq API
      temperature: 0.2,
      max_tokens: 2500,
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