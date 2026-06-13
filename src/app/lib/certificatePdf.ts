type CertificateTrainee = {
  fullName: string;
  schoolName: string;
  clinicName: string;
  totalHours: number;
  startDate: string;
  endDate: string;
};

export async function generateOjtCertificatePdf(trainees: CertificateTrainee[], batchName?: string) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  trainees.forEach((trainee, index) => {
    if (index > 0) {
      pdf.addPage();
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const certificateNumber = `PSY-OJT-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`;

    pdf.setDrawColor(31, 89, 105);
    pdf.setLineWidth(3);
    pdf.rect(36, 36, pageWidth - 72, pageHeight - 72);
    pdf.setLineWidth(1);
    pdf.rect(52, 52, pageWidth - 104, pageHeight - 104);

    pdf.setFont('times', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(31, 89, 105);
    pdf.text('PSYZYGY Psychological Center Inc.', pageWidth / 2, 112, { align: 'center' });

    pdf.setFont('times', 'normal');
    pdf.setFontSize(16);
    pdf.setTextColor(80, 80, 80);
    pdf.text('Certificate of Completion', pageWidth / 2, 166, { align: 'center' });

    pdf.setFontSize(12);
    pdf.text('This certifies that', pageWidth / 2, 220, { align: 'center' });

    pdf.setFont('times', 'bold');
    pdf.setFontSize(30);
    pdf.setTextColor(24, 24, 24);
    pdf.text(trainee.fullName, pageWidth / 2, 272, { align: 'center' });

    pdf.setDrawColor(180, 180, 180);
    pdf.line(pageWidth / 2 - 170, 286, pageWidth / 2 + 170, 286);

    pdf.setFont('times', 'normal');
    pdf.setFontSize(13);
    pdf.setTextColor(70, 70, 70);
    const description = [
      `has completed the On-the-Job Training program at ${trainee.clinicName}`,
      `for ${trainee.totalHours} hours from ${trainee.startDate} to ${trainee.endDate}.`,
      trainee.schoolName ? `School/Institution: ${trainee.schoolName}` : '',
      batchName ? `Batch: ${batchName}` : '',
    ].filter(Boolean);

    description.forEach((line, lineIndex) => {
      pdf.text(line, pageWidth / 2, 332 + lineIndex * 22, { align: 'center' });
    });

    pdf.setFontSize(11);
    pdf.text(`Certificate No. ${certificateNumber}`, 70, pageHeight - 86);
    pdf.text('Authorized Signature', pageWidth - 220, pageHeight - 86);
    pdf.line(pageWidth - 260, pageHeight - 104, pageWidth - 78, pageHeight - 104);
  });

  pdf.save(batchName ? `${batchName}-ojt-certificates.pdf` : 'ojt-certificate.pdf');
}
