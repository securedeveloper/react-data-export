// Turns a javascript-excel Workbook (a conformance corpus entry) into the
// input of react-data-export's public API: a WorkbookSpec of datasets plus
// ExportOptions. Whatever the API has no way to say is reported, not
// approximated, so the conformance test can check that everything else comes
// out exactly as javascript-excel writes it.
import { fromDataset, fromDatasets, mergeStyles, type CellInput, type ColumnProps, type Dataset, type LeafColumn, type Sheet, type Style, type Workbook, type WriteOptions } from 'javascript-excel';
import type { ExportOptions, SheetSpec, WorkbookSpec } from '../../src/index';

/** A model feature the React API cannot express, e.g. 'merges' or 'colProps.style'. */
export type Lost = string;

export interface Converted {
  spec: WorkbookSpec;
  options: ExportOptions;
  /** Features of the input the spec leaves out (sorted, unique). */
  lost: Lost[];
  /** The same, for the workbook itself and for each sheet. */
  workbookLost: Lost[];
  sheetLost: Lost[][];
}

type Row = Array<CellInput | undefined> | undefined;

/**
 * `width: 'auto'` is measured by fromDataset, which writes the measured width.
 * javascript-excel's writer, given 'auto', writes the same width and also
 * marks the column bestFit.
 */
export const AUTO: Lost = "colProps.width: 'auto' (bestFit)";

const isEmpty = (row: Row): boolean => !row || !row.some((c) => c !== undefined);

/** Defined, and a string or a plain cell object: usable as a column title. */
function isTitle(c: CellInput | undefined): boolean {
  if (typeof c === 'string') return true;
  return typeof c === 'object' && c !== null && !(c instanceof Date) && !('error' in c) && !('richText' in c) && typeof c.value === 'string';
}

/**
 * A column picked by `index`. A column style becomes the dataset column's
 * `style` (and `headerStyle`), which is how javascript-excel's writer applies
 * it to the column's cells: the column style, then the cell's own style.
 */
function leaf(index: number, colProps: ColumnProps | undefined, header?: { title: CellInput }): LeafColumn<Row> {
  const col: LeafColumn<Row> = { index };
  if (colProps?.width !== undefined) col.width = colProps.width;
  if (colProps?.hidden) col.hidden = true;
  if (colProps?.style) col.style = colProps.style;
  if (header) {
    col.title = header.title as LeafColumn<Row>['title'];
    if (colProps?.style) col.headerStyle = colProps.style;
  }
  return col;
}

/**
 * One sheet. Two shapes, both through fromDataset/fromDatasets:
 *
 * - **Header + freeze.** A sheet frozen below row 1 whose first row holds a
 *   title (text) in every column is a dataset with that row as its header
 *   (`headerStyle: {}`, so the titles keep exactly their own style) and
 *   `freezeHeader`.
 * - **Blocks.** Otherwise each run of non-empty rows becomes one headerless
 *   block (`header: false`, array rows picked by `index`), placed with
 *   `offset`. A sheet with one cell at XFD1048576 then needs no 16,384
 *   columns over every row.
 */
function sheetSpec(sheet: Sheet, lost: Set<Lost>): SheetSpec<Row> {
  const { name, rows, colProps, rowProps, view, autoFilter, ...rest } = sheet;
  for (const [k, v] of Object.entries(rest)) if (v !== undefined) lost.add(k);
  // A column style goes onto the column's cells (see leaf), but the column itself is lost.
  // Row styles are not used at all: `rowStyle` would also style the row's empty cells.
  colProps?.forEach((p) => {
    for (const [k, v] of Object.entries(p ?? {})) if (v !== undefined && k !== 'width' && k !== 'hidden') lost.add(`colProps.${k}`);
    if (p?.width === 'auto') lost.add(AUTO);
  });
  rowProps?.forEach((p) => {
    for (const [k, v] of Object.entries(p ?? {})) if (v !== undefined) lost.add(`rowProps.${k}`);
  });

  const { freeze, rightToLeft, ...viewRest } = view ?? {};
  for (const [k, v] of Object.entries(viewRest)) if (v !== undefined) lost.add(`view.${k}`);

  const width = rows.reduce((m, r) => Math.max(m, r?.length ?? 0), 0);
  const first = rows[0];
  const headerFreeze =
    freeze !== undefined && freeze.rows === 1 && !freeze.cols && first !== undefined && first.length === width && Array.from(first).every(isTitle);
  if (freeze !== undefined && !headerFreeze) lost.add('view.freeze');
  const common = { name, ...(rightToLeft ? { rightToLeft: true } : {}) };

  if (headerFreeze) {
    const columns = Array.from({ length: width }, (_, i) => leaf(i, colProps?.[i], { title: first[i] }));
    const data = rows.slice(1);
    const spec: SheetSpec<Row> = { ...common, columns, data, headerStyle: {}, freezeHeader: true };
    // fromDataset's filter covers the header row and the data rows.
    if (autoFilter !== undefined) {
      if (autoFilter === `A1:${columnName(width - 1)}${rows.length}`) spec.autoFilter = true;
      else lost.add('autoFilter');
    }
    return spec;
  }
  if (autoFilter !== undefined) lost.add('autoFilter');

  // Runs of non-empty rows, each with its first and last used column.
  const runs: Array<{ top: number; rows: Row[]; left: number; right: number }> = [];
  let run: (typeof runs)[number] | undefined;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (isEmpty(row)) {
      run = undefined;
      continue;
    }
    const used = (row as Array<CellInput | undefined>).flatMap((c, i) => (c === undefined ? [] : [i]));
    if (!run) runs.push((run = { top: r, rows: [], left: Infinity, right: -1 }));
    run.rows.push(row);
    run.left = Math.min(run.left, used[0]!);
    run.right = Math.max(run.right, used[used.length - 1]!);
  }
  // Column widths and hidden flags are properties of a block's columns, so the
  // first block spans every column that has one (extra columns stay empty).
  const propCols = (colProps ?? []).flatMap((p, c) => (p?.width !== undefined || p?.hidden ? [c] : []));
  if (runs[0] && propCols.length) {
    runs[0].left = Math.min(runs[0].left, propCols[0]!);
    runs[0].right = Math.max(runs[0].right, propCols[propCols.length - 1]!);
  }
  const placed = new Set<number>();
  let bottom = -1;
  const blocks = runs.map((b) => {
    const columns = Array.from({ length: b.right - b.left + 1 }, (_, i) => {
      const c = b.left + i;
      const props = placed.has(c) ? undefined : colProps?.[c];
      placed.add(c);
      return leaf(c, props);
    });
    const block: Dataset<Row> & { offset: { rows: number; cols: number } } = {
      columns,
      data: b.rows,
      offset: { rows: b.top - bottom - 1, cols: b.left },
    };
    bottom = b.top + b.rows.length - 1;
    return block;
  });
  colProps?.forEach((p, c) => {
    if (!placed.has(c) && (p?.width !== undefined || p?.hidden)) lost.add('colProps (column outside the data)');
  });
  if (blocks.length === 0) return { ...common, columns: [], data: [], header: false };
  return { ...common, blocks, header: false };
}

