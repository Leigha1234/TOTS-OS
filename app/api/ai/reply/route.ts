import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const prompt = `
You are a CRM assistant. Suggest a short, professional reply.

Conversation:
${messages.map((m:any) => `${m.direction}: ${m.body}`).join("\n")}
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();

  return NextResponse.json({
    suggestion: data.choices?.[0]?.message?.content
  });
}