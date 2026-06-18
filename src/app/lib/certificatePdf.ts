type CertificateTrainee = {
  fullName: string;
  schoolName: string;
  clinicName: string;
  totalHours: number;
  startDate: string;
  endDate: string;
  batchName?: string;
  ojtYear?: string;
};

function sanitizeFilePart(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function certificateFileName(trainees: CertificateTrainee[], fallbackBatchName?: string) {
  const first = trainees[0];
  if (!first) {
    return 'PSYZYGY-OJT-certificate.pdf';
  }

  const year = first.ojtYear || new Date().getFullYear().toString();
  const batch = first.batchName || fallbackBatchName || 'Batch';

  if (trainees.length === 1) {
    return [
      'PSYZYGY-OJT-Certificate',
      sanitizeFilePart(first.fullName),
      sanitizeFilePart(first.schoolName || 'School'),
      sanitizeFilePart(year),
      sanitizeFilePart(batch),
    ].filter(Boolean).join('-') + '.pdf';
  }

  return [
    'PSYZYGY-OJT-Certificates',
    sanitizeFilePart(year),
    sanitizeFilePart(batch),
    `${trainees.length}-trainees`,
  ].filter(Boolean).join('-') + '.pdf';
}

async function loadLogoDataUrl() {
  try {
    const response = await fetch('/favicon.png');
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function fitText(pdf: any, text: string, maxWidth: number, startSize: number, minSize = 18) {
  let fontSize = startSize;
  pdf.setFontSize(fontSize);
  while (pdf.getTextWidth(text) > maxWidth && fontSize > minSize) {
    fontSize -= 1;
    pdf.setFontSize(fontSize);
  }
  return fontSize;
}

export async function generateOjtCertificatePdf(trainees: CertificateTrainee[], batchName?: string) {
  const { jsPDF } = await import('jspdf');
  const logoDataUrl = await loadLogoDataUrl();
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  trainees.forEach((trainee, index) => {
    if (index > 0) {
      pdf.addPage();
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const year = trainee.ojtYear || new Date().getFullYear().toString();
    const traineeBatch = trainee.batchName || batchName || 'OJT Batch';
    const certificateNumber = `PSY-OJT-${year}-${String(index + 1).padStart(4, '0')}`;

    pdf.setFillColor(255, 253, 249);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setFillColor(31, 89, 105);
    pdf.rect(0, 0, pageWidth, 18, 'F');
    pdf.rect(0, pageHeight - 18, pageWidth, 18, 'F');
    pdf.setFillColor(201, 50, 56);
    pdf.rect(0, 18, pageWidth, 5, 'F');
    pdf.rect(0, pageHeight - 23, pageWidth, 5, 'F');

    pdf.setDrawColor(31, 89, 105);
    pdf.setLineWidth(2.4);
    pdf.roundedRect(38, 42, pageWidth - 76, pageHeight - 84, 12, 12);
    pdf.setDrawColor(205, 176, 105);
    pdf.setLineWidth(1.1);
    pdf.roundedRect(55, 59, pageWidth - 110, pageHeight - 118, 8, 8);

    pdf.setFillColor(31, 89, 105);
    pdf.circle(pageWidth / 2, 84, 34, 'F');
    pdf.setFillColor(255, 255, 255);
    pdf.circle(pageWidth / 2, 84, 29, 'F');

    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 24, 60, 48, 48);
    } else {
      pdf.setFont('times', 'bold');
      pdf.setFontSize(30);
      pdf.setTextColor(31, 89, 105);
      pdf.text('PSY', pageWidth / 2, 94, { align: 'center' });
    }

    pdf.setFont('times', 'bold');
    pdf.setFontSize(25);
    pdf.setTextColor(31, 89, 105);
    pdf.text('PSYZYGY Psychological Center Inc.', pageWidth / 2, 140, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(132, 108, 64);
    pdf.text('CARE | GROWTH | EXCELLENCE', pageWidth / 2, 158, { align: 'center' });

    pdf.setFont('times', 'bold');
    pdf.setFontSize(36);
    pdf.setTextColor(34, 34, 34);
    pdf.text('Certificate of Completion', pageWidth / 2, 212, { align: 'center' });

    pdf.setDrawColor(205, 176, 105);
    pdf.setLineWidth(1);
    pdf.line(pageWidth / 2 - 145, 228, pageWidth / 2 + 145, 228);

    pdf.setFont('times', 'normal');
    pdf.setFontSize(13);
    pdf.setTextColor(80, 80, 80);
    pdf.text('This certificate is proudly presented to', pageWidth / 2, 268, { align: 'center' });

    pdf.setFont('times', 'bold');
    pdf.setTextColor(31, 89, 105);
    fitText(pdf, trainee.fullName, pageWidth - 190, 35, 22);
    pdf.text(trainee.fullName, pageWidth / 2, 322, { align: 'center' });

    pdf.setDrawColor(205, 176, 105);
    pdf.setLineWidth(1.2);
    pdf.line(pageWidth / 2 - 190, 340, pageWidth / 2 + 190, 340);

    pdf.setFont('times', 'normal');
    pdf.setFontSize(13);
    pdf.setTextColor(70, 70, 70);
    const description = [
      `for successfully completing the On-the-Job Training program at ${trainee.clinicName}`,
      `with a total of ${trainee.totalHours} training hours from ${trainee.startDate} to ${trainee.endDate}.`,
      trainee.schoolName ? `School/Institution: ${trainee.schoolName}` : '',
      `OJT Year: ${year}   |   Batch: ${traineeBatch}`,
    ].filter(Boolean);

    description.forEach((line, lineIndex) => {
      pdf.text(line, pageWidth / 2, 382 + lineIndex * 22, { align: 'center', maxWidth: pageWidth - 160 });
    });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Certificate No. ${certificateNumber}`, 72, pageHeight - 78);
    pdf.text('Issued by PSYZYGY Psychological Center Inc.', 72, pageHeight - 60);

    pdf.setDrawColor(31, 89, 105);
    pdf.setLineWidth(1);
    pdf.line(pageWidth - 270, pageHeight - 104, pageWidth - 82, pageHeight - 104);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(34, 34, 34);
    pdf.text('Authorized Signature', pageWidth - 176, pageHeight - 82, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Training Supervisor / Administrator', pageWidth - 176, pageHeight - 66, { align: 'center' });
  });

  pdf.save(certificateFileName(trainees, batchName));
}
