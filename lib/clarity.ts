// 🧠 CLARITY AI - PERSONAL ASSISTANT ENGINE

export function generateInsights(
  invoices: any[] = [],
  tasks: any[] = [],
  context: string = "dashboard" // Default context
) {
  const messages: string[] = [];
  const actions: string[] = [];
  const now = new Date();

  // Helper for PA tone
  const welcome = context === "dashboard" ? "Good morning! " : "";

  // 💰 FINANCE CONTEXT LOGIC
  if (context === "finance" || context === "dashboard") {
    const unpaid = invoices.filter(i => i.status !== "paid");
    const overdue = unpaid.filter(i => i.due_date && new Date(i.due_date) < now);
    const totalOverdue = overdue.reduce((s, i) => s + Number(i.amount || 0), 0);

    if (overdue.length > 0) {
      messages.push(
        `${welcome}I’ve noticed ${overdue.length} invoice${overdue.length > 1 ? "s are" : " is"} slightly past due (about £${totalOverdue}). Would you like me to draft a friendly nudge for those clients?`
      );
      actions.push("Draft nudge emails");
    } else if (unpaid.length > 0) {
      messages.push("Your cash flow looks healthy. Most pending payments are well within their terms.");
    }
  }

  // 📅 TASKS CONTEXT LOGIC
  if (context === "tasks" || context === "dashboard") {
    const todayTasks = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === now.toDateString());
    const incomplete = tasks.filter(t => t.status !== "done");

    if (todayTasks.length > 0) {
      messages.push(
        `You've got ${todayTasks.length} things on your plate for today. Let's try to clear those first so you can have a relaxing evening.`
      );
      actions.push("View today's schedule");
    } else if (incomplete.length > 0) {
      messages.push(`Your schedule is clear for today! It might be a good time to chip away at some of those "someday" tasks.`);
    }
  }

  // 📈 ACCOUNTANCY / COMPLIANCE (For the new Finance features)
  if (context === "finance") {
    const revenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount || 0), 0);
    const vatEst = revenue * 0.2;
    messages.push(`Just a heads-up: based on your recent revenue, I'd suggest setting aside roughly £${vatEst.toFixed(0)} for your upcoming VAT return.`);
  }

  // 🤖 Tone Adjustment: Fallback
  if (messages.length === 0) {
    messages.push("Everything is ticking along beautifully. You're all caught up!");
  }

  return {
    headline: messages[0],
    insights: messages,
    actions: actions,
    persona: "Helpful PA"
  };
}

// Updated runClarity to accept context
export async function runClarity({ invoices, tasks, teamId, context }: any) {
  try {
    const result = generateInsights(invoices, tasks, context);
    // You could save this to a 'notifications' table in Supabase here
    return result;
  } catch (err) {
    console.error("Clarity error:", err);
    return { headline: "I'm having a little trouble fetching your updates.", insights: [], actions: [] };
  }
}