// The 0.x components (<ExcelFile>, <ExcelSheet>, <ExcelColumn>) on top of the
// 1.0 export path: same props, defaults and markup as react-data-export 0.6.0,
// written by javascript-excel through the shared write/download code.
import {
  Children,
  createElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { sanitizeSheetName, type ExcelWarning, type Sheet } from 'javascript-excel';
import { startExport, writeAndSave, type ExportFormat, type ExportOptions, type ExportResult } from '../export';
import { runForTrigger } from '../excel-export';
import { useExportRunner } from '../use-excel-export';
import { sheetFromColumns, sheetFromDataSet, type ExcelSheetData, type LegacyColumnSpec } from './build';

export interface ExcelFileProps {
  /** File name without the extension; the extension is always appended (0.x). Default "Download". */
  filename?: string | undefined;
  /** 'xlsx' (default) or 'csv'. 'xls', 'txt' and 'html' write an .xlsx file. '' takes it from the filename. */
  fileExtension?: string | undefined;
  /** The trigger, wrapped in a <span> that handles the click. Default <button>Download</button>. */
  element?: ReactNode;
  /** Download once when mounted and render nothing. */
  hideElement?: boolean | undefined;
  /** <ExcelSheet> elements. Falsy children are skipped. */
  children?: ReactNode;
}

export interface ExcelSheetProps {
  name: string;
  /** Rows for the <ExcelColumn> children, or a function returning them. */
  data?: readonly object[] | (() => readonly object[]) | undefined;
  /** Blocks of `{ columns, data, xSteps?, ySteps? }`; used instead of `data` when not empty. */
  dataSet?: ExcelSheetData[] | undefined;
  /** <ExcelColumn> elements. Falsy children are skipped. */
  children?: ReactNode;
}

export interface ExcelColumnProps {
  label: string;
  /** A property name (or index) of each row, or a function of the row. */
  value: LegacyColumnSpec['value'];
}

/** Declares a sheet inside <ExcelFile>. Renders nothing. */
export function ExcelSheet(_props: ExcelSheetProps): null {
  return null;
}

/** Declares a column inside <ExcelSheet>. Renders nothing. */
export function ExcelColumn(_props: ExcelColumnProps): null {
  return null;
}

const EXTENSIONS = ['xlsx', 'xls', 'csv', 'txt', 'html'];
const MIGRATION = 'https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md';

function isDev(): boolean {
  return typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production';
}

const warned = new Set<string>();
function warnOnce(key: string, message: string): void {
  if (!isDev() || warned.has(key)) return;
  warned.add(key);
  console.warn(`react-data-export/legacy: ${message}`);
}

/** 0.6: fileExtension if known; '' takes the last part of the filename; anything else is xlsx. */
function legacyExtension(filename: string, fileExtension: string | undefined): string {
  let ext = fileExtension ?? 'xlsx';
  if (ext.length === 0) ext = filename.split('.').pop() ?? '';
  return EXTENSIONS.includes(ext) ? ext : 'xlsx';
}

function propsOf<P>(node: ReactNode): P[] {
  return Children.toArray(node)
    .filter((child): child is ReactElement<P> => isValidElement(child))
    .map((child) => child.props);
}

function buildSheets(children: ReactNode, onWarning: (w: ExcelWarning) => void): Sheet[] {
  return propsOf<ExcelSheetProps>(children).map((sheet) => {
    const name = sanitizeSheetName(String(sheet.name ?? ''));
    if (name !== sheet.name) {
      warnOnce(`name:${String(sheet.name)}`, `sheet name ${JSON.stringify(sheet.name)} is not valid in Excel; written as ${JSON.stringify(name)}.`);
    }
    if (sheet.dataSet && sheet.dataSet.length > 0) return sheetFromDataSet(name, sheet.dataSet, onWarning);
    const rows = typeof sheet.data === 'function' ? sheet.data() : (sheet.data ?? []);
    const columns = propsOf<ExcelColumnProps>(sheet.children).map((c) => ({ label: c.label, value: c.value }));
    return sheetFromColumns(name, rows, columns, onWarning);
  });
}

/** Internal: one 0.x export, through the 1.0 write and download path. */
export async function exportLegacy(props: ExcelFileProps, options: ExportOptions): Promise<ExportResult> {
  const filename = props.filename === undefined ? 'Download' : props.filename;
  if (typeof filename !== 'string') throw new Error('Invalid file name provided');
  const ext = legacyExtension(filename, props.fileExtension);
  const format: ExportFormat = ext === 'csv' ? 'csv' : 'xlsx';
  if (ext !== format) {
    warnOnce(`ext:${ext}`, `fileExtension "${ext}" is written as an .xlsx file named ${filename}.xlsx (0.x wrote xlsx content under a .${ext} name).`);
  }
  await startExport(options.signal);
  const warnings: ExcelWarning[] = [];
  const sheets = buildSheets(props.children, (w) => warnings.push(w));
  if (format === 'csv' && sheets.length > 1) {
    warnOnce('csv-sheets', `a CSV file holds one sheet; only the first of ${sheets.length} is written.`);
  }
  return writeAndSave(
    sheets,
    undefined,
    warnings,
    {
      ...options,
      // 0.x always appended the extension ("report.xlsx" -> "report.xlsx.xlsx").
      filename: `${filename}.${format}`,
      // 0.x converted dates as UTC.
      write: { ...options.write, dateZone: 'utc' },
      csv: { ...options.csv, dateZone: 'utc' },
    },
    format,
  );
}

function ExcelFileImpl(props: ExcelFileProps): ReactElement | null {
  const { run } = useExportRunner();
  const latest = useRef(props);
  latest.current = props;

  const download = useCallback((): void => {
    void runForTrigger(() => run((options) => exportLegacy(latest.current, options), undefined), undefined, undefined);
  }, [run]);

  useEffect(() => {
    warnOnce(
      'deprecated',
      `<ExcelFile>, <ExcelSheet> and <ExcelColumn> are deprecated. They are supported for all of 1.x and removed in 2.0. Move to the 1.0 API with the migration guide: ${MIGRATION}`,
    );
    // 0.x downloaded in the constructor (twice under StrictMode). Here it runs
    // after mount, and StrictMode's simulated unmount aborts the first run.
    if (latest.current.hideElement) download();
  }, [download]);

  if (props.hideElement) return null;
  const element = props.element === undefined ? createElement('button', null, 'Download') : props.element;
  return createElement('span', { onClick: download }, element);
}

export interface ExcelFileComponent {
  (props: ExcelFileProps): ReactElement | null;
  displayName?: string;
  /** 0.x: `ReactExport.ExcelFile.ExcelSheet`. */
  ExcelSheet: typeof ExcelSheet;
  /** 0.x: `ReactExport.ExcelFile.ExcelColumn`. */
  ExcelColumn: typeof ExcelColumn;
}

/** The 0.x <ExcelFile>: deprecated, supported for all of 1.x. */
export const ExcelFile: ExcelFileComponent = Object.assign(ExcelFileImpl, { ExcelSheet, ExcelColumn, displayName: 'ExcelFile' });
