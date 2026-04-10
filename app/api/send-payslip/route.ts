import { NextResponse } from "next/server";
import { getBranding } from "@/lib/getBranding";
import { renderToBuffer } from "@react-pdf/renderer";
import PayslipPDF from "@/lib/pdf/PayslipPDF";
import React from "react"; // ✅ Required for JSX

export async function POST(req: Request) {
  try {
    const { email, employee, payroll, teamId } = await req.json();

    if (!email || !employee || !payroll || !teamId) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    // 🎨 LOAD BRANDING
    const branding = await getBranding(teamId);

    // 📄 GENERATE PDF
    // ✅ Fix: Use JSX syntax <PayslipPDF /> instead of calling it as a function
    const pdfBuffer = await renderToBuffer(
      React.createElement(PayslipPDF, {
        employee,
        payroll,
        branding,
      })
    );

    // 📧 EMAIL HTML (luxury + branded)
    // Note: fallback to 'sans-serif' if branding.font is missing
    const html = `
      <div style="
        background:#f6f3ef;
        padding:40px;
        font-family:${branding?.font || 'sans-serif'};
      ">
        <div style="
          max-width:520px;
          margin:auto;
          background:white;
          padding:28px;
          border-radius:14px;
          border:1px solid #eae7e2;
        ">
          ${
            branding?.logo
              ? `<img src="${branding.logo}" style="height:36px;margin-bottom:20px;" />`
              : ""
          }

          <h2 style="margin:0 0 12px 0;color:${branding?.primaryColor || '#000'}">
            Payslip
          </h2>

          <p style="margin-bottom:16px; color: #333;">
            Your payslip is ready for this period.
          </p>

          <div style="
            padding:16px;
            border:1px solid #eee;
            border-radius:10px;
          ">
            <p style="margin:0;"><strong>${employee.name}</strong></p>
            <p style="margin:5px 0 0 0; font-size: 18px; font-weight: bold;">£${payroll.net_pay}</p>
          </div>

          <p style="margin-top:20px;font-size:12px;color:#777;">
            Attached is your full payslip PDF.
          </p>
        </div>
      </div>
    `;

    // 🚀 SEND EMAIL (Resend API)
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Payroll <payroll@yourdomain.com>", // Ensure this domain is verified in Resend
        to: email,
        subject: `Payslip - £${payroll.net_pay}`,
        html,
        attachments: [
          {
            filename: `payslip_${employee.name.replace(/\s+/g, '_')}.pdf`,
            content: pdfBuffer.toString("base64"),
          },
        ],
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      throw new Error(errorData.message || "Failed to send email via Resend");
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("PAYSLIP ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Failed to send payslip" },
      { status: 500 }
    );
  }
}