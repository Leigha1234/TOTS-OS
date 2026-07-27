// ==========================================
// 3. lib/import/fileParser.ts
// ==========================================

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { RawRow } from "./types";

export async function parseFile(file: File): Promise<RawRow[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv') || fileName.endsWith('.tsv')) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: fileName.endsWith('.tsv') ? '\t' : '',
        complete: (results: Papa.ParseResult<RawRow>) => {
          resolve(results.data);
        },
        error: (error: Error) => {
          reject(new Error(`Failed to parse CSV/TSV file: ${error.message}`));
        }
      });
    });
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<RawRow>(worksheet, { defval: '' });
      return jsonData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse Excel file: ${errorMessage}`);
    }
  } else {
    throw new Error("Unsupported file format. Please upload a CSV, XLSX, XLS, or TSV file.");
  }
}