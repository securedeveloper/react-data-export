// RDE-1.10: the corpus files javascript-excel builds with its dataset and
// table builders, through every react-data-export entry point: the export
// functions, the hooks and the components. Each one is byte-identical to
// javascript-excel's builder + toUint8Array for the same input.
//
// Only APIs that exist in Testing Library 12 (React 17) are used.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { fromDataset, fromDatasets, toUint8Array, type Dataset, type DatasetBlock, type DatasetOptions, type Style } from 'javascript-excel';
import { fromTable, type FromTableOptions } from 'javascript-excel/dom';
import {
  ExcelExport,
  ExportTableButton,
  exportDataset,
  exportTable,
  exportWorkbook,
  useExcelExport,
  useTableExport,
  type ExportResult,
  type UseExcelExport,
  type UseTableExport,
  type WorkbookSpec,
} from '../../src/index';
import { ALL } from './jse/corpus';

const bytesOf = async (blob: unknown): Promise<Buffer> => Buffer.from(await (blob as Blob).arrayBuffer());

// ------------------------------------------------- 19-builders (fromDataset, fromDatasets)

// The input of the corpus file's Dataset and Stacked sheets, as in
// javascript-excel's corpus.ts. The first test checks that it still builds
// exactly those sheets, so a change to the corpus cannot go unnoticed.
interface Person {
  name: string;
  team: string;
  joined: string;
  sales: { q1: number; q2: number };
}
const HEAD: Style = { font: { bold: true }, fill: 'D9E1F2', border: { bottom: { style: 'thin' } } };
const people: Person[] = [
  { name: 'Ada', team: 'Core', joined: '2024-01-15', sales: { q1: 1200.5, q2: 980 } },
  { name: 'Grace 漢字', team: 'Core', joined: '2023-06-01', sales: { q1: 860, q2: 1430.25 } },
  { name: 'Linus', team: 'Tools', joined: '2022-11-30', sales: { q1: 0, q2: 75.5 } },
  { name: 'Margaret', team: 'Tools', joined: '2021-03-09', sales: { q1: 2210, q2: 2000 } },
];
const band: Style = { fill: 'F2F2F2' };
const showInternal = false as boolean;
const dataset: Dataset<Person> = {
  columns: [
    { title: 'Name', key: 'name', width: 'auto' },
    showInternal && { title: 'Internal id', key: 'id' },
    { title: 'Team', key: 'team' },
    { title: 'Joined', key: 'joined', type: 'date', numFmt: 'yyyy-mm-dd' },
    {
      title: 'Sales',
      headerStyle: { alignment: { horizontal: 'center' } },
      children: [
        { title: 'Q1', path: 'sales.q1', numFmt: '#,##0.00', total: 'sum' },
        { title: 'Q2', path: 'sales.q2', numFmt: '#,##0.00', total: 'average' },
      ],
    },
    { title: 'Rows', value: () => 1, total: 'count' },
  ],
  data: people,
};
const datasetOptions: DatasetOptions<Person> = {
  name: 'Dataset',
  freezeHeader: true,
  autoFilter: true,
  autoWidth: true,
  headerStyle: HEAD,
  rowStyle: (_r, i) => (i % 2 ? band : undefined),
  totals: { label: 'Total', style: { font: { bold: true }, border: { top: { style: 'thin' } } } },
};
const blocks: Array<DatasetBlock<any>> = [
  { columns: [{ title: 'Block 1: products', key: 'p' }, { title: 'Price', key: 'price', numFmt: '#,##0.00' }], data: [{ p: 'Pens', price: 1.5 }, { p: 'Pads', price: 3.25 }] },
  { columns: [{ title: 'Block 2: offset 1 column right', key: 'x' }], data: [{ x: 'one empty row above (gap 1)' }], offset: { cols: 1 } },
];
const stackedOptions = { name: 'Stacked', headerStyle: HEAD };

const builders = ALL.find((e) => e.id === '19-builders')!;
const corpusSheets = builders.workbook().sheets;
const properties = builders.workbook().properties;
const spec: WorkbookSpec = { sheets: [{ ...dataset, ...datasetOptions }, { blocks, ...stackedOptions }] };

/** javascript-excel's file of the corpus's Dataset and Stacked sheets. */
const jseBuilders = (): Promise<Uint8Array> => toUint8Array({ properties, sheets: corpusSheets.slice(0, 2) });

function HookProbe({ api }: { api: { current: UseExcelExport | null } }) {
  api.current = useExcelExport({ download: false, properties });
  return null;
}

