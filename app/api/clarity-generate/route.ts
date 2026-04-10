import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Ensure the API Key exists to prevent runtime crashes
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("CRITICAL: OPENAI_API_KEY is missing from environment variables.");
}

const openai = new OpenAI({ 
  apiKey: apiKey || '' 
});

export async function POST(req: Request) {
  try {
    // Destructure the new data points we've integrated
    const { prompt, channel, customerData } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    // This prompt now utilizes the Business Intelligence we've collected
    const systemPrompt = `
      You are Clarity, the AI soul of 'The Organised Types'. 
      Your tone is minimalist, sophisticated, utilitarian, and calm. 

      CONTEXT:
      - Interfacing with: ${customerData?.name || 'an entity'}
      - Company: ${customerData?.company || 'Private Node'}
      - VAT: ${customerData?.vat_number || 'Internal/Pending'}
      - Address: ${customerData?.address || 'Verified Registry'}

      CHANNEL SPECIFICS:
      - Channel: ${channel} (Strictly adhere to ${channel === 'whatsapp' ? 'mobile-first, agile, subtle emojis' : 'formal, structured, header-based'} formatting).
      
      GOAL:
      Synthesize a dispatch that feels bespoke and architecturally sound. Avoid corporate jargon. 
      Be the expert mentor. Max 2 hashtags if relevant.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Use "gpt-4" or "gpt-3.5-turbo" if needed
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const aiContent = response.choices[0]?.message?.content || "Clarity failed to synthesize a response.";

    return NextResponse.json({ text: aiContent });

  } catch (error: any) {
    // Log the error for your terminal, but return a clean JSON error for the UI
    console.error("OPENAI_ROUTE_ERROR:", error);
    
    return NextResponse.json(
      { error: error.message || "An error occurred during synthesis." }, 
      { status: 500 }
    );
  }
}