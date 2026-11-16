// exportDataset / exportWorkbook (docs/api.md §4). Every step is a
// javascript-excel call: fromDataset/fromDatasets build, toBlob/toCsvBlob
// write, javascript-excel/dom's download saves. Nothing here touches a
// browser global at import time.
import {
  fromDataset,
  fromDatasets,
  toBlob,
  type BlobType,
  type Dataset,
  type DatasetBlock,
  type DatasetOptions,
  type DocProperties,
  type ExcelWarning,
  type Progress,
  type Sheet,
  type WriteOptions,
} from 'javascript-excel';
import { toCsvBlob, type CsvWriteOptions } from 'javascript-excel/csv';
import { download as saveFile } from 'javascript-excel/dom';

export type ExportFormat = 'xlsx' | 'csv';

export interface ExportOptions {
  /** File name. The extension for `format` is appended unless the name already ends with it. Default 'export'. */
  filename?: string | undefined;
  /** Default 'xlsx'. */
  format?: ExportFormat | undefined;
  /** Default true: start a browser download. false: only build the file and return it in the result. */
  download?: boolean | undefined;
  /** Passed to javascript-excel's toBlob (xlsx). */
  write?: Omit<WriteOptions, 'signal' | 'onProgress'> | undefined;
  /** Passed to javascript-excel's toCsvBlob (csv). */
  csv?: CsvWriteOptions | undefined;
  /** Workbook document properties; xlsx only. */
  properties?: DocProperties | undefined;
  signal?: AbortSignal | undefined;
  onProgress?: ((p: Progress) => void) | undefined;
}

export interface ExportResult {
  /** The file, as produced by toBlob / toCsvBlob (a Blob wherever DOM types exist). */
  blob: BlobType;
  /** The final file name, extension included. */
  filename: string;
  format: ExportFormat;
  /** Warnings collected from fromDataset/fromDatasets; also delivered to onWarning. */
  warnings: ExcelWarning[];
}

/** One sheet: a single dataset, or several stacked blocks (fromDatasets). */
export type SheetSpec<T> =
  | (Dataset<T> & DatasetOptions<T>)
  | ({ blocks: Array<DatasetBlock<any>>; gap?: number | undefined } & DatasetOptions<any>);

export interface WorkbookSpec {
  /** Falsy entries are skipped (conditional sheets). */
  sheets: Array<SheetSpec<any> | null | false | undefined>;
  /** Index into the remaining sheets. Default 0. */
  activeSheet?: number | undefined;
}

const EXPORT_KEYS = ['filename', 'format', 'download', 'write', 'csv', 'properties', 'signal', 'onProgress'] as const;

/** Splits ExportOptions from the DatasetOptions passed alongside them. */
function splitOptions<O extends object>(options: O): { exportOptions: ExportOptions; rest: Omit<O, (typeof EXPORT_KEYS)[number]> } {
  const exportOptions: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(options)) {
    if ((EXPORT_KEYS as readonly string[]).includes(k)) exportOptions[k] = v;
    else rest[k] = v;
  }
  return { exportOptions: exportOptions as ExportOptions, rest: rest as Omit<O, (typeof EXPORT_KEYS)[number]> };
}

function formatOf(options: ExportOptions): ExportFormat {
  const format = options.format ?? 'xlsx';
  if (format !== 'xlsx' && format !== 'csv') {
    throw new TypeError(`react-data-export: unknown format ${JSON.stringify(format)}; expected 'xlsx' or 'csv'`);
  }
  return format;
}

/** `filename` plus the format's extension, unless it already ends with it. */
export function resolveFilename(filename: string | undefined, format: ExportFormat): string {
  const ext = `.${format}`;
  const base = (filename ?? '').trim() || 'export';
  return base.toLowerCase().endsWith(ext) ? base : `${base}${ext}`;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException('This operation was aborted', 'AbortError');
  }
}

/** Wraps onWarning so every warning is also collected for the result. */
function collecting(
  warnings: ExcelWarning[],
  onWarning: ((w: ExcelWarning) => void) | undefined,
): (w: ExcelWarning) => void {
  return (w) => {
    warnings.push(w);
    onWarning?.(w);
  };
}

async function writeAndSave(
  sheets: Sheet[],
  activeSheet: number | undefined,
  warnings: ExcelWarning[],
  options: ExportOptions,
  format: ExportFormat,
): Promise<ExportResult> {
  const { signal } = options;
  throwIfAborted(signal);
  let blob: BlobType;
  if (format === 'csv') {
    blob = toCsvBlob(sheets[0] as Sheet, options.csv);
  } else {
    blob = await toBlob(
      { sheets, activeSheet, properties: options.properties },
      { ...options.write, signal, onProgress: options.onProgress },
    );
  }
  throwIfAborted(signal);
  const filename = resolveFilename(options.filename, format);
  if (options.download !== false) saveFile(blob, filename);
  return { blob, filename, format, warnings };
}

/** Builds one sheet from a dataset and exports it as .xlsx or .csv. */
export async function exportDataset<T>(
  dataset: Dataset<T>,
  options: ExportOptions & DatasetOptions<T> = {},
): Promise<ExportResult> {
  const { exportOptions, rest } = splitOptions(options);
  const format = formatOf(exportOptions);
  throwIfAborted(exportOptions.signal);
  const warnings: ExcelWarning[] = [];
  const sheet = fromDataset(dataset, { ...rest, onWarning: collecting(warnings, rest.onWarning) });
  return writeAndSave([sheet], undefined, warnings, exportOptions, format);
}

/** Builds every sheet of `spec` (falsy entries skipped) and exports the workbook. */
export async function exportWorkbook(spec: WorkbookSpec, options: ExportOptions = {}): Promise<ExportResult> {
  const format = formatOf(options);
  const specs = spec.sheets.filter((s): s is SheetSpec<any> => Boolean(s));
  if (format === 'csv' && specs.length !== 1) {
    throw new TypeError(`react-data-export: a CSV file holds one sheet; this workbook has ${specs.length}`);
  }
  throwIfAborted(options.signal);
  const warnings: ExcelWarning[] = [];
  const sheets = specs.map((s) => {
    if ('blocks' in s) {
      const { blocks, ...sheetOptions } = s;
      return fromDatasets(blocks, { ...sheetOptions, onWarning: collecting(warnings, sheetOptions.onWarning) });
    }
    const { columns, data, ...sheetOptions } = s;
    return fromDataset({ columns, data }, { ...sheetOptions, onWarning: collecting(warnings, sheetOptions.onWarning) });
  });
  return writeAndSave(sheets, spec.activeSheet, warnings, options, format);
}
