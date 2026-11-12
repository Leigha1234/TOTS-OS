/* Read-only Stripe reconciliation. Run from project root with env vars loaded. */
const fs = require('node:fs');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
for (const k of ['STRIPE_SECRET_KEY','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']) if (!process.env[k]) throw Error(`Missing ${k}`);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
const csv = x => '"'+String(x??'').replace(/"/g,'""')+'"';
async function main(){
 let rows=[];
 for(let offset=0;;offset+=500){
  const {data,error}=await db.from('store_orders').select('id,organisation_id,order_number,stripe_checkout_session_id,stripe_account_id,payment_status,total,created_at').eq('payment_status','pending').order('created_at',{ascending:false}).range(offset,offset+499);
  if(error)throw error;rows.push(...data);if(data.length<500)break;
 }
 console.log(`Auditing ${rows.length} pending orders (READ ONLY)`);
 const results=[];
 for(const o of rows){
  const result={order_number:o.order_number,organisation_id:o.organisation_id,account:o.stripe_account_id,amount:o.total,session:o.stripe_checkout_session_id,stripe_status:'',payment_status:'',payment_intent:'',customer_email:'',finding:''};
  try{
   if(!o.stripe_checkout_session_id || !o.stripe_account_id){result.finding='NO_SESSION_OR_ACCOUNT';}
   else{
    const s=await stripe.checkout.sessions.retrieve(o.stripe_checkout_session_id,{}, {stripeAccount:o.stripe_account_id});
    result.stripe_status=s.status;result.payment_status=s.payment_status;result.payment_intent=typeof s.payment_intent==='string'?s.payment_intent:'';result.customer_email=s.customer_details?.email||'';
    const matches=Number.isFinite(Number(o.total)) && s.amount_total===Math.round(Number(o.total)*100) && s.currency==='gbp';
    const orgMatches=!s.metadata?.organisation_id || s.metadata.organisation_id===o.organisation_id;
    const orderMatches=!s.metadata?.order_id || s.metadata.order_id===o.id;
    result.finding=!matches?'AMOUNT_OR_CURRENCY_MISMATCH':!orgMatches||!orderMatches?'METADATA_MISMATCH':s.status==='complete'&&s.payment_status==='paid'?'PAID_NEEDS_WEBHOOK_REPLAY':s.status==='complete'&&s.payment_status==='no_payment_required'?'FREE_CHECKOUT_REVIEW':s.status==='expired'?'EXPIRED_UNPAID':`NOT_CONFIRMED_${s.payment_status||s.status}`;
   }
  }catch(e){result.finding='STRIPE_LOOKUP_ERROR';result.error=String(e.message||e).slice(0,220);}
  results.push(result);console.log(`${result.finding.padEnd(30)} ${o.order_number}`);
 }
 const headers=['order_number','organisation_id','account','amount','session','stripe_status','payment_status','payment_intent','customer_email','finding','error'];
 const file='pending-store-orders-audit.csv';
 fs.writeFileSync(file,[headers.join(','),...results.map(r=>headers.map(h=>csv(r[h])).join(','))].join('\n'));
 console.log('\nSummary:',results.reduce((a,r)=>(a[r.finding]=(a[r.finding]||0)+1,a),{}));
 console.log(`Saved ${file}. No database changes made.`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