describe('19-builders through react-data-export', () => {
  it('the input here builds exactly the corpus sheets', () => {
    expect(fromDataset(dataset, datasetOptions)).toEqual(corpusSheets[0]);
    expect(fromDatasets(blocks, stackedOptions)).toEqual(corpusSheets[1]);
  });

  it('exportWorkbook is byte-identical', async () => {
    const result = await exportWorkbook(spec, { download: false, properties });
    expect((await bytesOf(result.blob)).equals(Buffer.from(await jseBuilders()))).toBe(true);
  });

  it('exportDataset is byte-identical (the Dataset sheet)', async () => {
    const result = await exportDataset(dataset, { ...datasetOptions, download: false, properties });
    const want = await toUint8Array({ properties, sheets: [corpusSheets[0]!] });
    expect((await bytesOf(result.blob)).equals(Buffer.from(want))).toBe(true);
  });

  it('useExcelExport is byte-identical', async () => {
    const api: { current: UseExcelExport | null } = { current: null };
    render(<HookProbe api={api} />);
    const result = await api.current!.exportWorkbook(spec);
    expect((await bytesOf(result.blob)).equals(Buffer.from(await jseBuilders()))).toBe(true);
  });

  it('<ExcelExport> is byte-identical', async () => {
    const onExported = vi.fn<(r: ExportResult) => void>();
    render(
      <ExcelExport workbook={spec} download={false} properties={properties} onExported={onExported}>
        Export
      </ExcelExport>,
    );
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onExported).toHaveBeenCalledTimes(1));
    expect((await bytesOf(onExported.mock.calls[0]![0].blob)).equals(Buffer.from(await jseBuilders()))).toBe(true);
  });
});

// ------------------------------------------------------------ table (fromTable)

// javascript-excel's table golden case (its test/dom/golden.test.ts).
const STYLE = `.num { text-align: right } .total td { font-weight: 700; background-color: #ddebf7 } .warn { color: rgb(192, 0, 0); font-style: italic }`;
const INNER = `
  <thead>
    <tr><th rowspan="2">Product</th><th colspan="2">Sales</th></tr>
    <tr><th>Q1</th><th>Q2</th></tr>
  </thead>
  <tbody>
    <tr><td><a href="https://example.com/pens">Pens</a></td><td class="num" data-type="number" data-numfmt="#,##0.00">1,200.50</td><td class="num" data-type="number">980</td></tr>
    <tr><td class="warn">Pads<br>(new)</td><td class="num" data-type="number">860</td><td data-type="date" data-numfmt="yyyy-mm-dd">2024-01-15</td></tr>
    <tr hidden><td>secret</td></tr>
    <tr data-export-ignore><td>internal</td></tr>
  </tbody>
  <tfoot><tr class="total"><td>Total</td><td colspan="2" data-type="number" data-value="4040.5">4,040.50</td></tr></tfoot>
`;
const TABLE = `<table dir="rtl">${INNER}</table>`;
const tableOptions: FromTableOptions = { name: 'Sales', styles: 'computed', freezeHeader: true, autoFilter: true, autoWidth: true };
// Fixed timestamps: without them, docProps/core.xml holds the time of each write,
// and two files written a second apart differ.
const FIXED = new Date(Date.UTC(2026, 10, 16, 9, 0, 0));
const tableProperties = { created: FIXED, modified: FIXED };

beforeEach(() => {
  document.head.innerHTML = `<style>${STYLE}</style>`;
  document.body.innerHTML = ''; // exactly one table in the document
});
afterEach(() => {
  document.head.innerHTML = '';
});

/** javascript-excel's file for the table currently in the document. */
const jseTable = async (): Promise<Buffer> => Buffer.from(await toUint8Array({ properties: tableProperties, sheets: [fromTable(document.querySelector('table')!, tableOptions)] }));

/** The golden table, rendered by React, with an object ref. */
function GoldenTable({ tableRef }: { tableRef: { current: HTMLTableElement | null } }) {
  return <table ref={tableRef} dir="rtl" dangerouslySetInnerHTML={{ __html: INNER }} />;
}

function TableHookProbe({ api }: { api: { current: UseTableExport | null } }) {
  const ref = useRef<HTMLTableElement | null>(null);
  api.current = useTableExport(ref, { ...tableOptions, download: false, properties: tableProperties });
  return <GoldenTable tableRef={ref} />;
}

function TableButton({ onExported }: { onExported: (r: ExportResult) => void }) {
  const ref = useRef<HTMLTableElement | null>(null);
  return (
    <>
      <GoldenTable tableRef={ref} />
      <ExportTableButton tableRef={ref} {...tableOptions} download={false} properties={tableProperties} onExported={onExported}>
        Export
      </ExportTableButton>
    </>
  );
}

describe('the table golden case through react-data-export', () => {
  it('exportTable is byte-identical to fromTable + toUint8Array', async () => {
    document.body.innerHTML = TABLE;
    const result = await exportTable(document.querySelector('table')!, { ...tableOptions, download: false, properties: tableProperties });
    expect((await bytesOf(result.blob)).equals(await jseTable())).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('useTableExport is byte-identical', async () => {
    const api: { current: UseTableExport | null } = { current: null };
    render(<TableHookProbe api={api} />);
    const result = await api.current!.exportTable();
    expect((await bytesOf(result.blob)).equals(await jseTable())).toBe(true);
  });

  it('<ExportTableButton> is byte-identical', async () => {
    const onExported = vi.fn<(r: ExportResult) => void>();
    render(<TableButton onExported={onExported} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onExported).toHaveBeenCalledTimes(1));
    expect((await bytesOf(onExported.mock.calls[0]![0].blob)).equals(await jseTable())).toBe(true);
  });
});
