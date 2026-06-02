Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));

  console.log("AI Triage received:", body);

  // TODO: your AI logic here

  return new Response(
    JSON.stringify({
      success: true,
      message: "ai-triage processed",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});