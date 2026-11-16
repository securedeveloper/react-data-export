// Builds javascript-excel sheets from the 0.x shapes (<ExcelColumn> sheets and
// `dataSet` blocks), reproducing what react-data-export 0.6.0 wrote. The rules
// below were checked against the real 0.6.0 (test/legacy/goldens-0.6.json);
// the deliberate differences are marked FIX.
//
// No engine logic lives here: sheets come from javascript-excel's fromDataset /
// fromDatasets, and only 0.6's layout quirks (header styles, widths from
// column A) are expressed as options or a `colProps` array.
import { fromDataset, fromDatasets, type CellInput, type DatasetBlock, type ExcelWarning, type LeafColumn, type Sheet, type Style } from 'javascript-excel';
import { convertLegacyStyle, type LegacyStyle } from './style';

/** A 0.x cell value. */
export type ExcelValue = string | number | boolean | Date | null | undefined;
/** A 0.x styled cell. */
export interface ExcelCell {
  value: ExcelValue;
  style?: LegacyStyle | undefined;
}
export type ExcelCellData = ExcelValue | ExcelCell;
/** A 0.x `dataSet` column: a title string, or an object with title, width and header style. */
export type ExcelDataSetColumn =
  | string
  | { title?: string | undefined; width?: { wch: number } | { wpx: number } | undefined; style?: LegacyStyle | undefined };
/** One 0.x `dataSet` block. */
export interface ExcelSheetData {
  /** Columns to skip on the left. */
  xSteps?: number | undefined;
  /** Rows to skip before this block. */
  ySteps?: number | undefined;
  columns: ExcelDataSetColumn[];
  data: ExcelCellData[][];
}
/** A 0.x <ExcelColumn>: `value` is a property name (or index) of the row, or a function of the row. */
export interface LegacyColumnSpec {
  label: string;
  value: string | number | boolean | ((row: any) => unknown);
}

const BOLD: Style = { font: { bold: true } };

/**
 * 0.6 <ExcelColumn> values: `isNaN(v) ? (v || '') : v`, so undefined, NaN and
 * non-numeric falsy values become an empty text cell, null stays "no cell",
 * numeric strings stay text. Objects other than Dates were written as text.
 */
function columnValue(v: unknown): CellInput {
  if (v === null) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'number') return Number.isNaN(v) ? '' : v;
  if (typeof v === 'boolean' || typeof v === 'string') return v;
  if (v === undefined) return '';
  return String(v);
}

/** 0.6 `dataSet` cells: null is no cell, undefined an empty text cell, `{ value, style }` a styled cell. */
function dataSetCell(v: ExcelCellData): CellInput {
  if (v === null) return null;
  if (v === undefined) return '';
  if (v instanceof Date || typeof v !== 'object') return v;
  // FIX: 0.6 wrote a Date inside `{ value, style }` as text (it checked for a
  // Date before unwrapping); here it is a date like any other Date.
  const value = v.value === undefined ? '' : v.value;
  return v.style ? { value, style: convertLegacyStyle(v.style) } : { value };
}

/** A sheet from <ExcelSheet data> + <ExcelColumn> children: plain (not bold) headers, no widths. */
export function sheetFromColumns(
  name: string,
  rows: readonly unknown[],
  columns: LegacyColumnSpec[],
  onWarning: (w: ExcelWarning) => void,
): Sheet {
  return fromDataset(
    {
      columns: columns.map((c): LeafColumn<unknown> => {
        const get = typeof c.value === 'function' ? c.value : (row: any) => row?.[c.value as string];
        return { title: c.label, value: (row) => columnValue(get(row)) };
      }),
      data: rows,
    },
    { name, headerStyle: {}, onWarning },
  );
}

/** A sheet from a 0.x `dataSet`: blocks placed by xSteps/ySteps, bold headers, widths from column A. */
export function sheetFromDataSet(name: string, dataSet: ExcelSheetData[], onWarning: (w: ExcelWarning) => void): Sheet {
  let widths: Array<{ wch: number } | { wpx: number }> = [];
  const blocks = dataSet.map((block): DatasetBlock<ExcelCellData[]> => {
    const cols = block.columns ?? [];
    const rows = block.data ?? [];
    // 0.6 wrote every cell of every row, header or not; columns beyond the
    // headers get no header cell. An empty `columns` still took a header row.
    const count = Math.max(cols.length, ...rows.map((r) => r.length), 1);
    const blockWidths: Array<{ wch: number } | { wpx: number }> = [];
    const columns = Array.from({ length: count }, (_, i): LeafColumn<ExcelCellData[]> => {
      const col = cols[i];
      const value = (row: ExcelCellData[]): CellInput => (i < row.length ? dataSetCell(row[i]) : null);
      if (col === undefined) return { title: { value: null }, value };
      if (typeof col === 'string') {
        // FIX: 0.6.0 left string headers empty (a regression in its last
        // release; 0.5 and the 0.x README wrote the text). Written here.
        return { title: col, headerStyle: BOLD, value };
      }
      // Only object columns had a width in 0.6: theirs, or 80 px.
      blockWidths.push(col.width ?? { wpx: 80 });
      return {
        title: col.title ?? '',
        // 0.6: a column's style replaced the bold header.
        headerStyle: col.style ? convertLegacyStyle(col.style) : BOLD,
        value,
      };
    });
    // 0.6 assigned the widths per block, so the last block with object columns
    // won, and they started at column A whatever its xSteps.
    if (blockWidths.length > 0) widths = blockWidths;
    return {
      columns,
      data: rows,
      offset: { rows: typeof block.ySteps === 'number' ? block.ySteps : 0, cols: typeof block.xSteps === 'number' ? block.xSteps : 0 },
    };
  });
  const sheet = fromDatasets(blocks, { name, headerStyle: {}, gap: 0, onWarning });
  if (widths.length > 0) sheet.colProps = widths.map((width) => ({ width }));
  return sheet;
}
