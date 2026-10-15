import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const num = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
const iso = (v: unknown) => typeof v === 'string' ? v : '';
const inRange = (v: unknown, from: string, to: string) => { const d=iso(v).slice(0,10); return !!d && d>=from && d<=to; };
const done = (v: unknown) => ['completed','complete','done','finished','closed','cancelled','canceled','archived'].includes(String(v||'').toLowerCase());
const paid = (v: unknown) => ['paid','succeeded','completed','complete'].includes(String(v||'').toLowerCase());
export async function GET(request: NextRequest) {
 try {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!service) return NextResponse.json({error:'Supabase configuration missing.'},{status:503});
  const token=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  if(!token) return NextResponse.json({error:'Please sign in.'},{status:401});
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await auth.auth.getUser(token);
  if(authError||!user) return NextResponse.json({error:'Session expired.'},{status:401});
  const org=request.nextUrl.searchParams.get('organisation_id')||'';
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(org)) return NextResponse.json({error:'Invalid organisation.'},{status:400});
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const [membership,ownership]=await Promise.all([
    db.from('organisation_members').select('id').eq('organisation_id',org).eq('user_id',user.id).limit(1),
    db.from('organisations').select('id').eq('id',org).eq('created_by',user.id).limit(1)
  ]);
  if(membership.error||ownership.error) {console.error('Insights access check failed',membership.error,ownership.error);return NextResponse.json({error:'Unable to verify organisation access.'},{status:500});}
  if(!membership.data?.length&&!ownership.data?.length) return NextResponse.json({error:'You do not have access to this organisation.'},{status:403});
  const today=new Date().toISOString().slice(0,10);
  const days=Math.min(366,Math.max(7,Number(request.nextUrl.searchParams.get('days')||30)||30));
  const fromDate=new Date(Date.now()-(days-1)*86400000).toISOString().slice(0,10);
  const next30=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
  const tables=['invoices','expenses','store_orders','store_products','store_subscriptions','subscriptions','projects','tasks','project_tasks','events','bookings','customers'] as const;
  async function all(table:string) { const rows:Record<string,any>[]=[]; for(let start=0;start<100000;start+=1000){ let query=db.from(table).select('*').range(start,start+999); if(table!=='store_order_items')query=query.eq('organisation_id',org); const {data,error}=await query; if(error) throw new Error(`${table}: ${error.message}`); rows.push(...(data||[]));if(!data||data.length<1000)break;} return rows; }
  // Store order items have no organisation_id; restrict them to verified organisation orders below.
  const fetched=await Promise.all(tables.map(t=>all(t)));
  const data=Object.fromEntries(tables.map((t,i)=>[t,fetched[i]])) as Record<string,Record<string,any>[]>;
  const invoices=data.invoices.filter(x=>!['void','voided','cancelled','canceled','draft'].includes(String(x.status||'').toLowerCase()));
  const overdueInvoices=invoices.filter(x=>num(x.balance_due)>0 && iso(x.due_date).slice(0,10)<today && !!x.due_date);
  const invoicePaid=invoices.filter(x=>inRange(x.paid_at,fromDate,today)).reduce((s,x)=>s+num(x.amount_paid),0);
  const expenses=data.expenses.filter(x=>inRange(x.date||x.created_at,fromDate,today)&&!['void','cancelled','canceled'].includes(String(x.status||'').toLowerCase()));
  const orders=data.store_orders.filter(x=>paid(x.payment_status)&&inRange(x.paid_at||x.checkout_completed_at||x.created_at,fromDate,today));
  const orderIds=new Set(orders.map(x=>x.id));
  const items:Record<string,any>[]=[];
  const ids=[...orderIds];
  for(let i=0;i<ids.length;i+=100){const {data:rows,error:itemError}=await db.from('store_order_items').select('id,order_id,product_id,product_name,quantity,total').in('order_id',ids.slice(i,i+100));if(itemError)throw new Error(itemError.message);items.push(...(rows||[]));}
  const productMap=new Map<string,{id:string;name:string;units:number;revenue:number;orders:Set<string>}>();
  for(const item of items){const key=String(item.product_id||item.product_name||item.id);const row=productMap.get(key)||{id:key,name:String(item.product_name||'Unnamed product'),units:0,revenue:0,orders:new Set<string>()};row.units+=num(item.quantity);row.revenue+=num(item.total);row.orders.add(item.order_id);productMap.set(key,row);}
  const products=[...productMap.values()].map(({orders,...rest})=>({...rest,orders:orders.size})).sort((a,b)=>b.revenue-a.revenue);
  const activeSubscriptions=data.store_subscriptions.filter(x=>['active','trialing'].includes(String(x.status||'').toLowerCase()));
  const intervalMonthly=(amount:number,interval:unknown)=>{const i=String(interval||'month').toLowerCase();return i.includes('year')?amount/12:i.includes('week')?amount*52/12:i.includes('day')?amount*365/12:amount;};
  const storeMrr=activeSubscriptions.reduce((s,x)=>s+intervalMonthly(num(x.unit_amount_pence)/100*num(x.quantity||1),x.billing_interval),0);
  const otherSubscriptions=data.subscriptions.filter(x=>x.active===true||String(x.status||'').toLowerCase()==='active');
  const otherMrr=otherSubscriptions.reduce((s,x)=>s+intervalMonthly(num(x.amount),x.interval),0);
  const activeProjects=data.projects.filter(x=>!x.deleted_at&&!done(x.status));
  const allTasks=[...data.tasks.filter(x=>!x.deleted_at),...data.project_tasks];
  const overdueTasks=allTasks.filter(x=>!done(x.status)&&!!x.due_date&&iso(x.due_date).slice(0,10)<today);
  const upcomingEvents=data.events.filter(x=>iso(x.start_time).slice(0,10)>=today&&iso(x.start_time).slice(0,10)<=next30);
  const upcomingBookings=data.bookings.filter(x=>iso(x.start_time).slice(0,10)>=today&&iso(x.start_time).slice(0,10)<=next30&&!['cancelled','canceled'].includes(String(x.status||'').toLowerCase()));
  const storeRevenue=orders.reduce((s,x)=>s+num(x.total)-num(x.refunded_amount),0);
  const result={period:{from:fromDate,to:today,days},finance:{invoicePayments:invoicePaid,storeRevenue,expenses:expenses.reduce((s,x)=>s+num(x.amount),0),outstanding:invoices.reduce((s,x)=>s+Math.max(0,num(x.balance_due)),0),overdueAmount:overdueInvoices.reduce((s,x)=>s+num(x.balance_due),0),overdueCount:overdueInvoices.length,overdueInvoices:overdueInvoices.slice(0,30).map(x=>({id:x.id,number:x.invoice_number,due_date:x.due_date,balance_due:x.balance_due,customer_id:x.customer_id})),invoicesIssued:invoices.filter(x=>inRange(x.invoice_date||x.created_at,fromDate,today)).length},store:{revenue:storeRevenue,orders:orders.length,units:items.reduce((s,x)=>s+num(x.quantity),0),averageOrder:orders.length?storeRevenue/orders.length:0,products:products.slice(0,50)},subscriptions:{active:activeSubscriptions.length,storeMrr,otherActive:otherSubscriptions.length,otherMrr,totalMrr:storeMrr+otherMrr},work:{activeProjects:activeProjects.length,overdueProjects:activeProjects.filter(x=>!!x.due_date&&iso(x.due_date).slice(0,10)<today).length,overdueTasks:overdueTasks.length,dueToday:allTasks.filter(x=>!done(x.status)&&iso(x.due_date).slice(0,10)===today).length,totalTasks:allTasks.length,overdueTaskItems:overdueTasks.slice(0,25).map(x=>({id:x.id,title:x.title||x.name,due_date:x.due_date,project_id:x.project_id}))},calendar:{upcomingEvents:upcomingEvents.length,upcomingBookings:upcomingBookings.length,events:upcomingEvents.slice(0,15).map(x=>({id:x.id,title:x.title,start_time:x.start_time}))},customers:{total:data.customers.length,new:data.customers.filter(x=>inRange(x.created_at,fromDate,today)).length},notes:['Store revenue and invoice payments are shown separately to avoid assuming they are distinct income sources.','Invoice payments shown use paid invoices; partial payments outside the selected paid date may not be represented.','MRR is a run rate, not cash received. Legacy and Store subscriptions may overlap; review before adding them together.','Event and booking counts may overlap if a booking creates an event.']};
  return NextResponse.json(result,{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){console.error('Insights report error',e);return NextResponse.json({error:'Could not load Insights. Check server logs and table permissions.'},{status:500});}
}
