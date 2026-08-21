import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn(
      "Campaign AI disabled: OPENAI_API_KEY is missing."
    );

    return NextResponse.json(
      {
        error:
          "AI service is currently unavailable.",
      },
      { status: 503 }
    );
  }

  try {
    const {
      prompt,
      tone = "friendly",
      format = "blocks",
      companyName = "Your Company",
    } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        {
          error:
            "Please describe what you want the campaign to say.",
        },
        { status: 400 }
      );
    }

    const OpenAI = (
      await import("openai")
    ).default;

    const openai =
      new OpenAI({
        apiKey,
      });

    const systemPrompt =
      format === "html"
        ? `
You are Clarity, the AI assistant inside TOTS-OS by The Organised Types.

You are writing an email marketing campaign for:
${companyName}

Tone:
${tone}

Create a polished, high-converting email campaign.

Return ONLY valid JSON in exactly this structure:

{
  "subject": "Catchy email subject",
  "previewText": "Short inbox preview text",
  "html": "<table>...</table>"
}

HTML requirements:
- Produce complete email-safe HTML.
- Use inline styles.
- Prefer table-based layouts for compatibility.
- Make the design modern, clean and premium.
- Keep maximum width around 640px.
- Make the email responsive where practical.
- Use strong headings, clear sections and CTA buttons.
- Do not include JavaScript.
- Do not include markdown.
- Do not wrap the response in code fences.
- Do not include <html>, <head> or <body> unless genuinely necessary.
- Avoid external CSS.
- All important styles must be inline.
- CTA links may use https:// placeholders where the user has not supplied a URL.
`
        : `
You are Clarity, the AI assistant inside TOTS-OS by The Organised Types.

You are writing an email marketing campaign for:
${companyName}

Tone:
${tone}

Return ONLY valid JSON in exactly this structure:

{
  "subject": "Catchy email subject",
  "previewText": "Short inbox preview text",
  "blocks": [
    {
      "type": "text",
      "content": "Email copy"
    },
    {
      "type": "button",
      "content": "Button text",
      "url": "https://"
    }
  ]
}

Allowed block types:
- text
- image
- button
- divider
- spacer

Requirements:
- Write compelling but natural marketing copy.
- Do not sound robotic or overly salesy.
- Keep paragraphs easy to scan.
- Use a strong opening hook.
- Include a clear call to action where appropriate.
- Use divider/spacer blocks only when useful.
- Do not include markdown.
- Do not wrap the response in code fences.
`;

    const response =
      await openai.chat.completions.create({
        model:
          "gpt-4-turbo-preview",

        messages: [
          {
            role: "system",
            content:
              systemPrompt,
          },
          {
            role: "user",
            content:
              prompt.trim(),
          },
        ],

        temperature: 0.7,

        response_format: {
          type: "json_object",
        },
      });

    const raw =
      response.choices[0]
        ?.message
        ?.content;

    if (!raw) {
      throw new Error(
        "Clarity returned an empty response."
      );
    }

    const parsed =
      JSON.parse(raw);

    return NextResponse.json(
      parsed
    );
  } catch (error: any) {
    console.error(
      "CAMPAIGN_AI_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Clarity could not generate the campaign.",
      },
      { status: 500 }
    );
  }
}