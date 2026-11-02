import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const str = (v: unknown) => (v == null ? "" : String(v));
const done = (v: unknown) => ["done", "completed", "complete", "cancelled", "canceled", "archived"].includes(str(v).toLowerCase());
const dateOnly = (v: unknown) => str(v).slice(0, 10);
const name = (v: unknown) => str(v).trim() || "Untitled";

export async function GET() {
  try {
    const store = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => store.getAll(),
          setAll: (items: { name: string; value: string; options?: Parameters<typeof store.set>[2] }[]) => {
            for (const { name, value, options } of items) {
              try { store.set(name, value, options); } catch { /* Read-only render context */ }
            }
          },
        },
      }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("organisation_id").eq("id", user.id).maybeSingle();
    if (profileError || !profile?.organisation_id) {
      return NextResponse.json({ error: "Active organisation could not be resolved" }, { status: 400 });
    }
    const org = profile.organisation_id;
    // This endpoint uses the caller's authenticated Supabase session (RLS), never a service-role key.
    // Limit the response to the active organisation, including project tasks.
    const results = await Promise.all([
      supabase.from("tasks").select("id,title,status,priority,due_date,project_id,assigned_to,assignee,user_id,is_private,deleted_at,display_type").eq("organisation_id", org).is("deleted_at", null).limit(1000),
      supabase.from("project_tasks").select("id,name,status,priority,due_date,project_id,assignee_name").eq("organisation_id", org).limit(1000),
      supabase.from("projects").select("id,name,status,priority,due_date,deleted_at").eq("organisation_id", org).is("deleted_at", null).limit(1000),
      supabase.from("calendar_events").select("*").eq("organisation_id", org).limit(1000),
      supabase.from("invoices").select("id,invoice_number,status,due_date,balance_due,amount,currency,doc_type").eq("organisation_id", org).limit(1000),
    ]);
    const labels = ["tasks", "project_tasks", "projects", "calendar_events", "invoices"];
    const failures = results.flatMap((r, i) => r.error ? [`${labels[i]}: ${r.error.message}`] : []);
    // Do not show misleading zeroes when an essential data source failed.
    if (results.slice(0, 4).some(r => r.error)) {
      console.error("Clarity CEO brief data errors", failures);
      return NextResponse.json({ error: "Some workspace data could not be loaded", details: failures }, { status: 503 });
    }
    const [tasks, projectTasks, projects, events, invoices] = results.map(r => (r.data || []) as Row[]);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const projectMap = new Map(projects.map(p => [str(p.id), name(p.name)]));
    const open: Row[] = [
      ...tasks.filter(t => !done(t.status) && str(t.display_type).toLowerCase() !== "event").map(t => ({ ...t, label: name(t.title), source: "tasks" })),
      ...projectTasks.filter(t => !done(t.status)).map(t => ({ ...t, label: name(t.name), source: "project_tasks" })),
    ];
    const dueToday = open.filter(t => dateOnly(t.due_date) === today);
    const overdue = open.filter(t => dateOnly(t.due_date) && dateOnly(t.due_date) < today);
    const urgent = open.filter(t => ["urgent", "high", "critical"].includes(str(t.priority).toLowerCase()));
    const myTasks = open.filter(t => [t.assigned_to, t.assignee, t.user_id].some(v => str(v) === user.id));
    const eventsToday = events.filter(e => dateOnly(e.start_at ?? e.start_time ?? e.date ?? e.event_date) === today)
      .sort((a, b) => str(a.start_at ?? a.start_time).localeCompare(str(b.start_at ?? b.start_time)));
    const deadlines = projects.filter(p => !done(p.status) && dateOnly(p.due_date) && dateOnly(p.due_date) <= today);
    const overdueInvoices = invoices.filter(i => dateOnly(i.due_date) && dateOnly(i.due_date) < today && !["paid", "void", "voided", "cancelled", "draft"].includes(str(i.status).toLowerCase()) && Number(i.balance_due ?? i.amount ?? 0) > 0 && str(i.doc_type).toLowerCase() !== "quote");
    const taskDescription = (t: Row) => `${str(t.label)}${t.project_id ? ` (${projectMap.get(str(t.project_id)) || "Project"})` : ""}${t.due_date ? ` — ${dateOnly(t.due_date)}` : ""}`;
    const priorities: string[] = [
      `TODAY · ${eventsToday.length} calendar item(s), ${dueToday.length} task(s) due, ${overdue.length} overdue`,
      ...eventsToday.slice(0, 12).map(e => `AGENDA · ${str(e.start_at ?? e.start_time ?? e.date ?? "").slice(11, 16)} ${name(e.title ?? e.name ?? e.summary)}`),
      ...dueToday.slice(0, 15).map(t => `DUE TODAY · ${taskDescription(t)}`),
      ...overdue.slice(0, 15).map(t => `OVERDUE · ${taskDescription(t)}`),
      ...urgent.filter(t => !dueToday.includes(t) && !overdue.includes(t)).slice(0, 10).map(t => `HIGH PRIORITY · ${taskDescription(t)}`),
      ...deadlines.slice(0, 10).map(p => `PROJECT DEADLINE · ${name(p.name)} — ${dateOnly(p.due_date)}`),
      ...overdueInvoices.slice(0, 10).map(i => `INVOICE OVERDUE · ${name(i.invoice_number ?? i.id)} — ${str(i.currency || "GBP")} ${Number(i.balance_due ?? i.amount).toFixed(2)}`),
    ];
    if (priorities.length === 1) priorities.push("No dated tasks or appointments found for today. Review undated tasks and upcoming work.");
    return NextResponse.json({ brief: {
      date: new Date().toISOString(), timezone: "Europe/London",
      summary: `${dueToday.length} tasks due today, ${overdue.length} overdue, ${eventsToday.length} calendar items today. ${myTasks.length} open tasks linked to your user account; ${open.length} open tasks across both task tables.${failures.length ? " Some optional data could not be loaded." : ""}`,
      priorities, tasks: open, meetings: eventsToday, projects, overdueInvoices,
      counts: { dueToday: dueToday.length, overdue: overdue.length, urgent: urgent.length, myTasks: myTasks.length, projectTasks: projectTasks.length, eventsToday: eventsToday.length, overdueInvoices: overdueInvoices.length },
      warnings: [...failures, ...(tasks.length === 1000 || projectTasks.length === 1000 || events.length === 1000 ? ["At least one data source reached its 1,000-record safety limit; counts may be incomplete."] : [])],
    } });
  } catch (error) {
    console.error("Clarity CEO brief error", error);
    return NextResponse.json({ error: "Failed to generate CEO brief" }, { status: 500 });
  }
}
