/* Match verified paid checkout sessions to their ORIGINAL Stripe events and replay via Stripe CLI.
   Default is read-only. --apply resends only matched, still-pending orders. */
const Stripe=require('stripe');
const {createClient}=require('@supabase/supabase-js');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const required=['STRIPE_SECRET_KEY','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'];
for(const k of required)if(!process.env[k])throw Error('Missing '+k);
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const destination='we_1UM0sd1TJB5xkUljqK2lgWoB';
const targets=[
 ['TOTS-40356824-D6GP','acct_1ULLnG1LoZ4IqUbK'],
 ['TOTS-27617549-97TR','acct_1ULLnG1LoZ4IqUbK'],
 ['TOTS-68536942-JE17','acct_1UWEuF1uaQcmtAhE'],
 ['TOTS-64269540-DSIE','acct_1UWEuF1uaQcmtAhE'],
 ['TOTS-76807055-V0SP','acct_1UWEuF1uaQcmtAhE'],
 ['TOTS-24309842-OKVE','acct_1ULLnG1LoZ4IqUbK'],
 ['TOTS-85144083-DE8P','acct_1ULLnG1LoZ4IqUbK']
];
const apply=process.argv.includes('--apply');
if (apply) { console.error('BLOCKED: connected-account CLI resend failed with this endpoint. Use Stripe Connect event deliveries after reviewing webhook logs. No events sent.'); process.exit(2); }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function orderStatus(orderNumber){const {data,error}=await db.from('store_orders').select('id,organisation_id,order_number,total,payment_status,stripe_checkout_session_id,stripe_account_id,stripe_payment_intent_id').eq('order_number',orderNumber).single();if(error)throw error;return data;}
async function findEvent(order,account){
 const created={gte:Math.floor(new Date('2026-10-01T00:00:00Z').getTime()/1000)};
 for(const type of ['checkout.session.completed','checkout.session.async_payment_succeeded']){
  const it=stripe.events.list({type,created,limit:100},{stripeAccount:account});
  let checked=0;
  for await(const e of it){checked++;if(e.data?.object?.id===order.stripe_checkout_session_id && (!e.account || e.account===account))return e;
   if(checked>1500)break;
  }
 }
 return null;
}
async function main(){
 if(apply){const check=spawnSync('stripe',['--version'],{encoding:'utf8'});if(check.error||check.status!==0)throw Error('Stripe CLI not installed. Install and authenticate Stripe CLI first; run dry-run without --apply meanwhile.');}
 const report=[];
 for(const [number,account] of targets){
  try{
   let o=await orderStatus(number);
   if(o.payment_status==='paid'){console.log('ALREADY_PAID',number);report.push({order:number,status:'ALREADY_PAID'});continue;}
   if(o.payment_status!=='pending'||o.stripe_account_id!==account||!o.stripe_checkout_session_id)throw Error('Order status/account/session changed: manual review');
   const s=await stripe.checkout.sessions.retrieve(o.stripe_checkout_session_id,{}, {stripeAccount:account});
   if(s.status!=='complete'||!['paid','no_payment_required'].includes(s.payment_status))throw Error('Stripe session not confirmed complete');
   if(s.currency!=='gbp'||s.amount_total!==Math.round(Number(o.total)*100))throw Error('Stripe amount/currency mismatch');
   if(s.metadata?.order_id && s.metadata.order_id!==o.id)throw Error('Order ID metadata mismatch');
   if(s.metadata?.organisation_id && s.metadata.organisation_id!==o.organisation_id)throw Error('Organisation metadata mismatch');
   if(s.payment_status==='no_payment_required'&&Number(o.total)!==0)throw Error('Unexpected free checkout');
   if(s.payment_status==='paid'&&Number(o.total)===0)throw Error('Unexpected zero-amount paid status');
   const e=await findEvent(o,account);
   if(!e){console.log('EVENT_NOT_FOUND',number,'(may be outside event listing scope; manual Stripe Dashboard replay needed)');report.push({order:number,status:'EVENT_NOT_FOUND',session:s.id,account});continue;}
   console.log('MATCHED',number,'event='+e.id,'account='+account,'amount='+o.total);
   if(!apply){report.push({order:number,status:'READY_TO_REPLAY',event:e.id,account});continue;}
   // Stripe CLI performs the actual Stripe-signed event replay; never synthesize webhook signatures.
   const cmd=spawnSync('stripe',['events','resend',e.id,'--webhook-endpoint='+destination,'--live'],{encoding:'utf8',timeout:30000});
   if(cmd.error||cmd.status!==0){console.log('REPLAY_FAILED',number,(cmd.stderr||cmd.error?.message||'').slice(0,400));report.push({order:number,status:'REPLAY_FAILED',event:e.id,error:cmd.stderr});continue;}
   await sleep(2500);
   const updated=await orderStatus(number);
   const status=updated.payment_status==='paid'?'RECOVERED':'SENT_NOT_YET_PAID';
   console.log(status,number,'event='+e.id);
   report.push({order:number,status,event:e.id,account,payment_intent:updated.stripe_payment_intent_id});
  }catch(err){console.log('REVIEW_REQUIRED',number,String(err.message||err));report.push({order:number,status:'REVIEW_REQUIRED',error:String(err.message||err)});}
 }
 fs.writeFileSync('store-event-replay-report.json',JSON.stringify(report,null,2));
 console.log('\nSaved store-event-replay-report.json');
 console.log(apply?'Replays attempted. Review report and re-run original read-only audit.':'READ ONLY: nothing resent. Run with --apply only after reviewing matched events.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
