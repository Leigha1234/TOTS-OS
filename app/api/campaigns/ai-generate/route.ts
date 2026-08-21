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

    const openai = new OpenAI({
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
  "title": "Short internal campaign title",
  "subject": "Catchy email subject",
  "previewText": "Short inbox preview text",
  "html": "<table>...</table>"
}

Campaign title requirements:
- "title" is the internal campaign name shown inside TOTS-OS.
- Keep the title concise, normally 3-7 words.
- The title should clearly describe the campaign.
- Do not simply copy the subject line word-for-word.
- Make it useful for someone looking back through their campaign list later.

Subject requirements:
- Make the subject engaging and relevant.
- Keep it concise.
- Avoid spammy wording.
- Do not use excessive punctuation or capital letters.

Preview text requirements:
- Write a short inbox preview that complements the subject.
- Do not simply repeat the subject.
- Keep it natural and enticing.

HTML requirements:
- Produce complete email-safe HTML.
- Use inline styles.
- Prefer table-based layouts for compatibility.
- Make the design modern, clean and premium.
- Keep maximum width around 640px.
- Make the email responsive where practical.
- Use strong headings, clear sections and CTA buttons.
- Make the copy easy to scan.
- Use sensible spacing and hierarchy.
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
  "title": "Short internal campaign title",
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

Campaign title requirements:
- "title" is the internal campaign name shown inside TOTS-OS.
- Keep the title concise, normally 3-7 words.
- The title should clearly describe the campaign.
- Do not simply copy the subject line word-for-word.
- Make it useful for someone looking back through their campaign list later.

Subject requirements:
- Make the subject engaging and relevant.
- Keep it concise.
- Avoid spammy wording.
- Do not use excessive punctuation or capital letters.

Preview text requirements:
- Write a short inbox preview that complements the subject.
- Do not simply repeat the subject.
- Keep it natural and enticing.

Content requirements:
- Write compelling but natural marketing copy.
- Do not sound robotic or overly salesy.
- Keep paragraphs easy to scan.
- Use a strong opening hook.
- Include a clear call to action where appropriate.
- Use divider and spacer blocks only when they genuinely improve the layout.
- Only include image blocks if an image would genuinely strengthen the campaign.
- If you include an image block and no image URL has been supplied, leave imageUrl as an empty string.
- Button URLs may use https:// when the user has not supplied a destination.
- Do not include markdown.
- Do not wrap the response in code fences.
`;

    const response =
      await openai.chat.completions.create({
        model: "gpt-5.6-luna",

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

    let parsed: any;

    try {
      parsed =
        JSON.parse(raw);
    } catch {
      console.error(
        "CAMPAIGN_AI_INVALID_JSON:",
        raw
      );

      throw new Error(
        "Clarity returned an invalid response."
      );
    }

    const title =
      typeof parsed.title ===
      "string"
        ? parsed.title.trim()
        : "";

    const subject =
      typeof parsed.subject ===
      "string"
        ? parsed.subject.trim()
        : "";

    const previewText =
      typeof parsed.previewText ===
      "string"
        ? parsed.previewText.trim()
        : "";

    if (format === "html") {
      const html =
        typeof parsed.html ===
        "string"
          ? parsed.html
          : "";

      if (!html.trim()) {
        throw new Error(
          "Clarity did not generate any email HTML."
        );
      }

      return NextResponse.json({
        title:
          title ||
          subject ||
          "AI Campaign",

        subject:
          subject ||
          title ||
          "New campaign",

        previewText,

        html,
      });
    }

    const allowedTypes =
      new Set([
        "text",
        "image",
        "button",
        "divider",
        "spacer",
      ]);

    const blocks =
      Array.isArray(
        parsed.blocks
      )
        ? parsed.blocks
            .map(
              (block: any) => {
                const type =
                  allowedTypes.has(
                    block?.type
                  )
                    ? block.type
                    : "text";

                return {
                  type,

                  content:
                    typeof block?.content ===
                    "string"
                      ? block.content
                      : "",

                  url:
                    typeof block?.url ===
                    "string"
                      ? block.url
                      : "",

                  imageUrl:
                    typeof block?.imageUrl ===
                    "string"
                      ? block.imageUrl
                      : "",
                };
              }
            )
            .filter(
              (block: any) =>
                block.type !==
                  "text" ||
                block.content.trim()
            )
        : [];

    if (
      blocks.length === 0
    ) {
      throw new Error(
        "Clarity did not generate any campaign content."
      );
    }

    return NextResponse.json({
      title:
        title ||
        subject ||
        "AI Campaign",

      subject:
        subject ||
        title ||
        "New campaign",

      previewText,

      blocks,
    });
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