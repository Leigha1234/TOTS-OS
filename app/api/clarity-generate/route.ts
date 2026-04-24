import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // 1. Check for the key
  const apiKey = process.env.OPENAI_API_KEY;
  
  // 2. If key is missing, return a clean error instead of crashing
  if (!apiKey) {
    console.warn("AI features are currently disabled: OPENAI_API_KEY is missing.");
    return NextResponse.json(
      { error: "AI service is currently unavailable. Please configure API settings." }, 
      { status: 503 }
    );
  }

  // 3. Lazy-load the SDK only if the key exists
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey });

  try {
    const { prompt, channel, customerData } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    const systemPrompt = `
      You are Clarity, the AI soul of 'The Organised Types'. 
      Tone: Minimalist, sophisticated, utilitarian, calm.
      Channel: ${channel}.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const aiContent = response.choices[0]?.message?.content || "Clarity failed to synthesize.";
    return NextResponse.json({ text: aiContent });

  } catch (error: any) {
    console.error("OPENAI_ROUTE_ERROR:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred." }, 
      { status: 500 }
    );
  }
}