import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = Record<string, any>;
const n = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
const str = (v: unknown) => String(v ?? '').trim().toLowerCase();
const date = (v: unknown) => typeof v === 'string' ? v.slice(0, 10) : '';
const between = (v: unknown, a: string, b: string) => !!date(v) && date(v) >= a && date(v) <= b;
const day = (d: Date) => d.toISOString().slice(0, 10);
const shift = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);
const active = (v: unknown) => ['active', 'trialing'].includes(str(v));
const paid = (v: unknown) => ['paid', 'succeeded', 'completed', 'complete'].includes(str(v));
const finished = (v: unknown) => ['completed', 'complete', 'done', 'finished', 'closed', 'cancelled', 'canceled', 'archived'].includes(str(v));
const monthly = (amount: number, interval: unknown) => { const i = str(interval); return i.includes('year') ? amount / 12 : i.includes('week') ? amount * 52 / 12 : i.includes('day') ? amount * 365 / 12 : amount; };
const uuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export async function GET(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anon || !service) return NextResponse.json({ error: 'Supabase configuration missing.' }, { status: 503 });
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await auth.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

    // Resolve the same primary organisation as account/access; never trust an unverified client ID.
    const { data: profile, error: profileError } = await db.from('profiles').select('organisation_id').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    const requested = request.nextUrl.searchParams.get('organisation_id') || '';
    if (requested && !uuid(requested)) return NextResponse.json({ error: 'Invalid organisation.' }, { status: 400 });
    let org = requested || profile?.organisation_id || '';
    if (!org) {
      const { data, error } = await db.from('organisation_members').select('organisation_id').eq('user_id', user.id).limit(1);
      if (error) throw error;
      org = data?.[0]?.organisation_id || '';
    }
    if (!org) {
      const { data, error } = await db.from('user_organisations').select('organisation_id').eq('user_id', user.id).limit(1);
      if (!error) org = data?.[0]?.organisation_id || '';
    }
    if (!org) {
      const { data, error } = await db.from('organisations').select('id').eq('created_by', user.id).limit(1);
      if (error) throw error;
      org = data?.[0]?.id || '';
    }
    if (!uuid(org)) return NextResponse.json({ error: 'No active organisation found.' }, { status: 403 });
    const [member, owner, legacyMember] = await Promise.all([
      db.from('organisation_members').select('organisation_id').eq('organisation_id', org).eq('user_id', user.id).limit(1),
      db.from('organisations').select('id,name,billing_model').eq('id', org).eq('created_by', user.id).limit(1),
      db.from('user_organisations').select('organisation_id').eq('organisation_id', org).eq('user_id', user.id).limit(1),
    ]);
    const isMember = !!member.data?.length || !!owner.data?.length || !!legacyMember.data?.length || profile?.organisation_id === org;
    if (!isMember) return NextResponse.json({ error: 'You do not have access to this organisation.' }, { status: 403 });
    const { data: orgInfo } = await db.from('organisations').select('id,name,billing_model').eq('id', org).maybeSingle();
    const { data: moduleRows } = await db.from('organisation_modules').select('module_key,status').eq('organisation_id', org).eq('status', 'active');
    const modules = orgInfo?.billing_model === 'modular' ? (moduleRows || []).map(x => x.module_key) : ['core','clientsProjects','finance','social','email','store'];

    const days = Math.min(365, Math.max(7, Number(request.nextUrl.searchParams.get('days') || 30) || 30));
    const now = new Date(); const today = day(now); const from = day(shift(now, -(days - 1)));
    const prevTo = day(shift(now, -days)); const prevFrom = day(shift(now, -(days * 2 - 1)));
    const next30 = day(shift(now, 30));
    const warnings: string[] = [];
    async function rows(table: string): Promise<Row[]> {
      const output: Row[] = [];
      for (let offset = 0; offset < 100000; offset += 1000) {
        const { data, error } = await db.from(table).select('*').eq('organisation_id', org).range(offset, offset + 999);
        if (error) { warnings.push(`${table}: ${error.message}`); return []; }
        output.push(...(data || [])); if (!data || data.length < 1000) break;
      }
      return output;
    }
    const names = ['invoices','expenses','store_orders','store_subscriptions','subscriptions','projects','tasks','project_tasks','events','bookings','customers'];
    const values = await Promise.all(names.map(rows));
    const tables = Object.fromEntries(names.map((key, i) => [key, values[i]])) as Record<string, Row[]>;
    const invoices = tables.invoices.filter(x => !['void','voided','cancelled','canceled','draft'].includes(str(x.status)));
    const overdue = invoices.filter(x => n(x.balance_due) > 0 && !!date(x.due_date) && date(x.due_date) < today);
    const orders = tables.store_orders.filter(x => paid(x.payment_status));
    const selectedOrders = orders.filter(x => between(x.paid_at || x.checkout_completed_at || x.created_at, from, today));
    const previousOrders = orders.filter(x => between(x.paid_at || x.checkout_completed_at || x.created_at, prevFrom, prevTo));
    const orderRevenue = (arr: Row[]) => arr.reduce((sum, x) => sum + n(x.total) - n(x.refunded_amount), 0);
    const storeRevenue = orderRevenue(selectedOrders);
    const previousRevenue = orderRevenue(previousOrders);
    const ids = selectedOrders.map(x => x.id).filter(Boolean);
    const items: Row[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await db.from('store_order_items').select('id,order_id,product_id,product_name,quantity,total').in('order_id', ids.slice(i, i + 100));
      if (error) { warnings.push(`store_order_items: ${error.message}`); break; }
      items.push(...(data || []));
    }
    const productsMap = new Map<string, { id: string; name: string; units: number; revenue: number; orders: Set<string> }>();
    for (const item of items) {
      const id = String(item.product_id || item.product_name || item.id);
      const entry = productsMap.get(id) || { id, name: String(item.product_name || 'Unnamed product'), units: 0, revenue: 0, orders: new Set<string>() };
      entry.units += n(item.quantity); entry.revenue += n(item.total); entry.orders.add(item.order_id); productsMap.set(id, entry);
    }
    const products = [...productsMap.values()].map(({ orders, ...x }) => ({ ...x, orders: orders.size })).sort((a,b) => b.revenue - a.revenue);
    const storeSubs = tables.store_subscriptions.filter(x => active(x.status));
    const storeMrr = storeSubs.reduce((s,x) => s + monthly(n(x.unit_amount_pence) / 100 * n(x.quantity || 1), x.billing_interval), 0);
    const otherSubs = tables.subscriptions.filter(x => x.active === true || active(x.status));
    const otherMrr = otherSubs.reduce((s,x) => s + monthly(n(x.amount), x.interval), 0);
    const plans = new Map<string, { name: string; count: number; mrr: number }>();
    for (const x of storeSubs) {
      const name = String(x.plan_name || x.plan_label || x.product_name || x.price_name || x.plan_code || 'Uncategorised');
      const row = plans.get(name) || { name, count: 0, mrr: 0 }; row.count++; row.mrr += monthly(n(x.unit_amount_pence) / 100 * n(x.quantity || 1), x.billing_interval); plans.set(name, row);
    }
    const activeProjects = tables.projects.filter(x => !x.deleted_at && !finished(x.status));
    const tasks = [...tables.tasks.filter(x => !x.deleted_at), ...tables.project_tasks.filter(x => !x.deleted_at)];
    const overdueTasks = tasks.filter(x => !finished(x.status) && !!date(x.due_date) && date(x.due_date) < today);
    const events = tables.events.filter(x => between(x.start_time || x.starts_at, today, next30));
    const bookings = tables.bookings.filter(x => between(x.start_time || x.starts_at, today, next30) && !['cancelled','canceled'].includes(str(x.status)));
    const expenses = tables.expenses.filter(x => between(x.date || x.created_at, from, today) && !['void','cancelled','canceled'].includes(str(x.status)));
    const invoicePaid = invoices.filter(x => between(x.paid_at, from, today)).reduce((s,x) => s + n(x.amount_paid), 0);
    const refunded = selectedOrders.reduce((s,x) => s + n(x.refunded_amount), 0);
    const failedPayments = tables.store_orders.filter(x => ['failed','payment_failed'].includes(str(x.payment_status)) && between(x.created_at, from, today)).length;
    const trend = Array.from({ length: days }, (_, i) => { const d = day(shift(new Date(from + 'T12:00:00Z'), i)); return { date: d, revenue: selectedOrders.filter(x => date(x.paid_at || x.checkout_completed_at || x.created_at) === d).reduce((s,x) => s + n(x.total) - n(x.refunded_amount), 0) }; });
    return NextResponse.json({
      organisation: { id: org, name: orgInfo?.name || 'Your organisation' }, modules,
      period: { from, to: today, days },
      finance: { invoicePayments: invoicePaid, storeRevenue, expenses: expenses.reduce((s,x) => s + n(x.amount), 0), outstanding: invoices.reduce((s,x) => s + Math.max(0,n(x.balance_due)),0), overdueAmount: overdue.reduce((s,x) => s+n(x.balance_due),0), overdueCount: overdue.length, overdueInvoices: overdue.slice(0,30).map(x => ({id:x.id,number:x.invoice_number,due_date:x.due_date,balance_due:x.balance_due})), invoicesIssued: invoices.filter(x => between(x.invoice_date || x.created_at,from,today)).length, refunds: refunded, failedPayments },
      store: { revenue: storeRevenue, previousRevenue, growthPercent: previousRevenue > 0 ? (storeRevenue - previousRevenue) / previousRevenue * 100 : null, orders: selectedOrders.length, units: items.reduce((s,x) => s+n(x.quantity),0), averageOrder: selectedOrders.length ? storeRevenue / selectedOrders.length : 0, products: products.slice(0,50), trend },
      subscriptions: { active: storeSubs.length, storeMrr, otherActive: otherSubs.length, otherMrr, totalMrr: storeMrr+otherMrr, plans: [...plans.values()].sort((a,b)=>b.mrr-a.mrr) },
      work: { activeProjects: activeProjects.length, overdueProjects: activeProjects.filter(x => !!date(x.due_date) && date(x.due_date) < today).length, overdueTasks: overdueTasks.length, dueToday: tasks.filter(x => !finished(x.status) && date(x.due_date) === today).length, totalTasks: tasks.length, overdueTaskItems: overdueTasks.slice(0,25).map(x=>({id:x.id,title:x.title||x.name,due_date:x.due_date})) },
      calendar: { upcomingEvents: events.length, upcomingBookings: bookings.length, events: events.slice(0,15).map(x=>({id:x.id,title:x.title||x.name,start_time:x.start_time||x.starts_at})) },
      customers: { total: tables.customers.length, new: tables.customers.filter(x=>between(x.created_at,from,today)).length },
      notes: ['Store revenue and invoice payments may overlap; they are not added together.', 'Invoice payments are based on paid_at and may exclude partial payments.', 'Subscription MRR is an estimate, not cash received. Store and legacy subscriptions may overlap.', 'Store revenue trends use recorded order payment dates.'],
      warnings,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) {
    console.error('Insights report error', e);
    return NextResponse.json({ error: 'Could not load Insights. Check server logs.' }, { status: 500 });
  }
}
