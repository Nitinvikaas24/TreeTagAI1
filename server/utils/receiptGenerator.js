import PDFDocument from 'pdfkit';

export async function buildReceiptPDF(receiptData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Basic receipt content
      doc.fontSize(25).text('Sale Receipt', { align: 'center' });
      doc.moveDown();

      doc.fontSize(16).text('Farmer: ' + (receiptData.farmerName || ''));
      doc.moveDown(0.5);

      const total = typeof receiptData.total === 'number' ? receiptData.total : Number(receiptData.total || 0);
      doc.text('Total: ' + total.toFixed(2));

      // Optional: list items if provided
      if (Array.isArray(receiptData.items) && receiptData.items.length > 0) {
        doc.moveDown();
        doc.fontSize(14).text('Items:');
        receiptData.items.forEach((item) => {
          const name = item.plantName || item.scientificName || item.name || 'Item';
          const qty = item.quantity || 1;
          const price = typeof item.price === 'number' ? item.price : Number(item.price || 0);
          doc.text(`${name} — Qty: ${qty} — Unit: ${price.toFixed(2)} — Subtotal: ${(price * qty).toFixed(2)}`);
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default buildReceiptPDF;
