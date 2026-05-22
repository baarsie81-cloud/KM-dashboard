import { validateExportFile } from './validateExportFile.js';

export async function parseJsonFiles(fileList) {
  const files = Array.from(fileList);

  return Promise.all(
    files.map(async (file) => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        return validateExportFile(data, file.name);
      } catch (error) {
        return {
          id: `${file.name}-${file.size}-${file.lastModified}`,
          fileName: file.name,
          data: null,
          status: 'ongeldig',
          errors: ['Dit bestand is geen geldige JSON.'],
          warnings: [],
          rawError: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );
}
