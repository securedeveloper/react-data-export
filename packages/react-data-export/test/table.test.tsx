// Table export (docs/api.md §13) with real tables in jsdom. The real
// javascript-excel fromTable and writer run; only the browser download is
// mocked. Files are read back with javascript-excel/read.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import { download } from 'javascript-excel/dom';
import { read } from 'javascript-excel/read';
import { ExportTableButton, exportTable, useTableExport, type ExportResult, type UseTableExport } from '../src/index';

vi.mock('javascript-excel/dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('javascript-excel/dom')>()),
  download: vi.fn(),
}));
const downloadMock = vi.mocked(download);
beforeEach(() => downloadMock.mockClear());

const TABLE_HTML = `
  <thead>
    <tr><th rowspan="2">Name</th><th colspan="2">Q1</th></tr>
    <tr><th>Jan</th><th>Feb</th></tr>
  </thead>
  <tbody>
    <tr><td>Ada</td><td data-type="number">1</td><td data-type="number">2</td></tr>
    <tr hidden><td>Hidden</td><td>0</td><td>0</td></tr>
    <tr data-export-ignore><td>Ignored</td><td>0</td><td>0</td></tr>
    <tr><td><a href="https://example.com/alan">Alan</a></td><td data-type="number">3</td><td data-type="number">4</td></tr>
  </tbody>`;

function makeTable(html = TABLE_HTML): HTMLTableElement {
  const table = document.createElement('table');
  table.innerHTML = html;
  document.body.appendChild(table);
  return table;
}

afterEach(() => {
  document.body.innerHTML = '';
});

async function sheetOf(blob: unknown) {
  const { workbook } = await read(blob as Blob);
  return workbook.sheets[0]!;
}

function values(rows: unknown): unknown[][] {
  return Array.from((rows ?? []) as ArrayLike<ArrayLike<{ value?: unknown } | undefined> | undefined>, (r) =>
    Array.from(r ?? [], (c) => c?.value),
  );
}

describe('exportTable', () => {
  it('colspan/rowspan become merges; hidden and ignored rows are skipped; values, headers and links round-trip', async () => {
    const result = await exportTable(makeTable());
    expect(result.filename).toBe('export.xlsx');
    expect(downloadMock).toHaveBeenCalledWith(result.blob, 'export.xlsx');
    const sheet = await sheetOf(result.blob);
    expect([...(sheet.merges ?? [])].sort()).toEqual(['A1:A2', 'B1:C1']);
    expect(values(sheet.rows)).toEqual([
      ['Name', 'Q1'], // C1 is covered by the B1:C1 merge and not written (sparse rows)
      [undefined, 'Jan', 'Feb'],
      ['Ada', 1, 2],
      ['Alan', 3, 4],
    ]);
    expect(sheet.rows?.[0]?.[0]?.style?.font?.bold).toBe(true); // <thead> rows are headers
    expect(sheet.rows?.[3]?.[0]?.hyperlink).toMatchObject({ target: 'https://example.com/alan' });
  });

  it('accepts a ref and reads ref.current when called', async () => {
    const ref = { current: makeTable() };
    const result = await exportTable(ref, { download: false });
    expect((await sheetOf(result.blob)).merges).toHaveLength(2);
  });

  it('an empty ref rejects with a TypeError before building', async () => {
    const err = await exportTable({ current: null }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TypeError);
    expect((err as Error).message).toMatch(/no table to export/);
    expect(downloadMock).not.toHaveBeenCalled();
  });

  it('passes fromTable options through unchanged (name, freezeHeader, ignore, cell)', async () => {
    const cell = vi.fn((el: Element) => (el.textContent === 'Ada' ? 'ADA' : undefined));
    const result = await exportTable(makeTable(), {
      download: false,
      name: 'Orders',
      freezeHeader: true,
      ignore: 'tr:nth-child(4)', // the Alan row; overrides the default [data-export-ignore]
      cell,
    });
    const sheet = await sheetOf(result.blob);
    expect(sheet.name).toBe('Orders');
    expect(sheet.view?.freeze).toMatchObject({ rows: 2 });
    expect(cell).toHaveBeenCalled();
    const rows = values(sheet.rows);
    expect(rows[2]).toEqual(['ADA', 1, 2]);
    expect(rows.some((r) => r[0] === 'Alan')).toBe(false);
    expect(rows.some((r) => r[0] === 'Ignored')).toBe(true); // default ignore selector replaced
  });

  it('csv: values only, merges dropped', async () => {
    const result = await exportTable(makeTable(), { format: 'csv', download: false, csv: { bom: false }, filename: 'orders' });
    expect(result.filename).toBe('orders.csv');
    expect(await (result.blob as Blob).text()).toBe('Name,Q1,\r\n,Jan,Feb\r\nAda,1,2\r\nAlan,3,4\r\n');
  });

  it('collects fromTable warnings into the result and still calls onWarning', async () => {
    const seen: unknown[] = [];
    const table = makeTable('<tbody><tr><td><a href="javascript:alert(1)">x</a></td></tr></tbody>');
    const result = await exportTable(table, { download: false, onWarning: (w) => seen.push(w) });
    expect(result.warnings.map((w) => w.code)).toEqual(['HYPERLINK_DROPPED']);
    expect(seen).toEqual(result.warnings);
  });

  it('an aborted signal rejects before building', async () => {
    const cell = vi.fn(() => undefined);
    const controller = new AbortController();
    controller.abort();
    const err = await exportTable(makeTable(), { signal: controller.signal, cell }).catch((e: unknown) => e);
    expect((err as Error).name).toBe('AbortError');
    expect(cell).not.toHaveBeenCalled();
  });

  it('javascript-excel errors pass through (invalid sheet name)', async () => {
    const err = await exportTable(makeTable(), { name: 'a/b' }).catch((e: unknown) => e);
    expect((err as { code: string }).code).toBe('INVALID_SHEET_NAME');
  });
});

