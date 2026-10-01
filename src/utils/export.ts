import * as XLSX from 'xlsx';
import { OfficeFile, CalcSheet } from '../types/office';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportWriterFile(file: OfficeFile, format: 'docx' | 'txt' | 'odt' | 'html') {
  const content = file.content?.html || '';
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  if (format === 'txt') {
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${file.name.replace(/\.[^/.]+$/, '')}.txt`);
    return;
  }

  if (format === 'html') {
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${file.name}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 210mm; min-height: 297mm; margin: 20px auto; padding: 25mm 20mm; color: #1e293b; background: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    downloadBlob(blob, `${file.name.replace(/\.[^/.]+$/, '')}.html`);
    return;
  }

  // For .docx and .odt, package as standard OpenDocument / Word HTML format with official A4 measurements (595.3pt x 841.9pt)
  const docxHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${file.name}</title>
      <!--[if gte mso 9]>
      <xml>
      <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 { size: 595.3pt 841.9pt; margin: 56.7pt 56.7pt 56.7pt 56.7pt; mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt; }
        div.Section1 { page: Section1; }
        body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #000; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #999; padding: 6px; }
      </style>
    </head>
    <body>
      <div class="Section1">
        ${content}
      </div>
    </body>
    </html>
  `;
  const mimeType = format === 'docx' 
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    : 'application/vnd.oasis.opendocument.text';
  const blob = new Blob(['\ufeff', docxHtml], { type: mimeType });
  downloadBlob(blob, `${file.name.replace(/\.[^/.]+$/, '')}.${format}`);
}

export function exportCalcFile(file: OfficeFile, format: 'xlsx' | 'csv' | 'ods') {
  const sheets: CalcSheet[] = file.content?.sheets || [];
  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    // build 2D array matrix
    const matrix: string[][] = [];
    for (let r = 1; r <= sheet.rowCount; r++) {
      const row: string[] = [];
      let hasData = false;
      for (let c = 0; c < sheet.colCount; c++) {
        const colLetter = String.fromCharCode(65 + c);
        const cell = sheet.data[`${colLetter}${r}`];
        const val = cell?.display || cell?.value || '';
        row.push(val);
        if (val) hasData = true;
      }
      if (hasData || r <= 15) {
        matrix.push(row);
      }
    }
    const ws = XLSX.utils.aoa_to_sheet(matrix);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
  });

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  if (format === 'csv') {
    XLSX.writeFile(wb, `${baseName}.csv`, { bookType: 'csv' });
  } else if (format === 'ods') {
    XLSX.writeFile(wb, `${baseName}.ods`, { bookType: 'ods' });
  } else {
    XLSX.writeFile(wb, `${baseName}.xlsx`, { bookType: 'xlsx' });
  }
}

export function exportPresentationFile(file: OfficeFile) {
  // Export presentation as rich portable JSON document / presentation data
  const data = JSON.stringify(file.content, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  downloadBlob(blob, `${file.name.replace(/\.[^/.]+$/, '')}.pptx.json`);
}

export function triggerPrint() {
  window.print();
}