function columnName(c: number): string {
  let s = '';
  for (let n = c + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

/** The React API's input for `workbook`, written with `write`. */
export function toSpec(workbook: Workbook, write?: WriteOptions): Converted {
  const workbookLost = new Set<Lost>();
  const { sheets, activeSheet, properties, ...rest } = workbook;
  for (const [k, v] of Object.entries(rest)) if (v !== undefined) workbookLost.add(k);
  const sheetLost = sheets.map(() => new Set<Lost>());
  const spec: WorkbookSpec = { sheets: sheets.map((s, i) => sheetSpec(s, sheetLost[i]!)) };
  if (activeSheet !== undefined) spec.activeSheet = activeSheet;
  const options: ExportOptions = { download: false };
  if (properties !== undefined) options.properties = properties;
  if (write !== undefined) options.write = write;
  const lost = new Set([...workbookLost, ...sheetLost.flatMap((l) => [...l])]);
  return { spec, options, lost: [...lost].sort(), workbookLost: [...workbookLost], sheetLost: sheetLost.map((l) => [...l]) };
}

const isCell = (c: CellInput): c is Exclude<CellInput, null | undefined | string | number | boolean | Date> & { value?: unknown; style?: Style } =>
  typeof c === 'object' && c !== null && !(c instanceof Date) && !('error' in c) && !('richText' in c);

/**
 * The same workbook without the features in `lost`: what the React API's file
 * is compared with. A column style is not dropped from the cells: the writer
 * applies it to every cell of the column (before the cell's own style), and so
 * does the spec (see leaf), so here it moves onto the cells. Only the empty
 * cells lose it.
 */
export function withoutLost(workbook: Workbook, converted: Converted): Workbook {
  const wb: Record<string, unknown> = { ...workbook };
  for (const k of converted.workbookLost) delete wb[k];
  wb['sheets'] = workbook.sheets.map((s, i) => {
    const drop = new Set(converted.sheetLost[i]);
    const sheet: Record<string, unknown> = { ...s };
    if (drop.has(AUTO)) {
      // The width fromDataset measured for the spec's sheet.
      drop.delete(AUTO);
      const spec = converted.spec.sheets[i] as SheetSpec<Row>;
      const built = 'blocks' in spec ? fromDatasets(spec.blocks, spec) : fromDataset(spec, spec);
      sheet['colProps'] = s.colProps?.map((p, c) => (p?.width === 'auto' ? { ...p, width: built.colProps?.[c]?.width } : p));
    }
    for (const k of drop) if (!k.includes('.')) delete sheet[k];
    // A row style is dropped with the cells' share of it; a column style stays on the cells.
    if (drop.has('colProps.style')) {
      sheet['rows'] = s.rows.map((row) =>
        row?.map((c, col) => {
          if (c === undefined || c === null) return c;
          const style = mergeStyles(s.colProps?.[col]?.style, isCell(c) ? c.style : undefined);
          if (!Object.keys(style).length) return c;
          return isCell(c) ? { ...c, style } : { value: c, style };
        }),
      );
    }
    for (const list of ['colProps', 'rowProps'] as const) {
      const fields = [...drop].filter((k) => k.startsWith(`${list}.`)).map((k) => k.slice(list.length + 1));
      const current = sheet[list] as Array<object | undefined> | undefined;
      if (!fields.length || !current) continue;
      const kept = current.map((p) => {
        if (!p) return p;
        const q: Record<string, unknown> = { ...p };
        for (const f of fields) delete q[f];
        return Object.keys(q).length ? q : undefined;
      });
      sheet[list] = kept.some((p) => p !== undefined) ? kept : undefined;
    }
    const viewFields = [...drop].filter((k) => k.startsWith('view.')).map((k) => k.slice(5));
    if (viewFields.length && s.view) {
      const view: Record<string, unknown> = { ...s.view };
      for (const f of viewFields) delete view[f];
      sheet['view'] = Object.keys(view).length ? view : undefined;
    }
    return sheet;
  });
  return wb as unknown as Workbook;
}
