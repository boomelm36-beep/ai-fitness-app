// app/api/estimate-food/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { food, image } = await req.json();
    let messages: any[] = [];

    // If an image is provided, format for the Vision model
    if (image) {
      messages = [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze this image of food. Estimate the calories for the portion shown. Output ONLY valid JSON matching this exact structure: {\"foodName\": \"Standardized Name\", \"calories\": 450}" 
            },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ];
    } else {
      // Otherwise, use the standard text-based prompt
      messages = [
        { 
          role: "user", 
          content: `The user ate: "${food}". Estimate the calories for a standard Thai portion. Output ONLY valid JSON matching this exact structure: {"foodName": "Standardized Name", "calories": 450}` 
        }
      ];
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      // Use the blazing-fast 11b vision model if there's an image, otherwise the standard text model
      model: image ? "llama-3.2-11b-vision-preview" : "openai/gpt-oss-120b",
      temperature: 0.3,
    });

    // Vision models sometimes wrap JSON in markdown despite instructions, so we strip it safely
    let textResponse = chatCompletion.choices[0]?.message?.content || "{}";
    textResponse = textResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    const data = JSON.parse(textResponse);
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("Vision API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}