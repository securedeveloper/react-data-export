import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, exportOptions, parseDataset, sheetOptions } from '../src/options';

describe('parseDataset', () => {
  it('accepts { columns, data }', () => {
    expect(parseDataset('{"columns":[{"title":"A","key":"a"}],"data":[{"a":1}]}')).toEqual({ ok: true, dataset: { columns: [{ title: 'A', key: 'a' }], data: [{ a: 1 }] } });
  });
  it('explains invalid JSON and wrong shapes', () => {
    expect(parseDataset('{')).toMatchObject({ ok: false, message: expect.stringMatching(/^Not valid JSON/) });
    expect(parseDataset('[]')).toMatchObject({ ok: false, message: expect.stringMatching(/columns array and a data array/) });
    expect(parseDataset('{"columns":[]}')).toMatchObject({ ok: false });
  });
});

describe('options', () => {
  it('maps the editor options to fromDataset options', () => {
    const s = sheetOptions(DEFAULT_OPTIONS);
    expect(s).toMatchObject({ name: 'Sales', freezeHeader: true, autoFilter: true, autoWidth: true, headerStyle: { font: { bold: true }, fill: 'DDEBF7' }, totals: { label: 'Total' } });
    expect(s.rowStyle).toBeUndefined();
    const banded = sheetOptions({ ...DEFAULT_OPTIONS, bandedRows: true, totals: false, headerFill: '' });
    expect(banded.totals).toBeUndefined();
    expect(banded.headerStyle).toEqual({ font: { bold: true } });
    expect([0, 1, 2, 3].map((i) => banded.rowStyle!({}, i))).toEqual([undefined, { fill: 'F2F2F2' }, undefined, { fill: 'F2F2F2' }]);
  });
  it('maps file name and format, with a fallback name', () => {
    expect(exportOptions({ ...DEFAULT_OPTIONS, format: 'csv' })).toEqual({ filename: 'sales', format: 'csv' });
    expect(exportOptions({ ...DEFAULT_OPTIONS, filename: '  ' }).filename).toBe('export');
  });
});
