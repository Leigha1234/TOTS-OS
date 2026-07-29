import { serve } from "https://deno.land/std@0.224.0/http/server.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();

    const {
      message,
      history = [],
      context = {},
      memory = [],
    } = body;

    if (!message) {
      return new Response(
        JSON.stringify({
          error: "Message is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openAiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const systemPrompt = `
You are Clarity, the AI operating system inside TOTS-OS.

You are a business intelligence assistant for company owners and managers.

Your job:
- analyse business data
- identify priorities
- highlight risks
- find opportunities
- provide actionable next steps
- help manage projects, customers, sales, finance and operations

Answer like a proactive CEO assistant, not a generic chatbot.

Business context:
${JSON.stringify(context)}

User memory:
${JSON.stringify(memory)}

Keep responses concise, structured and practical.
Use bullet points where useful.
`;

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...history.map((item: any) => ({
        role: item.role,
        content: item.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    const completionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages,
        temperature: 0.4,
      }),
    });

    if (!completionResponse.ok) {
      throw new Error(`OpenAI request failed: ${completionResponse.status}`);
    }

    const completion = await completionResponse.json();

    const answer =
      completion.choices?.[0]?.message?.content ||
      "I was unable to generate a response.";

    return new Response(
      JSON.stringify({
        answer,
        metadata: {
          model: "clarity",
          historyUsed: history.length,
          contextLoaded: Object.keys(context).length > 0,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Clarity AI error:", error);

    return new Response(
      JSON.stringify({
        error: "Clarity failed to respond",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
