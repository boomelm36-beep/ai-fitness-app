// app/api/scan-fridge/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { image, stats } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const eatingStyle = stats?.eatingMethods?.length > 0 ? stats.eatingMethods.join(", ") : "Standard / Anything";
    const allergyList = stats?.allergies?.length > 0 ? stats.allergies.join(", ") : "None";

    const jsonStructure = `{
      "detectedIngredients": ["Egg", "Chicken Breast", "Garlic", "Spinach"],
      "recipes": [
        {
          "name": "Garlic Chicken Spinach Stir-fry",
          "prepTime": "15 mins",
          "calories": 420,
          "protein": 45,
          "carbs": 8,
          "fat": 14,
          "ingredientsUsed": ["Chicken Breast", "Garlic", "Spinach"],
          "instructions": [
            "Mince garlic and slice chicken breast into thin strips.",
            "Heat oil in a wok over medium-high heat and sauté garlic until fragrant.",
            "Add chicken and cook until no longer pink.",
            "Toss in spinach and cook until wilted. Season to taste."
          ]
        }
      ]
    }`;

    const prompt = `Analyze this image of a fridge/pantry/raw food ingredients.
    
1. List all distinct raw ingredients you can identify in "detectedIngredients".
2. Generate 2 to 3 creative, delicious recipes using ONLY or mostly the detected ingredients.
3. DIETARY CONSTRAINTS: 
   - Eating Style: ${eatingStyle}
   - STRICT ALLERGY EXCLUSIONS: ${allergyList} (Do NOT include any forbidden ingredients).

Output ONLY valid JSON matching this exact structure:
${jsonStructure}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ],
      model: "llama-3.2-11b-vision-preview",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    let textResponse = chatCompletion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(textResponse);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Scan Fridge Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}