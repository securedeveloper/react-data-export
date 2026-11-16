// Editor state -> what <ExcelExport>/useExcelExport and fromDataset receive. Pure, unit-tested.
import type { Dataset, DatasetOptions, ExportFormat, ExportOptions, Style } from "react-data-export";

export interface EditorOptions {
  sheetName: string;
  filename: string;
  format: ExportFormat;
  freezeHeader: boolean;
  autoFilter: boolean;
  autoWidth: boolean;
  totals: boolean;
  bandedRows: boolean;
  headerFill: "" | "DDEBF7" | "E2EFDA" | "FCE4D6";
}

export const DEFAULT_OPTIONS: EditorOptions = {
  sheetName: "Sales",
  filename: "sales",
  format: "xlsx",
  freezeHeader: true,
  autoFilter: true,
  autoWidth: true,
  totals: true,
  bandedRows: false,
  headerFill: "DDEBF7",
};

export type ParseResult = { ok: true; dataset: Dataset<unknown> } | { ok: false; message: string };

/** Parses the editor's JSON; the shape is checked by fromDataset itself. */
export function parseDataset(text: string): ParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    return { ok: false, message: `Not valid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (typeof value !== "object" || value === null || !Array.isArray((value as { columns?: unknown }).columns) || !Array.isArray((value as { data?: unknown }).data)) {
    return { ok: false, message: "Expected an object with a columns array and a data array: { columns, data }." };
  }
  return { ok: true, dataset: value as Dataset<unknown> };
}

const STRIPE: Style = { fill: "F2F2F2" };

/** The sheet options fromDataset gets (also used for the preview). */
export function sheetOptions(o: EditorOptions): DatasetOptions<unknown> {
  const options: DatasetOptions<unknown> = {
    name: o.sheetName,
    freezeHeader: o.freezeHeader,
    autoFilter: o.autoFilter,
    autoWidth: o.autoWidth,
    headerStyle: { font: { bold: true }, ...(o.headerFill ? { fill: o.headerFill } : {}) },
  };
  if (o.totals) options.totals = { label: "Total", style: { font: { bold: true } } };
  if (o.bandedRows) options.rowStyle = (_row, i) => (i % 2 === 1 ? STRIPE : undefined);
  return options;
}

/** The export options (file name and format). */
export function exportOptions(o: EditorOptions): ExportOptions {
  return { filename: o.filename.trim() || "export", format: o.format };
}
