import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, '../../../client/public/assets/brand/sachi-kheti-emblem.jpg');

/**
 * Generate a professional, high-fidelity PDF Invoice / Rental Agreement
 * @param {Object} billData - Order / Virtual bill details
 * @param {Object} billDesign - Customization settings (branding, colors, penalty defaults, etc.)
 * @returns {Promise<Buffer>} - Resolves with PDF buffer
 */
export function generateInvoicePDF(billData, billDesign = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `${billData.orderNumber || 'Invoice'} - SachiKheti`,
          Author: 'SachiKheti LFPC Ltd.',
          Subject: 'Official Agricultural Bill & Tax Invoice',
        }
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Color scheme
      const primaryColor = billDesign.accentColor || '#15733E'; // Forest green
      const darkColor = '#1F2937';
      const grayColor = '#4B5563';
      const lightGray = '#F3F4F6';
      const borderColor = '#E5E7EB';
      const amberColor = '#D97706';

      const items = Array.isArray(billData.items) ? billData.items : [];
      const hasRentalItems = items.some((it) => {
        const u = (it.unit || '').toLowerCase();
        const t = (it.title || '').toLowerCase();
        return it.isRental || it.isForRent || u.includes('acre') || u.includes('hour') || t.includes('tractor') || t.includes('leveler') || t.includes('planter') || t.includes('digger') || t.includes('seeder') || t.includes('boom');
      });

      const billType = billData.billType || (hasRentalItems ? 'rental' : 'direct_sale');
      const isRental = billType === 'rental' || billType === 'combined' || hasRentalItems;

      // ----------------------------------------------------
      // 1. HEADER LOCKUP (LOGO & COMPANY CREDENTIALS)
      // ----------------------------------------------------
      const pageWidth = 595.28; // A4 width in pt
      const margin = 36;
      const contentWidth = pageWidth - (margin * 2);

      let topY = 36;
      if (billDesign.showLogo !== false && fs.existsSync(LOGO_PATH)) {
        try {
          doc.image(LOGO_PATH, margin, topY, { width: 52, height: 52 });
          doc.circle(margin + 26, topY + 26, 26).lineWidth(1.5).stroke(primaryColor);
        } catch (e) {
          console.warn('[PDF] Logo draw fallback:', e.message);
        }
      }

      const textStartX = margin + 64;
      const companyHeader = billDesign.companyName || 'LAMMA FARMER PRODUCER COMPANY LIMITED';
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(13)
        .text(companyHeader.toUpperCase(), textStartX, topY, { width: contentWidth - 210 });

      doc.fillColor(grayColor).font('Helvetica').fontSize(8)
        .text(billDesign.tagline || 'Direct Farmer Prosperity • Certified Natural Produce & Farm Machinery', textStartX, topY + 18, { width: contentWidth - 210 })
        .text(billDesign.address || 'VPO Kamalpura, Near Kalgidhar Stadium Jagraon, Kamalpura, Ludhiana - 142030, Punjab', textStartX, topY + 28, { width: contentWidth - 210 })
        .text(`Phone: ${billDesign.phone || '+91 8360253372'} | Email: ${billDesign.email || 'support@sachikheti.com'}`, textStartX, topY + 38, { width: contentWidth - 210 });

      // Corporate & Tax identifiers on right top
      let idLines = [];
      if (billDesign.cin) idLines.push(`CIN: ${billDesign.cin}`);
      if (billDesign.pan || billDesign.tan) {
        idLines.push(`PAN: ${billDesign.pan || 'AAGCL5404L'}${billDesign.tan ? ` | TAN: ${billDesign.tan}` : ''}`);
      }
      if (billDesign.gstin) {
        idLines.push(billDesign.gstin.startsWith('GSTIN:') || billDesign.gstin.startsWith('FSSAI:') ? billDesign.gstin : `GSTIN: ${billDesign.gstin}`);
      }
      if (idLines.length === 0) {
        idLines = [
          'CIN: U01611PB2025PTC066073',
          'PAN: AAGCL5404L | TAN: JLDL01772B',
          'GSTIN: 03AAGCL5404L1Z5'
        ];
      }

      doc.fillColor(grayColor).font('Helvetica').fontSize(7.5)
        .text(idLines.join('\n'), margin, topY + 4, { align: 'right', width: contentWidth });

      // Accent colored line divider
      topY += 62;
      doc.moveTo(margin, topY).lineTo(margin + contentWidth, topY).lineWidth(2).stroke(primaryColor);

      // ----------------------------------------------------
      // 2. BILL TITLE RIBBON (DIRECT SALE vs RENTAL AGREEMENT)
      // ----------------------------------------------------
      topY += 8;
      const titleText = isRental
        ? (billDesign.rentalBillTitle || 'AGRICULTURAL MACHINERY CUSTOM HIRING & RENTAL AGREEMENT')
        : (billDesign.billTitle || 'TAX INVOICE / RETAIL CASH MEMO');

      doc.rect(margin, topY, contentWidth, 22).fill(lightGray);
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10)
        .text(titleText, margin, topY + 6, { align: 'center', width: contentWidth });

      // ----------------------------------------------------
      // 3. INVOICE METADATA & CUSTOMER DETAILS (2-COLUMN GRID)
      // ----------------------------------------------------
      topY += 30;
      const colWidth = (contentWidth - 16) / 2;
      const leftColX = margin;
      const rightColX = margin + colWidth + 16;

      // Left Box: Bill Details
      doc.rect(leftColX, topY, colWidth, 74).strokeColor(borderColor).lineWidth(1).stroke();
      doc.rect(leftColX, topY, colWidth, 18).fill(lightGray);
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(8.5)
        .text('INVOICE / BILL DETAILS', leftColX + 8, topY + 5);

      const billDate = billData.date ? new Date(billData.date) : new Date();
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(8.5)
        .text('Bill / Invoice #:', leftColX + 8, topY + 24)
        .font('Helvetica').text(billData.orderNumber || 'SK-BILL-PENDING', leftColX + 85, topY + 24)
        .font('Helvetica-Bold').text('Date & Time:', leftColX + 8, topY + 36)
        .font('Helvetica').text(billDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), leftColX + 85, topY + 36)
        .font('Helvetica-Bold').text('Payment Mode:', leftColX + 8, topY + 48)
        .font('Helvetica').text(`${billData.paymentMethod || 'CASH'} (${(billData.paymentStatus || 'PAID').toUpperCase()})`, leftColX + 85, topY + 48)
        .font('Helvetica-Bold').text('Order Status:', leftColX + 8, topY + 60)
        .font('Helvetica').text(billData.orderStatus || 'CONFIRMED', leftColX + 85, topY + 60);

      // Right Box: Customer / Hirer Details
      doc.rect(rightColX, topY, colWidth, 74).strokeColor(borderColor).lineWidth(1).stroke();
      doc.rect(rightColX, topY, colWidth, 18).fill(lightGray);
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(8.5)
        .text(isRental ? 'HIRER / FARMER DETAILS' : 'BILLED TO (CUSTOMER)', rightColX + 8, topY + 5);

      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(8.5)
        .text('Farmer Name:', rightColX + 8, topY + 24)
        .font('Helvetica').text(billData.customerName || 'Direct Store Customer', rightColX + 80, topY + 24)
        .font('Helvetica-Bold').text('Phone / Mobile:', rightColX + 8, topY + 36)
        .font('Helvetica').text(billData.customerPhone || 'Not specified', rightColX + 80, topY + 36)
        .font('Helvetica-Bold').text('Farm Location:', rightColX + 8, topY + 48)
        .font('Helvetica').text(`${billData.address || 'Store Direct'}, ${billData.city || 'Fatehabad'}`, rightColX + 80, topY + 48)
        .font('Helvetica-Bold').text('Pincode / Dist:', rightColX + 8, topY + 60)
        .font('Helvetica').text(billData.pincode || '125050 (Haryana)', rightColX + 80, topY + 60);

      topY += 84;

      // ----------------------------------------------------
      // 4. RENTAL TENURE, OPERATIONAL TERMS & PENALTY CLAUSE
      // ----------------------------------------------------
      if (isRental) {
        const rental = billData.rentalDetails || {};
        const tenureText = rental.tenure || billDesign.defaultRentalTenure || '1 Acre / As agreed';
        const penaltyText = rental.penaltyRate || `Rs. ${billDesign.defaultPenaltyPerHour || 250} per extra hour / Rs. ${billDesign.defaultPenaltyPerAcre || 500} per extra acre`;
        const gracePeriod = rental.gracePeriod || billDesign.defaultGracePeriod || '1 Hour';
        const operatorText = rental.operatorIncluded ? 'Yes (LFPC Certified Operator Provided)' : 'Self-Operated by Hirer (Standard Operational Guidelines Apply)';

        doc.rect(margin, topY, contentWidth, 76).strokeColor(amberColor).lineWidth(1).stroke();
        doc.rect(margin, topY, contentWidth, 18).fill('#FEF3C7');
        doc.fillColor('#92400E').font('Helvetica-Bold').fontSize(8.5)
          .text('🚜 MACHINERY RENTAL TENURE, SCHEDULE & OVERDUE PENALTY TERMS', margin + 8, topY + 5);

        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(8)
          .text('Allocated Tenure / Capacity:', margin + 8, topY + 24)
          .font('Helvetica').text(tenureText, margin + 140, topY + 24)
          .font('Helvetica-Bold').text('Operator / Driver:', margin + 280, topY + 24)
          .font('Helvetica').text(operatorText, margin + 370, topY + 24);

        const dispatchDateStr = rental.startDate ? new Date(rental.startDate).toLocaleString('en-IN') : 'At Delivery / Dispatch';
        const returnDateStr = rental.returnDate ? new Date(rental.returnDate).toLocaleString('en-IN') : 'Upon Completion of Agreed Tenure';

        doc.font('Helvetica-Bold').text('Dispatch / Start Time:', margin + 8, topY + 36)
          .font('Helvetica').text(dispatchDateStr, margin + 140, topY + 36)
          .font('Helvetica-Bold').text('Scheduled Return:', margin + 280, topY + 36)
          .font('Helvetica').text(returnDateStr, margin + 370, topY + 36);

        // Highlighted Overdue Penalty Line
        doc.rect(margin + 4, topY + 48, contentWidth - 8, 22).fill('#FFFBEB');
        doc.fillColor('#B45309').font('Helvetica-Bold').fontSize(8)
          .text('OVERDUE PENALTY CLAUSE:', margin + 8, topY + 54);
        doc.fillColor(darkColor).font('Helvetica').fontSize(7.5)
          .text(`Overdue rate applicable: ${penaltyText} (Grace Period: ${gracePeriod}). Hirer must return machinery clean & undamaged.`, margin + 140, topY + 54, { width: contentWidth - 150 });

        topY += 86;
      }

      // ----------------------------------------------------
      // 5. ITEMIZED PRODUCTS & MACHINERY TABLE
      // ----------------------------------------------------
      const tableX = margin;
      const colNo = 26;
      const colDesc = 240;
      const colType = 75;
      const colQty = 45;
      const colRate = 65;
      const colTotal = contentWidth - (colNo + colDesc + colType + colQty + colRate);

      // Table Header
      doc.rect(tableX, topY, contentWidth, 20).fill(primaryColor);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8)
        .text('#', tableX + 4, topY + 6, { width: colNo, align: 'center' })
        .text('Item Description / Equipment SKU', tableX + colNo + 4, topY + 6, { width: colDesc })
        .text('Category', tableX + colNo + colDesc + 4, topY + 6, { width: colType })
        .text('Qty', tableX + colNo + colDesc + colType + 4, topY + 6, { width: colQty, align: 'center' })
        .text('Rate (INR)', tableX + colNo + colDesc + colType + colQty + 4, topY + 6, { width: colRate, align: 'right' })
        .text('Total (INR)', tableX + colNo + colDesc + colType + colQty + colRate + 4, topY + 6, { width: colTotal - 8, align: 'right' });

      topY += 20;

      // Table Rows
      items.forEach((item, index) => {
        const rowHeight = 22;
        const isEven = index % 2 === 0;
        if (isEven) {
          doc.rect(tableX, topY, contentWidth, rowHeight).fill('#F9FAFB');
        }
        doc.rect(tableX, topY, contentWidth, rowHeight).strokeColor(borderColor).lineWidth(0.5).stroke();

        const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);
        const u = (item.unit || '').toLowerCase();
        const isItemRental = item.isRental || item.isForRent || u.includes('acre') || u.includes('hour');
        const typeBadge = isItemRental ? 'Rental Tool' : 'Farm Produce';

        doc.fillColor(darkColor).font('Helvetica').fontSize(8)
          .text(String(index + 1), tableX + 4, topY + 6, { width: colNo, align: 'center' })
          .font('Helvetica-Bold').text(item.title || 'Product', tableX + colNo + 4, topY + 6, { width: colDesc, lineBreak: false })
          .font('Helvetica').fontSize(7.5).text(typeBadge, tableX + colNo + colDesc + 4, topY + 6, { width: colType })
          .text(`${item.quantity} ${item.unit || ''}`, tableX + colNo + colDesc + colType + 4, topY + 6, { width: colQty, align: 'center' })
          .text(`Rs. ${Number(item.price || 0).toLocaleString('en-IN')}`, tableX + colNo + colDesc + colType + colQty + 4, topY + 6, { width: colRate, align: 'right' })
          .font('Helvetica-Bold').text(`Rs. ${itemTotal.toLocaleString('en-IN')}`, tableX + colNo + colDesc + colType + colQty + colRate + 4, topY + 6, { width: colTotal - 8, align: 'right' });

        topY += rowHeight;
      });

      // ----------------------------------------------------
      // 6. FINANCIAL TOTALS & PRICING BREAKDOWN
      // ----------------------------------------------------
      topY += 6;
      const totalsBoxWidth = 220;
      const totalsBoxX = margin + contentWidth - totalsBoxWidth;

      doc.rect(totalsBoxX, topY, totalsBoxWidth, 80).strokeColor(borderColor).lineWidth(1).stroke();
      doc.rect(totalsBoxX, topY, totalsBoxWidth, 80).fill('#FAFAFA');

      const subtotalVal = Number(billData.subtotal || billData.totalAmount || 0);
      const discountVal = Number(billData.discount || 0);
      const deliveryVal = Number(billData.delivery || 0);
      const grandTotalVal = Number(billData.totalAmount || 0);

      doc.fillColor(darkColor).font('Helvetica').fontSize(8)
        .text('Subtotal:', totalsBoxX + 10, topY + 8)
        .text(`Rs. ${subtotalVal.toLocaleString('en-IN')}`, totalsBoxX + 100, topY + 8, { width: totalsBoxWidth - 110, align: 'right' });

      if (discountVal > 0) {
        doc.fillColor('#DC2626')
          .text('Discount / Concession:', totalsBoxX + 10, topY + 22)
          .text(`- Rs. ${discountVal.toLocaleString('en-IN')}`, totalsBoxX + 100, topY + 22, { width: totalsBoxWidth - 110, align: 'right' });
      } else {
        doc.fillColor(grayColor)
          .text('Discount:', totalsBoxX + 10, topY + 22)
          .text('Rs. 0.00', totalsBoxX + 100, topY + 22, { width: totalsBoxWidth - 110, align: 'right' });
      }

      doc.fillColor(darkColor)
        .text('Delivery / Freight:', totalsBoxX + 10, topY + 36)
        .text(`Rs. ${deliveryVal.toLocaleString('en-IN')}`, totalsBoxX + 100, topY + 36, { width: totalsBoxWidth - 110, align: 'right' });

      // Grand Total Highlight
      doc.rect(totalsBoxX, topY + 52, totalsBoxWidth, 28).fill(primaryColor);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9)
        .text('GRAND TOTAL:', totalsBoxX + 10, topY + 60)
        .fontSize(12)
        .text(`Rs. ${grandTotalVal.toLocaleString('en-IN')}`, totalsBoxX + 80, topY + 58, { width: totalsBoxWidth - 90, align: 'right' });

      // Notes / Payment summary on Left
      const notesX = margin;
      const notesWidth = contentWidth - totalsBoxWidth - 16;
      doc.rect(notesX, topY, notesWidth, 80).strokeColor(borderColor).lineWidth(1).stroke();
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(8)
        .text('BILL NOTES & PAYMENT LEDGER:', notesX + 8, topY + 8);
      doc.font('Helvetica').fontSize(7.5).fillColor(grayColor)
        .text(`Payment Mode: ${billData.paymentMethod || 'CASH'}`, notesX + 8, topY + 22)
        .text(`Payment Status: ${(billData.paymentStatus || 'PAID').toUpperCase()} (Settled in SachiKheti DB)`, notesX + 8, topY + 34)
        .text(billData.notes ? `Admin Remarks: ${billData.notes}` : 'Certified authentic agricultural produce & tractor hiring from Lamma Farmer Producer Co. Ltd.', notesX + 8, topY + 46, { width: notesWidth - 16 });

      topY += 92;

      // ----------------------------------------------------
      // 7. TERMS & CONDITIONS AND AUTHORIZED SIGNATURES
      // ----------------------------------------------------
      const termsBoxHeight = 56;
      doc.rect(margin, topY, contentWidth, termsBoxHeight).strokeColor(borderColor).lineWidth(1).stroke();
      doc.rect(margin, topY, contentWidth, 14).fill(lightGray);
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(7.5)
        .text(isRental ? 'TERMS & HIRING CONDITIONS:' : 'TERMS & CONDITIONS:', margin + 6, topY + 3);

      const termsText = isRental
        ? (billDesign.rentalTermsNotes || '1. Machinery delivered in verified operational state. 2. Penalty charged for overdue usage beyond agreed hours/acres. 3. Hirer bears fuel & routine operational care. 4. Accidental damage from negligence is the liability of the hirer.')
        : (billDesign.termsNotes || '1. Goods once delivered are verified fresh. 2. Certified direct farm produce from indigenous farmers. 3. Thank you for choosing SachiKheti!');

      doc.fillColor(grayColor).font('Helvetica').fontSize(7)
        .text(termsText, margin + 6, topY + 18, { width: contentWidth - 12 });

      topY += termsBoxHeight + 16;

      // Signature Blocks
      const sigColWidth = (contentWidth - 40) / 2;
      doc.moveTo(margin, topY + 24).lineTo(margin + sigColWidth, topY + 24).lineWidth(0.8).stroke(darkColor);
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(8)
        .text('Customer / Hirer Signature', margin, topY + 28, { width: sigColWidth, align: 'center' });

      doc.moveTo(margin + sigColWidth + 40, topY + 24).lineTo(margin + contentWidth, topY + 24).lineWidth(0.8).stroke(primaryColor);
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(8)
        .text(billDesign.authorizedSignatoryTitle || 'Authorized Store Manager (LFPC Ltd.)', margin + sigColWidth + 40, topY + 28, { width: sigColWidth, align: 'center' });

      // Footer notice
      doc.fillColor('#9CA3AF').font('Helvetica').fontSize(6.5)
        .text(`Computer generated official bill • SachiKheti Platform (LFPC Ltd.) • Timestamp: ${new Date().toISOString()}`, margin, 800, { align: 'center', width: contentWidth });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
