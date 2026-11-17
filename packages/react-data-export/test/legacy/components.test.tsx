// <ExcelFile> behaviour: 0.6 markup and defaults, with the old bugs fixed.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { download } from 'javascript-excel/dom';
import { read } from 'javascript-excel/read';
import ReactExport, { ExcelColumn, ExcelFile, ExcelSheet, convertLegacyStyle } from '../../src/legacy';
import * as main from '../../src/index';

vi.mock('javascript-excel/dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('javascript-excel/dom')>()),
  download: vi.fn(),
}));
const downloadMock = vi.mocked(download);
let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  downloadMock.mockClear();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => warn.mockRestore());

const rows = [{ name: 'Ada', joined: new Date(2024, 0, 15) }];
// An element, not a component: like 0.x, <ExcelFile> reads its direct children's props.
const people = (
  <ExcelSheet data={rows} name="People">
    <ExcelColumn label="Name" value="name" />
    <ExcelColumn label="Joined" value="joined" />
  </ExcelSheet>
);

/** The file's bytes as text, keeping a BOM (Blob.text() strips it). */
async function rawText(blob: Blob): Promise<string> {
  return new TextDecoder('utf-8', { ignoreBOM: true }).decode(await blob.arrayBuffer());
}

async function downloaded(n = 0): Promise<{ blob: Blob; name: string }> {
  await waitFor(() => expect(downloadMock.mock.calls.length).toBeGreaterThan(n));
  const [blob, name] = downloadMock.mock.calls[n]!;
  return { blob: blob as Blob, name: name as string };
}

describe('the 0.x API shape', () => {
  it('default export and statics like 0.x', () => {
    expect(ReactExport.ExcelFile).toBe(ExcelFile);
    expect(ReactExport.ExcelFile.ExcelSheet).toBe(ExcelSheet);
    expect(ReactExport.ExcelFile.ExcelColumn).toBe(ExcelColumn);
  });

  it('is not part of the main entry', () => {
    expect('ExcelFile' in main).toBe(false);
    expect('convertLegacyStyle' in main).toBe(false);
  });
});

