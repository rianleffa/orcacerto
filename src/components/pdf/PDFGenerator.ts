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
    // Dynamic import to avoid loading heavy PDF libraries on initial page loads
    const [{ jsPDF }, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const html2canvas = (html2canvasModule as any).default || html2canvasModule;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('O documento não possui conteúdo para exportar.');
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const margin = 12;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;
    const imageHeight = (canvas.height * contentWidth) / canvas.width;
    const pageCount = Math.max(1, Math.ceil(imageHeight / contentHeight));

    pdf.setProperties({ title: fileName.replace(/\.pdf$/i, '') });
    for (let page = 0; page < pageCount; page += 1) {
      if (page > 0) pdf.addPage();
      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin - page * contentHeight,
        contentWidth,
        imageHeight,
        'budget-document',
        'FAST'
      );
    }

    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating budget PDF:', error);
    return false;
  }
}
