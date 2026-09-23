// app/api/generate-plan/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { stats, isTired, feedback } = await req.json();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const availableEquipment = stats.equipment?.length > 0 
      ? stats.equipment.join(", ") 
      : "Bodyweight only (NO equipment)";

    const eatingStyle = stats.eatingMethods?.length > 0 ? stats.eatingMethods.join(", ") : "Anything / Standard";
    const allergyList = stats.allergies?.length > 0 ? stats.allergies.join(", ") : "None";

    // Progressive Overload Logic
    let overloadInstructions = "";
    if (feedback === "Too Easy") {
      overloadInstructions = "PROGRESSIVE OVERLOAD REQUIRED: The user found last week too easy. Increase the intensity slightly by adding weight, adding reps, or adding a set to the exercises.";
    } else if (feedback === "Too Hard") {
      overloadInstructions = "DELOAD REQUIRED: The user found last week too hard. Reduce the total volume (fewer sets or reps) to allow for recovery.";
    } else if (feedback === "Perfect") {
      overloadInstructions = "MAINTAIN MOMENTUM: The user found last week perfect. Keep the intensity similar but slightly vary the exercises to prevent plateau.";
    }

    const prompt = `Act as an expert personal trainer and nutritionist. 
    User Stats: Age ${stats.age}, Gender: ${stats.gender || "Not specified"}, Weight ${stats.weight}kg, Height ${stats.height}cm, Goal: ${stats.goal}.
    EQUIPMENT AVAILABLE: ${availableEquipment}.
    Swimming Pool Access: ${stats.swimmingPool ? "Yes" : "No"}.
    Food Access: ${stats.foodAccess?.length > 0 ? stats.foodAccess.join(", ") : "Standard options"}.
    DIETARY STYLE: ${eatingStyle}. ALLERGIES: ${allergyList}.

    ${overloadInstructions}
    ${isTired ? "USER IS TIRED TODAY. Adjust today's routine for active recovery and light mobility." : ""}
    
    STRICT CONSTRAINTS:
    1. EQUIPMENT: ONLY use listed equipment. No dumbbells/barbells if "Bodyweight only".
    2. DIET: Strictly follow "${eatingStyle}" and DO NOT include: ${allergyList}.
    3. SCHEDULE (CRITICAL): Generate a full 7-day routine. You MUST include exactly 7 objects in the "weeklyRoutine" array (Monday to Sunday).
    4. NUTRITION (CRITICAL): Provide at least 3-4 meals. Adjust calories based on their new weight of ${stats.weight}kg and goal.
    5. INSTRUCTIONS: Provide 3-4 steps and a YouTube search term for each exercise.

    Output ONLY valid JSON matching this exact structure:
    {
      "exercisePlan": {
        "overview": "Motivational summary acknowledging their feedback and new weight.",
        "weeklyRoutine": [
          { "day": "Monday", "focus": "Upper Body", "duration": "45 mins", "intensity": "High", "exercises": [ { "name": "Push-Ups", "details": "3 sets of 12 reps", "steps": ["Step 1..."], "youtubeSearch": "Push-Ups form tutorial" } ] }
        ]
      },
      "nutritionPlan": {
        "dailyCalories": 2200,
        "macros": { "protein": 150, "carbs": 20, "fat": 120 },
        "meals": [ { "time": "Breakfast", "name": "Meal name", "calories": 400, "desc": "Description" } ]
      }
    }`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a strict fitness AI. Output a complete 7-day schedule. Output ONLY valid JSON without markdown.",
        },
        { role: "user", content: prompt }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" }, 
    });

    let textResponse = chatCompletion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(textResponse);

    return NextResponse.json({ exercisePlan: data.exercisePlan, nutritionPlan: data.nutritionPlan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}