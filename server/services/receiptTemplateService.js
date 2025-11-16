import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ReceiptTemplateService {
    constructor() {
        this.fontsPath = path.join(__dirname, '../assets/fonts');
        this.imagesPath = path.join(__dirname, '../assets/images');
        
        // Ensure font directories exist
        if (!fs.existsSync(this.fontsPath)) {
            fs.mkdirSync(this.fontsPath, { recursive: true });
        }
    }

    async generateProfessionalReceipt(receiptData, companyData) {
        const {
            receiptNumber,
            date,
            customer,
            items,
            paymentDetails,
            officer
        } = receiptData;

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: `Receipt-${receiptNumber}`,
                Author: companyData.name,
                Subject: 'Plant Purchase Receipt'
            }
        });

        // Set up fonts
        doc.registerFont('Regular', path.join(this.fontsPath, 'OpenSans-Regular.ttf'));
        doc.registerFont('Bold', path.join(this.fontsPath, 'OpenSans-Bold.ttf'));
        doc.registerFont('Italic', path.join(this.fontsPath, 'OpenSans-Italic.ttf'));

        // Header
        await this.addHeader(doc, companyData);
        
        // Receipt Information
        this.addReceiptInfo(doc, receiptNumber, date);
        
        // Customer Details
        this.addCustomerDetails(doc, customer);
        
        // Items Table
        const tableTop = 250;
        this.generateItemsTable(doc, items, tableTop);
        
        // Calculate table bottom based on number of items
        const tableBottom = tableTop + (items.length + 1) * 30;
        
        // Payment Details
        this.addPaymentDetails(doc, paymentDetails, tableBottom);
        
        // Officer Details and Signature
        await this.addOfficerDetails(doc, officer, companyData, tableBottom + 120);
        
        // Terms and Conditions
        this.addTermsAndConditions(doc, companyData);
        
        // Footer with QR Code
        await this.addFooter(doc, companyData, receiptNumber);

        return doc;
    }

    async addHeader(doc, companyData) {
        // Company Logo
        if (companyData.logo && companyData.logo.data) {
            doc.image(companyData.logo.data, 50, 45, { width: 100 });
        }

        // Company Details
        doc.font('Bold')
           .fontSize(20)
           .fillColor(companyData.receiptSettings.primaryColor)
           .text(companyData.name, 180, 45)
           .font('Regular')
           .fontSize(10)
           .fillColor('black')
           .text(companyData.businessDetails.type, 180, 70)
           .text(`GST: ${companyData.businessDetails.gstNumber}`, 180, 85)
           .text(`${companyData.address.street}`, 180, 100)
           .text(`${companyData.address.city}, ${companyData.address.state} - ${companyData.address.pincode}`, 180, 115)
           .text(`Phone: ${companyData.contact.phone}`, 180, 130)
           .text(`Email: ${companyData.contact.email}`, 180, 145);

        // Add horizontal line
        doc.strokeColor(companyData.receiptSettings.secondaryColor)
           .lineWidth(1)
           .moveTo(50, 170)
           .lineTo(550, 170)
           .stroke();
    }

    addReceiptInfo(doc, receiptNumber, date) {
        doc.font('Bold')
           .fontSize(12)
           .text('RECEIPT', 50, 190)
           .font('Regular')
           .fontSize(10)
           .text(`Receipt Number: ${receiptNumber}`, 50, 210)
           .text(`Date: ${new Date(date).toLocaleString('en-IN')}`, 400, 210);
    }

    addCustomerDetails(doc, customer) {
        doc.font('Bold')
           .text('Customer Details:', 50, 240)
           .font('Regular')
           .text(`Name: ${customer.name}`, 50, 255)
           .text(`Phone: ${customer.phone}`, 50, 270)
           .text(`Address: ${customer.address}`, 50, 285);
    }

    generateItemsTable(doc, items, y) {
        // Table headers with styling
        const tableHeaders = ['Item', 'Variant', 'Quantity', 'Price', 'GST', 'Total'];
        const columnWidths = [180, 100, 70, 70, 50, 80];
        
        // Add headers
        doc.font('Bold')
           .fontSize(10);
        
        let xPosition = 50;
        tableHeaders.forEach((header, i) => {
            doc.text(header, xPosition, y);
            xPosition += columnWidths[i];
        });

        // Add items
        doc.font('Regular');
        items.forEach((item, index) => {
            const rowY = y + (index + 1) * 25;
            
            xPosition = 50;
            doc.text(item.name, xPosition, rowY);
            xPosition += columnWidths[0];
            
            doc.text(item.variant || '-', xPosition, rowY);
            xPosition += columnWidths[1];
            
            doc.text(item.quantity.toString(), xPosition, rowY);
            xPosition += columnWidths[2];
            
            doc.text(`₹${item.price.toFixed(2)}`, xPosition, rowY);
            xPosition += columnWidths[3];
            
            doc.text(`${item.gst}%`, xPosition, rowY);
            xPosition += columnWidths[4];
            
            doc.text(`₹${item.total.toFixed(2)}`, xPosition, rowY);
        });
    }

    addPaymentDetails(doc, paymentDetails, y) {
        const { subtotal, gst, discount, total } = paymentDetails;
        
        // Summary box
        doc.rect(350, y + 20, 200, 100)
           .fill(paymentDetails.paid ? '#f0fff4' : '#fff5f5');
        
        // Payment summary
        doc.font('Regular')
           .text('Subtotal:', 370, y + 30)
           .text(`₹${subtotal.toFixed(2)}`, 480, y + 30)
           .text('GST:', 370, y + 50)
           .text(`₹${gst.toFixed(2)}`, 480, y + 50);

        if (discount > 0) {
            doc.text('Discount:', 370, y + 70)
               .text(`-₹${discount.toFixed(2)}`, 480, y + 70);
        }

        doc.font('Bold')
           .text('Total:', 370, y + 90)
           .text(`₹${total.toFixed(2)}`, 480, y + 90);

        // Payment status
        doc.font('Bold')
           .fillColor(paymentDetails.paid ? '#059669' : '#DC2626')
           .text(
               paymentDetails.paid ? 'PAID' : 'UNPAID',
               370,
               y + 110
           )
           .fillColor('black');
    }

    async addOfficerDetails(doc, officer, companyData, y) {
        // Officer details
        doc.font('Regular')
           .text('Authorized by:', 50, y)
           .text(officer.name, 50, y + 15)
           .text(`ID: ${officer.id}`, 50, y + 30);

        // Digital signature if available
        if (officer.signature) {
            doc.image(officer.signature, 50, y + 45, { width: 100 });
        }

        // Company stamp if available
        if (companyData.stamp) {
            doc.image(companyData.stamp, 400, y + 15, { width: 100, opacity: 0.8 });
        }
    }

    addTermsAndConditions(doc, companyData) {
        const terms = companyData.receiptSettings.additionalInfo
            .filter(info => info.showOnReceipt)
            .map(info => info.value);

        if (terms.length > 0) {
            doc.font('Italic')
               .fontSize(8)
               .text(terms.join('\n'), 50, 680);
        }
    }

    async addFooter(doc, companyData, receiptNumber) {
        // Generate QR code if enabled
        if (companyData.receiptSettings.footer.showQR) {
            const qrData = JSON.stringify({
                company: companyData.name,
                receipt: receiptNumber,
                verify: `${companyData.contact.website}/verify/${receiptNumber}`
            });
            
            const qrCodeDataUrl = await QRCode.toDataURL(qrData);
            const qrImage = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
            
            doc.image(qrImage, 50, 730, { width: 50 });
        }

        // Footer text
        doc.font('Regular')
           .fontSize(8)
           .text(companyData.receiptSettings.footer.text || 'Thank you for your business!', 0, 780, {
               align: 'center',
               width: doc.page.width
           });
    }
}