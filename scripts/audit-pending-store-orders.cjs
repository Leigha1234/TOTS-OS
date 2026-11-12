const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

function loadEnv(file) {
  const content = fs.readFileSync(file, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[match[1]] ??= value;
  }
}

loadEnv(".env.local");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

async function main() {
  console.log("Fetching pending ORBI Store orders...");

  const orders = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("store_orders")
      .select(
        "id,order_number,stripe_account_id,stripe_checkout_session_id,payment_status,total,created_at"
      )
      .eq("payment_status", "pending")
      .not("stripe_checkout_session_id", "is", null)
      .range(offset, offset + 999);

    if (error) throw error;

    orders.push(...data);

    if (data.length < 1000) break;

    offset += 1000;
  }

  console.log(`Found ${orders.length} pending Checkout sessions.`);

  const results = [];

  for (const order of orders) {
    console.log(`Checking ${order.order_number}...`);

    try {
      if (!order.stripe_account_id) {
        throw new Error("Missing connected Stripe account");
      }

      const session = await stripe.checkout.sessions.retrieve(
        order.stripe_checkout_session_id,
        {
          expand: ["payment_intent"]
        },
        {
          stripeAccount: order.stripe_account_id
        }
      );

      const stripeAmount = session.amount_total / 100;
      const orbiAmount = Number(order.total);

      results.push({
        order_number: order.order_number,
        order_id: order.id,
        stripe_account: order.stripe_account_id,
        orbi_status: order.payment_status,
        stripe_payment_status: session.payment_status,
        checkout_status: session.status,
        orbi_amount: orbiAmount,
        stripe_amount: stripeAmount,
        amount_matches: Math.abs(stripeAmount - orbiAmount) < 0.01,
        payment_intent:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || "",
        created_at: order.created_at,
        error: ""
      });
    } catch (error) {
      results.push({
        order_number: order.order_number,
        order_id: order.id,
        stripe_account: order.stripe_account_id,
        orbi_status: order.payment_status,
        stripe_payment_status: "ERROR",
        checkout_status: "",
        orbi_amount: order.total,
        stripe_amount: "",
        amount_matches: "",
        payment_intent: "",
        created_at: order.created_at,
        error: error.message
      });
    }
  }

  const headers = Object.keys(results[0] || {});

  const csv = [
    headers.join(","),
    ...results.map(row =>
      headers.map(key => csvEscape(row[key])).join(",")
    )
  ].join("\n");

  const output = path.join(
    process.env.HOME,
    "Desktop",
    "ORBI_Pending_Orders_Audit.csv"
  );

  fs.writeFileSync(output, csv);

  console.log("\n========== AUDIT RESULTS ==========");

  const counts = {};

  for (const row of results) {
    const status = row.stripe_payment_status;
    counts[status] = (counts[status] || 0) + 1;
  }

  console.table(counts);

  console.log(`\nReport saved to: ${output}`);
  console.log("No orders or Stripe payments were modified.");
}

main().catch(error => {
  console.error("Audit failed:", error.message);
  process.exitCode = 1;
});
