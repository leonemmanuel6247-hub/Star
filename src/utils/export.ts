import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Save text/binary content as a file in the app's cache directory
 * and present the system Share sheet so the user can save/send it.
 */
export async function exportContent(
  content: string,
  filename: string,
  mimeType: string = 'application/octet-stream'
): Promise<void> {
  try {
    const dir = FileSystem.cacheDirectory;
    if (!dir) throw new Error('cacheDirectory not available');
    const fileUri = `${dir}${filename}`;

    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: filename,
        UTI: 'public.data',
      });
    } else {
      console.warn('Sharing not available on this device');
    }
  } catch (err) {
    console.error('exportContent error', err);
    throw err;
  }
}

export async function exportWriterFile(
  name: string,
  htmlContent: string
): Promise<void> {
  const safeName = name.endsWith('.docx') ? name : `${name}.docx`;
  // For Android, export the HTML directly with .docx extension.
  // Word can open HTML saved as .docx.
  await exportContent(htmlContent, safeName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

export async function exportCalcFile(
  name: string,
  sheets: Array<{ name: string; rows: any[][] }>
): Promise<void> {
  const safeName = name.endsWith('.csv') ? name : `${name}.csv`;
  const csvParts: string[] = [];
  for (const sheet of sheets) {
    csvParts.push(`# ${sheet.name}`);
    for (const row of sheet.rows) {
      csvParts.push(
        row
          .map((c) => {
            const v = c == null ? '' : String(c);
            return /[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          })
          .join(',')
      );
    }
    csvParts.push('');
  }
  await exportContent(csvParts.join('\n'), safeName, 'text/csv');
}

export async function exportPresentationFile(
  name: string,
  slides: any[]
): Promise<void> {
  const safeName = name.endsWith('.json') ? name : `${name}.json`;
  await exportContent(
    JSON.stringify({ slides }, null, 2),
    safeName,
    'application/json'
  );
}
