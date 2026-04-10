import { NextResponse } from "next/server";
import { getBranding } from "@/lib/getBranding";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, invoice, teamId } = body;

    // ✅ VALIDATION
    if (!email || !invoice || !teamId) {
      return NextResponse.json(
        { error: "Missing email, invoice or teamId" },
        { status: 400 }
      );
    }

    // 🎨 BRANDING
    const branding = await getBranding(teamId);

    // 🧠 STATUS LOGIC
    const now = new Date();
    const dueDate = invoice?.due_date
      ? new Date(invoice.due_date)
      : null;

    let intro = "Just a quick note to share your invoice.";

    if (dueDate && dueDate < now && invoice.status !== "paid") {
      intro =
        "Just a quick nudge — this invoice is now overdue. You can settle it below.";
    } else if (invoice.status !== "paid") {
      intro =
        "Here’s your invoice — you can take care of it whenever you're ready.";
    } else {
      intro = "This invoice has already been settled — thank you.";
    }

    const subject =
      invoice.status === "paid"
        ? `Receipt £${invoice.amount}`
        : `Invoice £${invoice.amount}`;

    const payLink = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.id}`;

    // 💎 SHARED DESIGN SYSTEM (EMAIL + PDF MATCH)
    function buildInvoiceHTML({ isEmail = false }) {
      return `
        <div style="
          background:${isEmail ? "#f6f3ef" : "#ffffff"};
          padding:${isEmail ? "40px 20px" : "0"};
          font-family:${branding.font};
        ">

          <div style="
            max-width:640px;
            margin:0 auto;
            background:#ffffff;
            border-radius:16px;
            padding:32px;
            border:1px solid #eae7e3;
            ${isEmail ? "box-shadow:0 10px 30px rgba(0,0,0,0.04);" : ""}
          ">

            ${
              branding.logo
                ? `<img src="${branding.logo}" style="height:32px;margin-bottom:24px;" />`
                : ""
            }

            <h1 style="
              font-size:20px;
              font-weight:500;
              margin-bottom:10px;
            ">
              ${invoice.status === "paid" ? "Receipt" : "Invoice"}
            </h1>

            ${
              isEmail
                ? `<p style="color:#555;margin-bottom:24px;">${intro}</p>`
                : ""
            }

            <div style="border-top:1px solid #eee; margin:20px 0;"></div>

            <!-- DETAILS -->
            <div style="margin-bottom:24px;">

              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#777;">Client</span>
                <span>${invoice.client_name || "N/A"}</span>
              </div>

              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#777;">Amount</span>
                <span style="font-weight:500;">£${invoice.amount}</span>
              </div>

              <div style="display:flex; justify-content:space-between;">
                <span style="color:#777;">Status</span>
                <span style="
                  padding:4px 10px;
                  border-radius:999px;
                  font-size:12px;
                  background:${
                    invoice.status === "paid"
                      ? "rgba(169,184,151,0.2)"
                      : "#f3f3f3"
                  };
                ">
                  ${invoice.status}
                </span>
              </div>

            </div>

            ${
              invoice.status !== "paid" && isEmail
                ? `
                <a href="${payLink}"
                  style="
                    display:inline-block;
                    padding:12px 18px;
                    background:${branding.primaryColor};
                    color:#000;
                    border-radius:10px;
                    text-decoration:none;
                    font-weight:500;
                  ">
                  Pay invoice
                </a>
              `
                : ""
            }

            ${
              isEmail
                ? `
                <div style="margin-top:32px; font-size:12px; color:#888;">
                  <p>If you need anything, just reply to this email.</p>
                  <p>Sent via <strong>The Organised Types</strong></p>
                </div>
              `
                : `
                <div style="margin-top:40px; font-size:12px; color:#888;">
                  <p>Thank you for your business.</p>
                </div>
              `
            }

          </div>
        </div>
      `;
    }

    // ✉️ EMAIL VERSION
    const emailHTML = buildInvoiceHTML({ isEmail: true });

    // 🧾 PDF VERSION (SAVE OR USE LATER)
    const pdfHTML = buildInvoiceHTML({ isEmail: false });

    // 👉 (optional) store PDF HTML snapshot
    // await supabase.from("invoices").update({
    //   pdf_html: pdfHTML
    // }).eq("id", invoice.id);

    // 🚀 SEND EMAIL
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Clarity <theorganisedtypes@gmail.com>",
        to: email,
        subject,
        html: emailHTML,
      }),
    });

    console.log("📧 Sent + PDF ready", {
      email,
      invoiceId: invoice.id,
    });

    return NextResponse.json({
      success: true,
      pdfReady: true,
    });

  } catch (err) {
    console.error("SEND ERROR:", err);

    return NextResponse.json(
      { error: "Failed to send invoice" },
      { status: 500 }
    );
  }
}