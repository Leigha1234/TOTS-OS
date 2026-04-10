export function generatePDF(invoice: any) {
  const content = `
    Invoice: ${invoice.id}
    Client: ${invoice.client_name}
    Amount: £${invoice.amount}
  `;

  const blob = new Blob([content], { type: "text/plain" });
  return URL.createObjectURL(blob);
}