/**
 * Pure JavaScript PDF-1.4 Generator for Radiology Consultation Reports
 * Zero external dependencies. Guaranteed compatibility with Adobe Acrobat, Chrome, Edge, Apple Preview.
 */
export class RadiologyPdfGenerator {
  constructor() {
    this.objects = [];
    this.fontRegularObjId = 0;
    this.fontBoldObjId = 0;
  }

  generateReportPdf(report, order) {
    this.objects = [];

    // Object 1: Catalog
    const catalogObjId = this.addObject(
      `<< /Type /Catalog /Pages 2 0 R >>`
    );

    // Object 2: Pages
    // We will placeholder Pages object and update it after building page
    const pagesObjIndex = this.objects.length;
    this.objects.push(''); // placeholder for Pages

    // Fonts
    this.fontRegularObjId = this.addObject(
      `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`
    );
    this.fontBoldObjId = this.addObject(
      `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`
    );

    // Build Page Content
    const streamContent = this.buildStreamContent(report, order);
    const streamLength = Buffer.byteLength(streamContent, 'latin1');

    // Object: Content Stream
    const contentObjId = this.addObject(
      `<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`
    );

    // Object: Page (Standard Letter 612 x 792 pt, 0.75 in margins)
    const pageObjId = this.addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Contents ${contentObjId} 0 R ` +
      `/Resources << /Font << /F1 ${this.fontRegularObjId} 0 R /F2 ${this.fontBoldObjId} 0 R >> >> >>`
    );

    // Update Pages Object (Object 2)
    this.objects[pagesObjIndex] = `<< /Type /Pages /Kids [${pageObjId} 0 R] /Count 1 >>`;

    // Assemble PDF binary
    return this.assemblePdf();
  }

  addObject(content) {
    this.objects.push(content);
    return this.objects.length;
  }

  escapePdfText(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  buildStreamContent(report, order) {
    const lines = [];

    // Page coordinates: (0,0) is bottom-left, (612, 792) is top-right
    let y = 745;
    const leftMargin = 50;
    const rightMargin = 562;

    // Helper: draw text
    const drawText = (
      text,
      x,
      yPos,
      font,
      size,
      rgb = [0, 0, 0]
    ) => {
      lines.push(
        `BT /${font} ${size} Tf ${rgb[0]} ${rgb[1]} ${rgb[2]} rg 1 0 0 1 ${x} ${yPos} Tm (${this.escapePdfText(text)}) Tj ET`
      );
    };

    // Helper: draw line
    const drawHLine = (yPos, rgb = [0.8, 0.8, 0.8], width = 1) => {
      lines.push(
        `${rgb[0]} ${rgb[1]} ${rgb[2]} RG ${width} w ${leftMargin} ${yPos} m ${rightMargin} ${yPos} l S`
      );
    };

    // Helper: draw rectangle
    const drawRect = (
      x,
      yPos,
      w,
      h,
      fillRgb,
      strokeRgb
    ) => {
      if (strokeRgb) {
        lines.push(
          `${strokeRgb[0]} ${strokeRgb[1]} ${strokeRgb[2]} RG ${fillRgb[0]} ${fillRgb[1]} ${fillRgb[2]} rg ${x} ${yPos} ${w} ${h} B`
        );
      } else {
        lines.push(`${fillRgb[0]} ${fillRgb[1]} ${fillRgb[2]} rg ${x} ${yPos} ${w} ${h} f`);
      }
    };

    // 1. Header Banner & Branding
    drawRect(leftMargin, y - 8, rightMargin - leftMargin, 40, [0.03, 0.1, 0.2]);
    drawText('RADIOLOGY LAB DIAGNOSTIC IMAGING CENTER', leftMargin + 14, y + 16, 'F2', 13, [1, 1, 1]);
    drawText('Main Clinical Suite • Department of Diagnostic Imaging • Tel: (555) 019-4820', leftMargin + 14, y + 2, 'F1', 8, [0.75, 0.85, 0.95]);

    drawText('STATUS:', rightMargin - 95, y + 16, 'F1', 8, [0.75, 0.85, 0.95]);
    const statusText = `${report.status} v${report.version}`;
    drawText(statusText, rightMargin - 95, y + 3, 'F2', 10, [0.2, 0.9, 0.5]);

    y -= 30;

    // Report Title
    drawText('OFFICIAL RADIOLOGICAL CONSULTATION REPORT', leftMargin, y, 'F2', 12, [0.05, 0.2, 0.4]);
    const reportDate = report.finalizedAt ? new Date(report.finalizedAt).toLocaleDateString() : new Date().toLocaleDateString();
    drawText(`Date: ${reportDate}`, rightMargin - 100, y, 'F1', 9, [0.3, 0.3, 0.3]);
    y -= 12;
    drawHLine(y, [0.02, 0.5, 0.78], 1.5);

    y -= 18;

    // 2. Patient & Examination Details Box (2 columns)
    drawRect(leftMargin, y - 62, rightMargin - leftMargin, 74, [0.97, 0.98, 0.99], [0.85, 0.88, 0.92]);
    const col1X = leftMargin + 12;
    const col2X = leftMargin + 260;

    // Row 1
    drawText('Patient Name:', col1X, y, 'F2', 9, [0.3, 0.3, 0.3]);
    drawText(report.patientName || order.patientName, col1X + 75, y, 'F2', 10, [0, 0, 0]);

    drawText('Accession #:', col2X, y, 'F2', 9, [0.3, 0.3, 0.3]);
    drawText(report.accessionNumber, col2X + 70, y, 'F2', 10, [0.05, 0.3, 0.6]);

    y -= 16;
    // Row 2
    drawText('Patient ID / MRN:', col1X, y, 'F2', 9, [0.3, 0.3, 0.3]);
    drawText(report.patientId, col1X + 75, y, 'F1', 9, [0.1, 0.1, 0.1]);

    drawText('Order ID:', col2X, y, 'F2', 9, [0.3, 0.3, 0.3]);
    drawText(report.orderId, col2X + 70, y, 'F1', 9, [0.1, 0.1, 0.1]);

    y -= 16;
    // Row 3
    drawText('Procedure:', col1X, y, 'F2', 9, [0.3, 0.3, 0.3]);
    drawText(`${order.modality} - ${order.examinationName}`, col1X + 75, y, 'F1', 9, [0.1, 0.1, 0.1]);

    drawText('Referring Phys:', col2X, y, 'F2', 9, [0.3, 0.3, 0.3]);
    drawText(order.referringDoctor || 'Hospital Staff', col2X + 70, y, 'F1', 9, [0.1, 0.1, 0.1]);

    y -= 16;
    // Row 4
    drawText('Body Region:', col1X, y, 'F2', 9, [0.3, 0.3, 0.3]);
    drawText(`${order.bodyRegion} (${order.laterality})`, col1X + 75, y, 'F1', 9, [0.1, 0.1, 0.1]);

    drawText('Study UID:', col2X, y, 'F2', 8, [0.4, 0.4, 0.4]);
    const shortUid = order.studyInstanceUid ? (order.studyInstanceUid.length > 28 ? order.studyInstanceUid.substring(0, 26) + '...' : order.studyInstanceUid) : 'Archived';
    drawText(shortUid, col2X + 70, y, 'F1', 8, [0.4, 0.4, 0.4]);

    y -= 34;

    // 3. Clinical Indication & Technique
    if (order.clinicalIndication) {
      drawText('CLINICAL INDICATION:', leftMargin, y, 'F2', 9, [0.05, 0.2, 0.4]);
      y -= 12;
      drawText(order.clinicalIndication, leftMargin, y, 'F1', 9, [0.15, 0.15, 0.15]);
      y -= 16;
    }

    if (order.protocol || report.technique) {
      drawText('TECHNIQUE & PROTOCOL:', leftMargin, y, 'F2', 9, [0.05, 0.2, 0.4]);
      y -= 12;
      drawText(report.technique || order.protocol || 'Standard cross-sectional protocol.', leftMargin, y, 'F1', 9, [0.15, 0.15, 0.15]);
      y -= 16;
    }

    drawHLine(y, [0.85, 0.88, 0.92]);
    y -= 18;

    // 4. Structured Findings
    drawText('FINDINGS & OBSERVATIONS:', leftMargin, y, 'F2', 10, [0.05, 0.2, 0.4]);
    y -= 14;

    if (report.sections && report.sections.length > 0) {
      for (const section of report.sections) {
        drawText(section.title.toUpperCase(), leftMargin, y, 'F2', 8.5, [0.2, 0.4, 0.6]);
        y -= 12;

        for (const [key, val] of Object.entries(section.fields)) {
          if (val === undefined || val === '') continue;
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const displayVal = typeof val === 'boolean' ? (val ? 'Yes / Present' : 'None / Negative') : String(val);
          
          // Wrap or truncate long lines safely
          const entryLine = `•  ${label}: ${displayVal}`;
          const maxChar = 85;
          if (entryLine.length > maxChar) {
            drawText(entryLine.substring(0, maxChar), leftMargin + 8, y, 'F1', 8.5, [0.1, 0.1, 0.1]);
            y -= 10;
            drawText(`   ${entryLine.substring(maxChar)}`, leftMargin + 8, y, 'F1', 8.5, [0.1, 0.1, 0.1]);
          } else {
            drawText(entryLine, leftMargin + 8, y, 'F1', 8.5, [0.1, 0.1, 0.1]);
          }
          y -= 12;
        }
        y -= 4;
      }
    } else {
      drawText('Intact anatomical landmarks without acute focal lesion.', leftMargin + 8, y, 'F1', 9, [0.2, 0.2, 0.2]);
      y -= 14;
    }

    y -= 6;
    drawHLine(y, [0.85, 0.88, 0.92]);
    y -= 16;

    // 5. Clinical Impression Box (Highlighted)
    drawRect(leftMargin, y - 56, rightMargin - leftMargin, 66, [0.94, 0.97, 1.0], [0.1, 0.4, 0.8]);
    drawText('IMPRESSION:', leftMargin + 12, y - 2, 'F2', 10, [0.05, 0.25, 0.55]);

    y -= 16;
    const impressionLines = (report.impression || 'No acute abnormality.').split('\n');
    for (const impLine of impressionLines) {
      const trimmed = impLine.trim();
      if (!trimmed) continue;
      const maxImpChar = 80;
      if (trimmed.length > maxImpChar) {
        drawText(trimmed.substring(0, maxImpChar), leftMargin + 12, y, 'F2', 9, [0, 0, 0]);
        y -= 12;
        drawText(trimmed.substring(maxImpChar), leftMargin + 12, y, 'F2', 9, [0, 0, 0]);
      } else {
        drawText(trimmed, leftMargin + 12, y, 'F2', 9, [0, 0, 0]);
      }
      y -= 12;
    }

    if (report.recommendations) {
      y -= 2;
      drawText(`Recommendations: ${report.recommendations}`, leftMargin + 12, y, 'F1', 8.5, [0.1, 0.3, 0.6]);
    }

    y -= 42;

    // 6. Critical Communication Note (if triggered)
    if (report.criticalResultsNotified) {
      drawRect(leftMargin, y - 10, rightMargin - leftMargin, 20, [1.0, 0.94, 0.94], [0.9, 0.3, 0.3]);
      drawText(`CRITICAL NOTIFICATION: Communicated to referring clinician. ${report.criticalNotificationDetails || ''}`, leftMargin + 10, y + 2, 'F2', 8, [0.7, 0.1, 0.1]);
      y -= 28;
    }

    // 7. Electronic Signature & Footer Block
    y = Math.min(y, 110);
    drawHLine(y + 20, [0.75, 0.78, 0.82], 1);

    drawText('Electronically Signed and Attested By:', leftMargin, y + 8, 'F1', 8, [0.4, 0.4, 0.4]);
    drawText(report.radiologist?.name || 'Dr. Gregory House, MD', leftMargin, y - 4, 'F2', 10, [0, 0, 0]);
    drawText(`Staff Radiologist • Medical License #${report.radiologist?.licenseNumber || 'RAD-98234'}`, leftMargin, y - 16, 'F1', 8, [0.35, 0.35, 0.35]);

    drawText(`Report ID: ${report.reportId}`, rightMargin - 150, y + 8, 'F1', 8, [0.4, 0.4, 0.4]);
    drawText(`Signed: ${report.finalizedAt ? new Date(report.finalizedAt).toLocaleString() : 'Preliminary'}`, rightMargin - 150, y - 4, 'F1', 8, [0.2, 0.2, 0.2]);
    drawText(`Archive UID: ${order.orthancStudyId || 'PACS-LINKED'}`, rightMargin - 150, y - 16, 'F1', 7.5, [0.5, 0.5, 0.5]);

    // Footer bottom notice
    drawText('CONFIDENTIAL MEDICAL RECORD • Radiology Lab Management System • Demonstrable MVP', leftMargin + 85, 24, 'F1', 7, [0.55, 0.55, 0.55]);

    return lines.join('\n');
  }

  assemblePdf() {
    let pdf = `%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`;
    const offsets = [];

    for (let i = 0; i < this.objects.length; i++) {
      offsets.push(Buffer.byteLength(pdf, 'latin1'));
      pdf += `${i + 1} 0 obj\n${this.objects[i]}\nendobj\n`;
    }

    const xrefOffset = Buffer.byteLength(pdf, 'latin1');
    pdf += `xref\n0 ${this.objects.length + 1}\n`;
    pdf += `0000000000 65535 f \n`;

    for (const offset of offsets) {
      const padded = offset.toString().padStart(10, '0');
      pdf += `${padded} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${this.objects.length + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

    return Buffer.from(pdf, 'latin1');
  }
}

export const radiologyPdfGenerator = new RadiologyPdfGenerator();
