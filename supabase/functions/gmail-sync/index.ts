Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));

  console.log("Gmail sync triggered:", body);

  // TODO: your Gmail sync logic here

  return new Response(
    JSON.stringify({
      success: true,
      message: "gmail-sync processed",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});