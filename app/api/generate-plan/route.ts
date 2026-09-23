// app/api/generate-plan/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { stats, isTired } = await req.json();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const prompt = `Act as an expert personal trainer and nutritionist. 
    User: Age ${stats.age}, Weight ${stats.weight}kg, Goal: ${stats.goal}. 
    Location: Thailand. Food Access: ${stats.foodAccess?.length > 0 ? stats.foodAccess.join(", ") : "Standard grocery"}.

    CONSTRAINTS:
    1. SCHEDULE: Today is ${today}. Make Saturday and Sunday rest/light recovery days.
    2. NUTRITION: You MUST suggest localized Thai meals or specific items based on their Food Access (e.g., specific 7-11 Thailand items like chicken breast/boiled eggs, common street food like Pad Krapow Gai with less oil, or Grab delivery options).
    3. INSTRUCTIONS: For every exercise, provide 3-4 steps and a youtube search phrase.

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
              { 
                "name": "Dumbbell Press", 
                "details": "3 sets of 10 reps", 
                "steps": [
                  "Lie back on a bench holding dumbbells at chest level.",
                  "Press the weights upward until your arms are fully extended.",
                  "Slowly lower the dumbbells back to the starting position."
                ],
                "youtubeSearch": "Dumbbell Press proper form tutorial"
              }
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
      model: "openai/gpt-oss-120b",
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