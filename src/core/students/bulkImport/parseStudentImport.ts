import * as XLSX from 'xlsx';
import type { StudentImportRawRow } from './types';
import { normalizeHeader } from './validateStudentImport';

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

function rowsFromMatrix(matrix: string[][]): StudentImportRawRow[] {
  if (matrix.length === 0) return [];
  const headers = matrix[0].map(normalizeHeader);
  const rows: StudentImportRawRow[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r];
    if (!cells || cells.every((c) => !String(c || '').trim())) continue;
    const values: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (!h) return;
      values[h] = String(cells[i] ?? '').trim();
    });
    rows.push({ rowNumber: r + 1, values });
  }
  return rows;
}

export function parseStudentImportCsv(text: string): StudentImportRawRow[] {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter((l) => l.trim().length > 0);
  const matrix = lines.map(splitCsvLine);
  return rowsFromMatrix(matrix);
}

export function parseStudentImportWorkbook(buffer: ArrayBuffer): StudentImportRawRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as string[][];
  return rowsFromMatrix(matrix.map((row) => row.map((c) => String(c ?? ''))));
}

export async function parseStudentImportFile(file: File): Promise<StudentImportRawRow[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || file.type === 'text/csv') {
    const text = await file.text();
    return parseStudentImportCsv(text);
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    return parseStudentImportWorkbook(buffer);
  }
  throw new Error('CSV(.csv) 또는 Excel(.xlsx, .xls) 파일만 지원합니다.');
}