/** A page with a table and the hook; the table can be toggled off. */
function HookPage({ api, initiallyShown = true }: { api: { current: UseTableExport | null }; initiallyShown?: boolean }) {
  const ref = useRef<HTMLTableElement>(null);
  const [shown, setShown] = useState(initiallyShown);
  const hook = useTableExport(ref, { filename: 'orders' });
  api.current = hook;
  return (
    <div>
      {shown && <table ref={ref} dangerouslySetInnerHTML={{ __html: TABLE_HTML }} />}
      <button onClick={() => setShown((s) => !s)}>toggle</button>
      <output data-testid="state">
        {hook.status}|{hook.result ? hook.result.filename : '-'}|{hook.error instanceof TypeError ? 'TypeError' : '-'}
      </output>
    </div>
  );
}

describe('useTableExport', () => {
  it('exports the table behind the ref, with defaults, and reports status', async () => {
    const api: { current: UseTableExport | null } = { current: null };
    render(<HookPage api={api} />);
    let result!: ExportResult;
    await act(async () => {
      result = await api.current!.exportTable({ freezeHeader: true });
    });
    expect(result.filename).toBe('orders.xlsx');
    expect(screen.getByTestId('state').textContent).toBe('done|orders.xlsx|-');
    expect((await sheetOf(result.blob)).merges).toHaveLength(2);
  });

  it('reads ref.current when the export starts (table mounted later)', async () => {
    const api: { current: UseTableExport | null } = { current: null };
    render(<HookPage api={api} initiallyShown={false} />);
    await act(async () => {
      await api.current!.exportTable().catch(() => undefined);
    });
    expect(screen.getByTestId('state').textContent).toBe('error|-|TypeError');
    fireEvent.click(screen.getByText('toggle'));
    await act(async () => {
      await api.current!.exportTable();
    });
    expect(screen.getByTestId('state').textContent).toBe('done|orders.xlsx|-');
  });

  it('keeps a stable exportTable identity', () => {
    const api: { current: UseTableExport | null } = { current: null };
    const { rerender } = render(<HookPage api={api} />);
    const first = api.current!.exportTable;
    rerender(<HookPage api={api} />);
    expect(api.current!.exportTable).toBe(first);
  });

  it('unmounting aborts a running export', async () => {
    const api: { current: UseTableExport | null } = { current: null };
    const { unmount } = render(<HookPage api={api} />);
    let pending!: Promise<ExportResult>;
    act(() => {
      pending = api.current!.exportTable();
    });
    unmount();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(downloadMock).not.toHaveBeenCalled();
  });
});

function ButtonPage(props: { onExported?: (r: ExportResult) => void; onError?: (e: unknown) => void; label?: string }) {
  const ref = useRef<HTMLTableElement>(null);
  return (
    <div>
      <table ref={ref} dangerouslySetInnerHTML={{ __html: TABLE_HTML }} />
      <ExportTableButton tableRef={ref} filename="orders" autoWidth onExported={props.onExported} onError={props.onError}>
        {props.label}
      </ExportTableButton>
    </div>
  );
}

describe('<ExportTableButton>', () => {
  it('renders a default "Export" button that exports the table', async () => {
    const onExported = vi.fn();
    render(<ButtonPage onExported={onExported} />);
    const button = screen.getByRole('button', { name: 'Export' });
    fireEvent.click(button);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await waitFor(() => expect(onExported).toHaveBeenCalledTimes(1));
    expect((onExported.mock.calls[0]![0] as ExportResult).filename).toBe('orders.xlsx');
    expect(downloadMock).toHaveBeenCalledTimes(1);
  });

  it('uses a string child as the label', () => {
    render(<ButtonPage label="Export orders" />);
    expect(screen.getByRole('button', { name: 'Export orders' })).toBeTruthy();
  });

  it('render prop: run() never rejects; an empty ref goes to onError', async () => {
    const onError = vi.fn();
    let run!: () => Promise<ExportResult | undefined>;
    render(
      <ExportTableButton tableRef={{ current: null }} onError={onError}>
        {(api) => {
          run = api.run;
          return <span>{api.status}</span>;
        }}
      </ExportTableButton>,
    );
    let result: ExportResult | undefined = { filename: 'x' } as ExportResult;
    await act(async () => {
      result = await run();
    });
    expect(result).toBeUndefined();
    expect(onError.mock.calls[0]![0]).toBeInstanceOf(TypeError);
  });
});
