/// <reference types="node" />
// RDE-1.10: javascript-excel's conformance corpus (JSE-9) through
// react-data-export's public API.
//
// Every corpus workbook is turned into a WorkbookSpec (to-spec.ts) and
// exported with exportWorkbook. The result is compared with what
// javascript-excel writes for the same workbook:
//
// - when the API can express the whole workbook, the two files are
//   byte-identical;
// - otherwise the features it cannot express are exactly the ones listed in
//   expressible.ts (and docs/conformance.md), and once those are removed from
//   javascript-excel's file, both files read back (javascript-excel/read) to
//   the same model.
//
// Both files are also opened with openpyxl when it is installed (required in
// CI's Conformance job), as javascript-excel's own conformance test does.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cellText, dateToSerial, toUint8Array, type Cell, type CellInput, type Workbook } from 'javascript-excel';
import { toCsvBlob } from 'javascript-excel/csv';
import { read } from 'javascript-excel/read';
import { exportDataset, exportWorkbook, type SheetSpec } from '../../src/index';
import { renderConformanceDoc, NOT_EXPRESSIBLE } from './expressible';
import { ALL, type CorpusEntry } from './jse/corpus';
import { toSpec, withoutLost } from './to-spec';

const PY = process.env['RDE_PYTHON'] ?? 'python3';
const dump = join(process.cwd(), 'test', 'conformance', 'jse', 'xlsx_dump.py');
const hasOpenpyxl = spawnSync(PY, ['-I', '-c', 'import openpyxl'], { stdio: 'ignore' }).status === 0;
if (process.env['RDE_REQUIRE_OPENPYXL'] && !hasOpenpyxl) throw new Error(`openpyxl is required (python: ${PY})`);
const dir = mkdtempSync(join(tmpdir(), 'rde-conformance-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const bytesOf = async (blob: unknown): Promise<Uint8Array> => new Uint8Array(await (blob as Blob).arrayBuffer());

/**
 * Every non-empty cell as [sheet, ref, text], numbers and dates as serials
 * (as in javascript-excel's own conformance test: the number format decides
 * whether the reader returns a number or a Date).
 */
function texts(wb: Workbook): Array<[string, string, string]> {
  const out: Array<[string, string, string]> = [];
  const date1904 = wb.date1904 === true;
  const norm = (c: CellInput): string => {
    const v = c !== null && typeof c === 'object' && !(c instanceof Date) && !('error' in c) && !('richText' in c) ? (c as Cell).value : c;
    if (v instanceof Date) return `#${dateToSerial(v, { date1904 }).toFixed(6)}`;
    if (typeof v === 'number') return `#${v.toFixed(6)}`;
    return cellText(c);
  };
  for (const s of wb.sheets) {
    s.rows.forEach((row, r) =>
      row?.forEach((c, col) => {
        if (c === undefined || c === null) return;
        out.push([s.name, `${r}:${col}`, norm(c)]);
      }),
    );
  }
  return out;
}

interface Pair {
  /** The React API's file. */
  rde: Uint8Array;
  /** javascript-excel's file for the corpus workbook. */
  jse: Uint8Array;
  /** javascript-excel's file for the corpus workbook without the features the API cannot express. */
  reduced: Uint8Array;
}
const pairs = new Map<string, Promise<Pair>>();
function pair(entry: CorpusEntry): Promise<Pair> {
  let p = pairs.get(entry.id);
  if (!p) {
    p = (async () => {
      const converted = toSpec(entry.workbook(), entry.options);
      const { spec, options, lost } = converted;
      const result = await exportWorkbook(spec, options);
      const jse = await toUint8Array(entry.workbook(), entry.options);
      return { rde: await bytesOf(result.blob), jse, reduced: lost.length ? await toUint8Array(withoutLost(entry.workbook(), converted), entry.options) : jse };
    })();
    pairs.set(entry.id, p);
  }
  return p;
}

describe('the conformance corpus through react-data-export', () => {
  it('lists every corpus file in expressible.ts, and docs/conformance.md is up to date', () => {
    expect(Object.keys(NOT_EXPRESSIBLE).sort()).toEqual(ALL.map((e) => e.id).sort());
    const path = join(process.cwd(), '..', '..', 'docs', 'conformance.md');
    if (process.env['UPDATE_CONFORMANCE_DOC']) writeFileSync(path, renderConformanceDoc(ALL));
    expect(readFileSync(path, 'utf8')).toBe(renderConformanceDoc(ALL));
  });

  describe.each(ALL)('$id', (entry) => {
    const converted = toSpec(entry.workbook(), entry.options);
    const { lost } = converted;

    it('leaves out exactly the features listed as not expressible', () => {
      expect(lost).toEqual(NOT_EXPRESSIBLE[entry.id]);
    });

    it(lost.length === 0 ? 'is byte-identical to javascript-excel’s file' : 'is byte-identical to javascript-excel’s file for the workbook without those features', { timeout: 120_000 }, async () => {
      const { rde, reduced } = await pair(entry);
      expect(rde.length).toBe(reduced.length);
      expect(Buffer.from(rde).equals(Buffer.from(reduced))).toBe(true);
    });

    it('reads back with javascript-excel’s reader: no warnings, same sheets, values, merges and names', { timeout: 120_000 }, async () => {
      const { rde } = await pair(entry);
      const input = withoutLost(entry.workbook(), converted);
      const { workbook, warnings } = await read(rde);
      expect(warnings).toEqual([]);
      expect(workbook.sheets.map((s) => [s.name, s.state ?? 'visible'])).toEqual(input.sheets.map((s) => [s.name, s.state ?? 'visible']));
      expect(texts(workbook)).toEqual(texts(input));
      workbook.sheets.forEach((s, i) => expect(s.merges ?? [], s.name).toEqual(input.sheets[i]!.merges ?? []));
      expect((workbook.definedNames ?? []).map((d) => d.name).sort()).toEqual((input.definedNames ?? []).map((d) => d.name).sort());
    });

    it.skipIf(!hasOpenpyxl || entry.heavy === true)('opens in openpyxl with the same sheets and cell values as javascript-excel’s file', { timeout: 120_000 }, async () => {
      const { rde, jse, reduced } = await pair(entry);
      const load = (bytes: Uint8Array, name: string): { sheets: Array<{ title: string }>; cells: unknown } => {
        const file = join(dir, `${entry.id}-${name}.xlsx`);
        writeFileSync(file, bytes);
        // Values only: styles and sheet states may be among the features left out. (A value
        // openpyxl has no JSON form for is printed with its repr, which holds a memory address.)
        const text = execFileSync(PY, ['-I', dump, file, 'values'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
        return JSON.parse(text.replace(/ at 0x[0-9a-f]+>/g, '>')) as { sheets: Array<{ title: string }>; cells: unknown };
      };
      const got = load(rde, 'rde');
      // Values do not depend on the features left out, except a date's serial under the
      // 1904 date system, and the covered cells of a merge (openpyxl lists them, empty).
      const want = load(lost.includes('date1904') || lost.includes('merges') ? reduced : jse, 'jse');
      expect(got.sheets.map((s) => s.title)).toEqual(want.sheets.map((s) => s.title));
      expect(got.cells).toEqual(want.cells);
    });
  });

  // exportDataset (one sheet) and CSV: every single-sheet corpus file.
  const single = ALL.filter((e) => e.workbook().sheets.length === 1 && e.heavy !== true);
  describe.each(single)('$id as one dataset', (entry) => {
    it('exportDataset writes the same file as exportWorkbook', { timeout: 60_000 }, async () => {
      const { spec, options } = toSpec(entry.workbook(), entry.options);
      const sheet = spec.sheets[0] as SheetSpec<unknown>;
      if ('blocks' in sheet) return; // several blocks need exportWorkbook (fromDatasets)
      const { rde } = await pair(entry);
      const result = await exportDataset({ columns: sheet.columns, data: sheet.data }, { ...sheet, ...options });
      expect(Buffer.from(await bytesOf(result.blob)).equals(Buffer.from(rde))).toBe(true);
    });

    it('format: csv is what javascript-excel writes for the sheet', async () => {
      const { spec, options } = toSpec(entry.workbook(), entry.options);
      const result = await exportWorkbook(spec, { ...options, format: 'csv' });
      const want = toCsvBlob(entry.workbook().sheets[0]!) as Blob;
      expect(Buffer.from(await bytesOf(result.blob)).equals(Buffer.from(await bytesOf(want)))).toBe(true);
    });
  });
});
