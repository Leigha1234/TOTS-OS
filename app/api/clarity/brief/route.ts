import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
type CookieItem = { name: string; value: string; options?: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2] };
const str = (value: unknown) => value == null ? "" : String(value);
const label = (value: unknown) => str(value).trim() || "Untitled";
const dateOnly = (value: unknown) => str(value).slice(0, 10);
const finished = (value: unknown) => ["done", "completed", "complete", "cancelled", "canceled", "archived", "closed"].includes(str(value).toLowerCase());
const highPriority = (value: unknown) => ["high", "urgent", "critical"].includes(str(value).toLowerCase());
const isMissingTable = (message: string) => /could not find the table|relation .* does not exist/i.test(message);

export async function GET() {
  try {
    const store = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (items: CookieItem[]) => {
          for (const { name, value, options } of items) {
            try { store.set(name, value, options); } catch { /* Cookies may be read-only. */ }
          }
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("organisation_id").eq("id", user.id).maybeSingle();
    if (profileError || !profile?.organisation_id) {
      return NextResponse.json({ error: "Active organisation could not be resolved" }, { status: 400 });
    }
    const organisationId = profile.organisation_id;
    // Uses the signed-in user's session and RLS; never uses a service-role key.
    const [tasksResult, projectTasksResult, projectsResult, eventsResult, invoicesResult] = await Promise.all([
      supabase.from("tasks")
        .select("id,title,status,priority,due_date,project_id,assigned_to,assignee,user_id,is_private,deleted_at,display_type")
        .eq("organisation_id", organisationId).is("deleted_at", null).limit(1000),
      supabase.from("project_tasks")
        .select("id,name,status,priority,due_date,project_id,assignee_name")
        .eq("organisation_id", organisationId).limit(1000),
      supabase.from("projects")
        .select("id,name,status,priority,due_date,deleted_at")
        .eq("organisation_id", organisationId).is("deleted_at", null).limit(1000),
      supabase.from("events")
        .select("id,title,start_time,end_time,user_id,description,location,is_all_day")
        .eq("organisation_id", organisationId).limit(1000),
      supabase.from("invoices")
        .select("id,invoice_number,status,due_date,balance_due,amount,currency,doc_type")
        .eq("organisation_id", organisationId).limit(1000),
    ]);

    const sources = [tasksResult, projectTasksResult, projectsResult, eventsResult, invoicesResult];
    const sourceNames = ["tasks", "project_tasks", "projects", "events", "invoices"];
    const failures = sources.flatMap((result, index) => result.error ? [`${sourceNames[index]}: ${result.error.message}`] : []);
    if (failures.length) console.error("Clarity CEO brief data errors", failures);
    // Tasks and projects are required for a meaningful brief; optional sources may be absent.
    if (tasksResult.error || projectTasksResult.error || projectsResult.error) {
      return NextResponse.json({ error: "Some workspace data could not be loaded", details: failures }, { status: 503 });
    }

    const tasks = (tasksResult.data ?? []) as Row[];
    const projectTasks = (projectTasksResult.data ?? []) as Row[];
    const projects = (projectsResult.data ?? []) as Row[];
    const events = (eventsResult.data ?? []) as Row[];
    const invoices = (invoicesResult.data ?? []) as Row[];
    const timezone = "Europe/London";
    const londonDate = (value: Date) => new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(value);
    const today = londonDate(new Date());
    const eventDate = (value: unknown) => {
      const parsed = new Date(str(value));
      return Number.isNaN(parsed.getTime()) ? "" : londonDate(parsed);
    };
    const eventTime = (value: unknown) => {
      const parsed = new Date(str(value));
      return Number.isNaN(parsed.getTime()) ? "" : new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(parsed);
    };
    const projectMap = new Map(projects.map(p => [str(p.id), label(p.name)]));

    // An unassigned task can be relevant to the organisation, but is not labelled "mine".
    const open: Row[] = [
      ...tasks.filter(t => !finished(t.status) && str(t.display_type).toLowerCase() !== "event")
        .map(t => ({ ...t, label: label(t.title), source: "tasks" })),
      ...projectTasks.filter(t => !finished(t.status))
        .map(t => ({ ...t, label: label(t.name), source: "project_tasks" })),
    ];
    const mine = (t: Row) => t.source === "tasks"
      ? [t.assigned_to, t.assignee].some(v => str(v) === user.id)
        || (!t.assigned_to && !t.assignee && str(t.user_id) === user.id)
      : false; // project_tasks only has assignee_name, not a verified user ID.
    const myTasks = open.filter(mine);
    const dueToday = open.filter(t => dateOnly(t.due_date) === today);
    const overdue = open.filter(t => !!dateOnly(t.due_date) && dateOnly(t.due_date) < today);
    const urgent = open.filter(t => highPriority(t.priority));
    const eventsToday = events.filter(e => eventDate(e.start_time) === today && (!e.user_id || str(e.user_id) === user.id))
      .sort((a, b) => str(a.start_time).localeCompare(str(b.start_time)));
    const deadlines = projects.filter(p => !finished(p.status) && !!dateOnly(p.due_date) && dateOnly(p.due_date) <= today);
    const overdueInvoices = invoices.filter(i => !!dateOnly(i.due_date) && dateOnly(i.due_date) < today
      && !["paid", "void", "voided", "cancelled", "canceled", "draft"].includes(str(i.status).toLowerCase())
      && Number(i.balance_due ?? i.amount ?? 0) > 0 && str(i.doc_type).toLowerCase() !== "quote");

    const taskDescription = (t: Row) => `${label(t.label)}${t.project_id ? ` (${projectMap.get(str(t.project_id)) ?? "Project"})` : ""}${t.due_date ? ` — ${dateOnly(t.due_date)}` : ""}`;
    const priorities: string[] = [
      `TODAY · ${eventsToday.length} calendar item(s), ${dueToday.length} task(s) due, ${overdue.length} overdue`,
      ...eventsToday.slice(0, 12).map(e => `AGENDA · ${e.is_all_day ? "All day" : eventTime(e.start_time)} ${label(e.title)}`),
      ...dueToday.filter(mine).slice(0, 12).map(t => `YOUR TASK TODAY · ${taskDescription(t)}`),
      ...overdue.filter(mine).slice(0, 12).map(t => `YOUR OVERDUE TASK · ${taskDescription(t)}`),
      ...dueToday.filter(t => !mine(t)).slice(0, 10).map(t => `TEAM TASK DUE · ${taskDescription(t)}`),
      ...overdue.filter(t => !mine(t)).slice(0, 10).map(t => `TEAM TASK OVERDUE · ${taskDescription(t)}`),
      ...urgent.filter(t => !dueToday.includes(t) && !overdue.includes(t)).slice(0, 10)
        .map(t => `${mine(t) ? "YOUR HIGH PRIORITY" : "TEAM HIGH PRIORITY"} · ${taskDescription(t)}`),
      ...deadlines.slice(0, 10).map(p => `PROJECT DEADLINE · ${label(p.name)} — ${dateOnly(p.due_date)}`),
      ...overdueInvoices.slice(0, 10).map(i => `INVOICE OVERDUE · ${label(i.invoice_number ?? i.id)} — ${str(i.currency || "GBP")} ${Number(i.balance_due ?? i.amount ?? 0).toFixed(2)}`),
    ];
    if (priorities.length === 1) priorities.push("No dated tasks or appointments found today. Review undated tasks and upcoming work.");

    const warnings = [
      ...failures,
      ...(sources.some(r => (r.data?.length ?? 0) === 1000) ? ["A data source reached the 1,000-record limit; counts may be incomplete."] : []),
      ...(projectTasks.some(t => !!t.assignee_name) ? ["Project task assignees are stored as names, so they cannot be reliably matched to your login."] : []),
    ];
    return NextResponse.json({ brief: {
      date: new Date().toISOString(), timezone,
      summary: `${dueToday.length} tasks due today, ${overdue.length} overdue, ${eventsToday.length} calendar items today. ${myTasks.length} open tasks assigned to you; ${open.length} open tasks across the workspace.${failures.length ? " Some optional data could not be loaded." : ""}`,
      priorities, tasks: open, meetings: eventsToday, projects, overdueInvoices,
      counts: {
        dueToday: dueToday.length, overdue: overdue.length, urgent: urgent.length,
        myTasks: myTasks.length, projectTasks: projectTasks.length,
        eventsToday: eventsToday.length, overdueInvoices: overdueInvoices.length,
      },
      warnings,
    } });
  } catch (error) {
    console.error("Clarity CEO brief error", error);
    return NextResponse.json({ error: "Failed to generate CEO brief" }, { status: 500 });
  }
}
