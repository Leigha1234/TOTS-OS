import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY is missing",
        },
        { status: 500 }
      );
    }

    const testEmail =
      process.env.ROOTED_TEST_EMAIL;

    if (!testEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ROOTED_TEST_EMAIL is missing",
        },
        { status: 500 }
      );
    }

    const { data, error } =
      await resend.emails.send({
        from: "Rooted CIC <hello@tots-os.co.uk>",
        to: [testEmail],
        subject:
          "🎟️ Your Rooted CIC Raffle Tickets",
        html: `
          <!doctype html>
          <html>
            <body
              style="
                margin:0;
                padding:0;
                background:#f5f3ee;
                font-family:Arial,Helvetica,sans-serif;
                color:#171717;
              "
            >
              <div
                style="
                  max-width:600px;
                  margin:0 auto;
                  padding:40px 20px;
                "
              >
                <div
                  style="
                    background:#ffffff;
                    border-radius:16px;
                    overflow:hidden;
                  "
                >
                  <div
                    style="
                      background:#111111;
                      padding:36px 30px;
                      text-align:center;
                    "
                  >
                    <div
                      style="
                        color:#a9b897;
                        font-size:14px;
                        font-weight:700;
                        letter-spacing:3px;
                      "
                    >
                      ROOTED CIC
                    </div>

                    <h1
                      style="
                        color:#ffffff;
                        margin:12px 0 0;
                        font-size:28px;
                      "
                    >
                      Your raffle tickets 🎟️
                    </h1>
                  </div>

                  <div
                    style="
                      padding:32px 30px;
                    "
                  >
                    <p
                      style="
                        font-size:16px;
                        line-height:1.6;
                        margin-top:0;
                      "
                    >
                      Hi Leigha,
                    </p>

                    <p
                      style="
                        font-size:16px;
                        line-height:1.6;
                      "
                    >
                      Thank you for supporting
                      Rooted CIC.
                    </p>

                    <p
                      style="
                        font-size:16px;
                        line-height:1.6;
                      "
                    >
                      Your raffle ticket number is:
                    </p>

                    <div
                      style="
                        background:#f5f3ee;
                        border-radius:12px;
                        padding:24px;
                        text-align:center;
                        margin:24px 0;
                      "
                    >
                      <div
                        style="
                          font-size:13px;
                          letter-spacing:2px;
                          text-transform:uppercase;
                          color:#666666;
                        "
                      >
                        Ticket number
                      </div>

                      <div
                        style="
                          font-size:38px;
                          font-weight:800;
                          margin-top:8px;
                        "
                      >
                        #1001
                      </div>
                    </div>

                    <div
                      style="
                        border-top:1px solid #eeeeee;
                        border-bottom:1px solid #eeeeee;
                        padding:18px 0;
                        margin:25px 0;
                      "
                    >
                      <p style="margin:6px 0;">
                        <strong>Order:</strong>
                        TEST-ORDER
                      </p>

                      <p style="margin:6px 0;">
                        <strong>Tickets:</strong>
                        1
                      </p>

                      <p style="margin:6px 0;">
                        <strong>Total:</strong>
                        £2.00
                      </p>
                    </div>

                    <p
                      style="
                        font-size:14px;
                        line-height:1.6;
                        color:#666666;
                      "
                    >
                      Keep this email safe as confirmation
                      of your raffle ticket number.
                    </p>

                    <p
                      style="
                        font-size:14px;
                        line-height:1.6;
                        color:#666666;
                      "
                    >
                      Raffle ticket purchases are
                      non-refundable.
                    </p>

                    <p
                      style="
                        font-size:16px;
                        line-height:1.6;
                        margin-bottom:0;
                      "
                    >
                      Good luck!<br />
                      <strong>Rooted CIC</strong>
                    </p>
                  </div>
                </div>

                <p
                  style="
                    text-align:center;
                    color:#888888;
                    font-size:12px;
                    margin-top:20px;
                  "
                >
                  Sent securely by TOTS-OS
                </p>
              </div>
            </body>
          </html>
        `,
      });

    if (error) {
      console.error(
        "[ROOTED TEST EMAIL]",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Rooted raffle test email sent.",
      resendId: data?.id ?? null,
      sentTo: testEmail,
    });
  } catch (error) {
    console.error(
      "[ROOTED TEST EMAIL]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}