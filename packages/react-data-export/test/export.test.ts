// exportDataset / exportWorkbook against the real javascript-excel builders
// and writer; only the browser download is mocked. Files are read back with
// javascript-excel/read.
import { isExcelError, type ExcelWarning, type Progress } from 'javascript-excel';
import { download } from 'javascript-excel/dom';
import { read } from 'javascript-excel/read';
import { exportDataset, exportWorkbook, resolveFilename } from '../src/export';

vi.mock('javascript-excel/dom', () => ({ download: vi.fn() }));
const downloadMock = vi.mocked(download);

beforeEach(() => downloadMock.mockClear());

const people = {
  columns: [
    { title: 'Name', key: 'name' },
    { title: 'Age', key: 'age', type: 'number' as const },
  ],
  data: [
    { name: 'Ada', age: 36 },
    { name: 'Alan', age: 41 },
  ],
};

async function values(blob: unknown, sheet = 0): Promise<unknown[][]> {
  const { workbook } = await read(blob as Blob);
  // rows is sparse (a hole is an empty row); Array.from turns holes into [].
  return Array.from(workbook.sheets[sheet]?.rows ?? [], (r) => Array.from(r ?? [], (c) => c?.value));
}

describe('exportDataset', () => {
  it('builds an xlsx with fromDataset, downloads it, and resolves with the result', async () => {
    const result = await exportDataset(people);
    expect(result.filename).toBe('export.xlsx');
    expect(result.format).toBe('xlsx');
    expect(result.warnings).toEqual([]);
    expect(downloadMock).toHaveBeenCalledTimes(1);
    expect(downloadMock).toHaveBeenCalledWith(result.blob, 'export.xlsx');
    expect(await values(result.blob)).toEqual([
      ['Name', 'Age'],
      ['Ada', 36],
      ['Alan', 41],
    ]);
  });

  it('passes DatasetOptions through to fromDataset (sheet name)', async () => {
    const { blob } = await exportDataset(people, { name: 'People', download: false });
    const { workbook } = await read(blob as Blob);
    expect(workbook.sheets[0]?.name).toBe('People');
  });

  it('download: false builds the file without downloading', async () => {
    const result = await exportDataset(people, { download: false });
    expect(downloadMock).not.toHaveBeenCalled();
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('csv: toCsvBlob, .csv name, BOM by default', async () => {
    const result = await exportDataset(people, { format: 'csv', filename: 'people' });
    expect(result.filename).toBe('people.csv');
    expect(downloadMock).toHaveBeenCalledWith(result.blob, 'people.csv');
    const bytes = new Uint8Array(await (result.blob as Blob).arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('Name,Age\r\nAda,36\r\nAlan,41\r\n');
  });

  it('csv options are passed to toCsvBlob', async () => {
    const result = await exportDataset(people, { format: 'csv', download: false, csv: { delimiter: ';', bom: false } });
    expect(await (result.blob as Blob).text()).toBe('Name;Age\r\nAda;36\r\nAlan;41\r\n');
  });

  it('collects warnings and still calls onWarning', async () => {
    const seen: ExcelWarning[] = [];
    const result = await exportDataset(
      { columns: [{ title: 'N', key: 'n', type: 'number' }], data: [{ n: 'abc' }] },
      { download: false, onWarning: (w) => seen.push(w) },
    );
    expect(result.warnings.map((w) => w.code)).toEqual(['COERCION_FAILED']);
    expect(seen).toEqual(result.warnings);
  });

  it('reports progress from the writer', async () => {
    const ratios: number[] = [];
    await exportDataset(people, { download: false, onProgress: (p: Progress) => ratios.push(p.ratio) });
    expect(ratios.length).toBeGreaterThan(0);
    expect(ratios[ratios.length - 1]).toBe(1);
  });

  it('writes document properties', async () => {
    const { blob } = await exportDataset(people, { download: false, properties: { title: 'Staff' } });
    const { workbook } = await read(blob as Blob);
    expect(workbook.properties?.title).toBe('Staff');
  });

  it('rejects with javascript-excel errors unchanged (invalid sheet name)', async () => {
    const err = await exportDataset(people, { name: 'a/b' }).catch((e: unknown) => e);
    expect(isExcelError(err)).toBe(true);
    expect((err as { code: string }).code).toBe('INVALID_SHEET_NAME');
    expect(downloadMock).not.toHaveBeenCalled();
  });

  it('rejects an unknown format with a TypeError', async () => {
    await expect(exportDataset(people, { format: 'xls' as never })).rejects.toThrow(TypeError);
  });
});

describe('abort', () => {
  it('an already aborted signal rejects before building', async () => {
    const value = vi.fn((r: { name: string }) => r.name);
    const controller = new AbortController();
    controller.abort();
    const err = await exportDataset({ columns: [{ title: 'N', value }], data: [{ name: 'x' }] }, { signal: controller.signal }).catch((e: unknown) => e);
    expect((err as Error).name).toBe('AbortError');
    expect(value).not.toHaveBeenCalled();
    expect(downloadMock).not.toHaveBeenCalled();
  });

  it('aborting while the file is written rejects with the reason and does not download', async () => {
    const controller = new AbortController();
    const pending = exportDataset(people, { signal: controller.signal });
    controller.abort(new Error('stop'));
    await expect(pending).rejects.toThrow('stop');
    expect(downloadMock).not.toHaveBeenCalled();
  });
});

describe('exportWorkbook', () => {
  it('skips falsy sheets and honours activeSheet among the remaining ones', async () => {
    const showSecret = false;
    const { blob } = await exportWorkbook(
      {
        sheets: [{ ...people, name: 'People' }, showSecret && { ...people, name: 'Secret' }, null, { ...people, name: 'Copy' }],
        activeSheet: 1,
      },
      { download: false },
    );
    const { workbook } = await read(blob as Blob);
    expect(workbook.sheets.map((s) => s.name)).toEqual(['People', 'Copy']);
    expect(workbook.activeSheet).toBe(1);
  });

  it('a sheet with blocks is built with fromDatasets (gap rows between blocks)', async () => {
    const { blob } = await exportWorkbook(
      { sheets: [{ name: 'Both', blocks: [people, { columns: [{ title: 'Total' }], data: [[77]] }], gap: 1 }] },
      { download: false },
    );
    expect(await values(blob)).toEqual([['Name', 'Age'], ['Ada', 36], ['Alan', 41], [], ['Total'], [77]]);
  });

  it('collects warnings from every sheet', async () => {
    const bad = { columns: [{ title: 'N', key: 'n', type: 'number' as const }], data: [{ n: 'x' }] };
    const result = await exportWorkbook({ sheets: [{ ...bad, name: 'A' }, { ...bad, name: 'B' }] }, { download: false });
    expect(result.warnings).toHaveLength(2);
  });

  it('csv with more than one sheet rejects with a TypeError before building', async () => {
    const value = vi.fn(() => 1);
    const sheet = { columns: [{ title: 'N', value }], data: [{}] };
    const err = await exportWorkbook({ sheets: [sheet, sheet] }, { format: 'csv' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TypeError);
    expect((err as Error).message).toMatch(/one sheet; this workbook has 2/);
    expect(value).not.toHaveBeenCalled();
  });

  it('csv with exactly one remaining sheet works', async () => {
    const result = await exportWorkbook({ sheets: [null, people] }, { format: 'csv', download: false, csv: { bom: false } });
    expect(await (result.blob as Blob).text()).toBe('Name,Age\r\nAda,36\r\nAlan,41\r\n');
  });
});

describe('resolveFilename', () => {
  it.each([
    [undefined, 'xlsx', 'export.xlsx'],
    ['  ', 'xlsx', 'export.xlsx'],
    ['report', 'xlsx', 'report.xlsx'],
    ['report.xlsx', 'xlsx', 'report.xlsx'],
    ['REPORT.XLSX', 'xlsx', 'REPORT.XLSX'],
    ['report.csv', 'xlsx', 'report.csv.xlsx'],
    ['data', 'csv', 'data.csv'],
  ] as const)('%j as %s -> %s', (name, format, expected) => {
    expect(resolveFilename(name, format)).toBe(expected);
  });
});