describe('<ExcelFile>', () => {
  it('renders <span> around <button>Download</button>, and a click downloads Download.xlsx', async () => {
    const { container } = render(
      <ExcelFile>
        {people}
      </ExcelFile>,
    );
    expect(container.innerHTML).toBe('<span><button>Download</button></span>');
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    const { name } = await downloaded();
    expect(name).toBe('Download.xlsx');
    expect(downloadMock).toHaveBeenCalledTimes(1);
  });

  it('wraps a custom element in the span', () => {
    const { container } = render(
      <ExcelFile element={<a href="#x">Get it</a>}>
        {people}
      </ExcelFile>,
    );
    expect(container.innerHTML).toBe('<span><a href="#x">Get it</a></span>');
  });

  it('hideElement renders nothing and downloads once on mount', async () => {
    const { container } = render(
      <ExcelFile hideElement filename="auto">
        {people}
      </ExcelFile>,
    );
    expect(container.innerHTML).toBe('');
    expect((await downloaded()).name).toBe('auto.xlsx');
  });

  it.each(['xlsx', 'csv'])('hideElement under StrictMode downloads exactly once (%s)', async (fileExtension) => {
    render(
      <StrictMode>
        <ExcelFile hideElement filename="strict" fileExtension={fileExtension}>
          {people}
        </ExcelFile>
      </StrictMode>,
    );
    expect((await downloaded()).name).toBe(`strict.${fileExtension}`);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(downloadMock).toHaveBeenCalledTimes(1);
  });

  it("fileExtension 'csv' writes real CSV", async () => {
    render(
      <ExcelFile hideElement filename="people" fileExtension="csv">
        <ExcelSheet data={[{ name: 'Ada', n: 1 }]} name="P">
          <ExcelColumn label="Name" value="name" />
          <ExcelColumn label="N" value="n" />
        </ExcelSheet>
      </ExcelFile>,
    );
    const { blob, name } = await downloaded();
    expect(name).toBe('people.csv');
    expect(await rawText(blob)).toBe('\uFEFFName,N\r\nAda,1\r\n');
  });

  it("CSV with several sheets writes the first one, with a dev warning", async () => {
    render(
      <ExcelFile hideElement filename="two" fileExtension="csv">
        <ExcelSheet data={[{ a: 'first' }]} name="A">
          <ExcelColumn label="A" value="a" />
        </ExcelSheet>
        <ExcelSheet data={[{ b: 'second' }]} name="B">
          <ExcelColumn label="B" value="b" />
        </ExcelSheet>
      </ExcelFile>,
    );
    expect(await rawText((await downloaded()).blob)).toBe('\uFEFFA\r\nfirst\r\n');
    expect(warn.mock.calls.some((c: unknown[]) => String(c[0]).includes('only the first of 2'))).toBe(true);
  });

  it.each(['xls', 'txt', 'html'])("fileExtension '%s' writes an .xlsx file with a dev warning", async (fileExtension) => {
    render(
      <ExcelFile hideElement filename={`old-${fileExtension}`} fileExtension={fileExtension}>
        {people}
      </ExcelFile>,
    );
    const { blob, name } = await downloaded();
    expect(name).toBe(`old-${fileExtension}.xlsx`);
    const { workbook } = await read(blob);
    expect(workbook.sheets[0]?.name).toBe('People');
    expect(warn.mock.calls.some((c: unknown[]) => String(c[0]).includes(`fileExtension "${fileExtension}"`))).toBe(true);
  });

  it('writes dates as UTC, like 0.x', async () => {
    const local = new Date(2024, 0, 15); // local midnight
    render(
      <ExcelFile hideElement>
        <ExcelSheet data={[{ d: local }]} name="D">
          <ExcelColumn label="D" value="d" />
        </ExcelSheet>
      </ExcelFile>,
    );
    const { workbook } = await read((await downloaded()).blob, { dates: 'serial' });
    const serial = (local.getTime() - Date.UTC(1899, 11, 30)) / 86_400_000; // 0.6's dateToNumber
    expect(workbook.sheets[0]?.rows[1]?.[0]?.value as number).toBeCloseTo(serial, 9);
  });

  it('skips falsy sheets and columns (conditional rendering)', async () => {
    const showSecret = false;
    render(
      <ExcelFile hideElement>
        {showSecret && <ExcelSheet data={rows} name="Secret" />}
        <ExcelSheet data={rows} name="Shown">
          <ExcelColumn label="Name" value="name" />
          {showSecret && <ExcelColumn label="Joined" value="joined" />}
        </ExcelSheet>
      </ExcelFile>,
    );
    const { workbook } = await read((await downloaded()).blob);
    expect(workbook.sheets.map((s) => s.name)).toEqual(['Shown']);
    expect(workbook.sheets[0]?.rows[0]?.map((c) => c?.value)).toEqual(['Name']);
  });

  it('writes an invalid sheet name sanitized, with a dev warning', async () => {
    render(
      <ExcelFile hideElement>
        <ExcelSheet data={rows} name="Q1/Q2">
          <ExcelColumn label="Name" value="name" />
        </ExcelSheet>
      </ExcelFile>,
    );
    const { workbook } = await read((await downloaded()).blob);
    expect(workbook.sheets[0]?.name).toBe('Q1_Q2');
    expect(warn.mock.calls.some((c: unknown[]) => String(c[0]).includes('"Q1/Q2"'))).toBe(true);
  });

  it('writes duplicate sheet names made unique, with a dev warning', async () => {
    const long = 'Faturas Aprovadas em 19_09_2018'; // 31 characters
    render(
      <ExcelFile hideElement>
        <ExcelSheet data={rows} name="test">
          <ExcelColumn label="Name" value="name" />
        </ExcelSheet>
        <ExcelSheet data={rows} name="test">
          <ExcelColumn label="Joined" value="joined" />
        </ExcelSheet>
        <ExcelSheet data={rows} name="TEST">
          <ExcelColumn label="Name" value="name" />
        </ExcelSheet>
        <ExcelSheet data={rows} name={long}>
          <ExcelColumn label="Name" value="name" />
        </ExcelSheet>
        <ExcelSheet data={rows} name={long}>
          <ExcelColumn label="Name" value="name" />
        </ExcelSheet>
      </ExcelFile>,
    );
    const { workbook } = await read((await downloaded()).blob);
    expect(workbook.sheets.map((s) => s.name)).toEqual([
      'test',
      'test (2)',
      'TEST (3)',
      long,
      'Faturas Aprovadas em 19_09_ (2)',
    ]);
    expect(workbook.sheets[1]?.rows[0]?.map((c) => c?.value)).toEqual(['Joined']);
    expect(warn.mock.calls.some((c: unknown[]) => String(c[0]).includes('written as "test (2)"'))).toBe(true);
  });

  it('makes names unique after sanitizing them', async () => {
    render(
      <ExcelFile hideElement>
        <ExcelSheet data={rows} name="Q1/Q2">
          <ExcelColumn label="Name" value="name" />
        </ExcelSheet>
        <ExcelSheet data={rows} name="Q1_Q2">
          <ExcelColumn label="Name" value="name" />
        </ExcelSheet>
      </ExcelFile>,
    );
    const { workbook } = await read((await downloaded()).blob);
    expect(workbook.sheets.map((s) => s.name)).toEqual(['Q1_Q2', 'Q1_Q2 (2)']);
  });

  it('a non-string filename is reported, nothing is downloaded', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ExcelFile filename={42 as never}>
        {people}
      </ExcelFile>,
    );
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(String(error.mock.calls[0]![0])).toMatch(/Invalid file name provided/);
    expect(downloadMock).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('warns once per page that the legacy API is deprecated, pointing to the migration guide', async () => {
    vi.resetModules();
    const fresh = await import('../../src/legacy');
    render(
      <>
        <fresh.ExcelFile>
          {people}
        </fresh.ExcelFile>
        <fresh.ExcelFile>
          {people}
        </fresh.ExcelFile>
      </>,
    );
    const deprecations = warn.mock.calls.filter((c: unknown[]) => String(c[0]).includes('deprecated'));
    expect(deprecations).toHaveLength(1);
    expect(String(deprecations[0]![0])).toContain('docs/migration.md');
    expect(String(deprecations[0]![0])).toContain('removed in 2.0');
  });
});

