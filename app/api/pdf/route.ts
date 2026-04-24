import { createClient } from "@/lib/supabase";
import { jsPDF } from "jspdf";

export async function GET(req: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing Invoice ID", { status: 400 });
  }

  // 1. Fetch Invoice Data
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, customers(*)")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return new Response("Invoice not found", { status: 404 });
  }

  // 2. Generate PDF using jsPDF
  const doc = new jsPDF();
  const primaryColor = invoice.primary_color || "#000000";

  // Header / Branding
  doc.setFontSize(20);
  doc.setTextColor(primaryColor);
  doc.text("INVOICE", 10, 20);
  
  doc.setFontSize(10);
  doc.setTextColor("#666666");
  doc.text(`Invoice #: ${invoice.invoice_number || invoice.id.slice(0, 8)}`, 10, 30);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 10, 35);

  // Customer Info
  doc.setTextColor("#000000");
  doc.text("Bill To:", 10, 50);
  doc.text(`${invoice.customers?.name || "Client"}`, 10, 55);
  doc.text(`${invoice.customers?.email || ""}`, 10, 60);

  // Table Header
  doc.setFillColor(primaryColor);
  doc.rect(10, 80, 190, 10, "F");
  doc.setTextColor("#FFFFFF");
  doc.text("Description", 15, 86);
  doc.text("Total", 170, 86);

  // Table Row
  doc.setTextColor("#000000");
  doc.text(`${invoice.description || "Services Rendered"}`, 15, 100);
  doc.text(`£${invoice.amount?.toLocaleString()}`, 170, 100);

  // Footer / Total
  doc.setFontSize(14);
  doc.text(`Total Due: £${invoice.amount?.toLocaleString()}`, 140, 130);

  // 3. Output as ArrayBuffer
  const pdfOutput = doc.output("arraybuffer");

  // 4. Return as a Downloadable File
  return new Response(pdfOutput, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
    },
  });
}