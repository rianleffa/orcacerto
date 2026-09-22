import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateBudgetPdf(
  elementId: string,
  fileName: string = 'orcamento.pdf'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

  try {
    // Clone or capture element
    const canvas = await html2canvas(element, {
      scale: 2, // Retinal high resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Check if height exceeds page
    if (pdfHeight > pdf.internal.pageSize.getHeight()) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    } else {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating PDF via html2canvas/jspdf, falling back to print:', error);
    // Fallback to window.print()
    window.print();
    return true;
  }
}
