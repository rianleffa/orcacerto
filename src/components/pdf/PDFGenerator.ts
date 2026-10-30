export async function generateBudgetPdf(
  elementId: string,
  fileName: string = 'orcamento.pdf'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

  const originalStyle = element.style.cssText;
  const hadPdfExportClass = element.classList.contains('pdf-export');
  const clippedAncestors: Array<{ element: HTMLElement; cssText: string }> = [];
  try {
    // Dynamic import to avoid loading heavy PDF libraries on initial page loads
    const [{ jsPDF }, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const html2canvas = (html2canvasModule as any).default || html2canvasModule;

    // Render at a consistent document width, independent of the device used
    // to request the PDF. This prevents mobile previews from creating narrow PDFs.
    element.classList.add('pdf-export');
    element.style.width = '794px';
    element.style.minWidth = '794px';
    element.style.maxWidth = 'none';
    element.style.minHeight = '0';
    element.style.height = 'auto';
    element.style.maxHeight = 'none';
    element.style.overflow = 'visible';

    let ancestor = element.parentElement;
    while (ancestor && ancestor !== document.body) {
      const computed = window.getComputedStyle(ancestor);
      if (computed.overflowX !== 'visible' || computed.overflowY !== 'visible') {
        clippedAncestors.push({ element: ancestor, cssText: ancestor.style.cssText });
        ancestor.style.overflow = 'visible';
      }
      ancestor = ancestor.parentElement;
    }

    const bounds = element.getBoundingClientRect();
    const captureWidth = Math.max(
      1024,
      document.documentElement.clientWidth,
      Math.ceil(bounds.right + 32)
    );
    const captureHeight = Math.max(
      window.innerHeight,
      document.documentElement.scrollHeight,
      element.scrollHeight
    );

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: captureWidth,
      windowHeight: captureHeight,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('O documento não possui conteúdo para exportar.');
    }

    const imgData = canvas.toDataURL('image/png');
    const pageWidth = 210;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const imageHeight = (canvas.height * contentWidth) / canvas.width;
    if (!Number.isFinite(imageHeight) || imageHeight <= 0) {
      throw new Error('Não foi possível calcular a altura do documento PDF.');
    }

    // Use one custom-height page. The content keeps its A4 width and the page
    // grows with the captured document, so no section is split or repeated.
    const pageHeight = imageHeight + margin * 2;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidth, pageHeight],
      compress: true,
    });

    pdf.setProperties({ title: fileName.replace(/\.pdf$/i, '') });
    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, imageHeight, 'budget-document', 'FAST');

    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating budget PDF:', error);
    return false;
  } finally {
    element.style.cssText = originalStyle;
    if (!hadPdfExportClass) element.classList.remove('pdf-export');
    clippedAncestors.forEach(({ element: ancestor, cssText }) => {
      ancestor.style.cssText = cssText;
    });
  }
}