describe('convertLegacyStyle', () => {
  it('maps xlsx-style keys to javascript-excel styles', () => {
    expect(
      convertLegacyStyle({
        font: { sz: '14', bold: true, color: { rgb: 'FFFF0000' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF00' } },
        alignment: { horizontal: 'right', textRotation: 135, readingOrder: 2 },
        border: { top: { style: 'thin', color: { theme: '1', tint: '-0.25' } } },
        numFmt: '0.00%',
      }),
    ).toMatchObject({
      font: { size: 14, bold: true, color: { rgb: 'FFFF0000' } },
      fill: { pattern: 'solid', fgColor: { rgb: 'FFFFFF00' } },
      alignment: { horizontal: 'right', rotation: -45, readingOrder: 'rtl' },
      border: { top: { style: 'thin', color: { theme: 1, tint: -0.25 } } },
      numFmt: '0.00%',
    });
  });

  it("drops a 'none' fill and maps stacked text and auto colours", () => {
    const s = convertLegacyStyle({ fill: { patternType: 'none', fgColor: { rgb: 'FF000000' } }, alignment: { textRotation: 255 }, font: { color: { auto: 1 } } });
    expect(s.fill).toBeUndefined();
    expect(s.alignment?.rotation).toBe('vertical');
    expect(s.font?.color).toEqual({ auto: true });
  });
});
