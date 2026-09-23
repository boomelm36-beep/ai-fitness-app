// app/api/estimate-food/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { food, image } = await req.json();
    let messages: any[] = [];
    
    const jsonStructure = `{"foodName": "Name", "calories": 450, "protein": 30, "carbs": 40, "fat": 15}`;

    if (image) {
      messages = [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this image of food. Estimate the calories and macros for the portion shown. Output ONLY valid JSON matching this exact structure: ${jsonStructure}` 
            },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ];
    } else {
      messages = [
        { 
          role: "user", 
          content: `The user ate: "${food}". Estimate the calories and macros for a standard Thai portion. Output ONLY valid JSON matching this exact structure: ${jsonStructure}` 
        }
      ];
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: image ? "llama-3.2-11b-vision-preview" : "openai/gpt-oss-120b",
      temperature: 0.3,
    });

    let textResponse = chatCompletion.choices[0]?.message?.content || "{}";
    textResponse = textResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    const data = JSON.parse(textResponse);
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}