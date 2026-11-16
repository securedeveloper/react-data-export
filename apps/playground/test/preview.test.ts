import { fromDataset } from 'javascript-excel';
import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, sheetOptions } from '../src/options';
import { previewOf } from '../src/preview';
import { SAMPLE_DATASET } from '../src/sample';

describe('previewOf', () => {
  const sheet = fromDataset(SAMPLE_DATASET as never, { ...sheetOptions(DEFAULT_OPTIONS), totals: { label: 'Total' } });
  const p = previewOf(sheet);

  it('shows grouped headers as merged cells', () => {
    // Row 1: Name, City, Joined span two header rows; "Sales" spans Q1 and Q2.
    const top = p.rows[0]!;
    expect(top.filter(Boolean).map((c) => [c!.text, c!.rowSpan, c!.colSpan])).toEqual([
      ['Name', 2, 1],
      ['City', 2, 1],
      ['Joined', 2, 1],
      ['Sales', 1, 2],
    ]);
    expect(p.rows[1]!.filter(Boolean).map((c) => c!.text)).toEqual(['Q1', 'Q2']);
    expect(p.frozenRows).toBe(2);
  });

  it('shows values as cellText gives them (number formats are not rendered in 2.0) and right-aligns numbers', () => {
    const ada = p.rows[2]!;
    expect(ada.map((c) => c?.text)).toEqual(['Ada Lovelace', 'London', '2024-01-15', '1200.5', '980']);
    expect(ada[3]!.align).toBe('right');
    expect(ada[3]!.title).toBe('Number format: #,##0.00');
  });

  it('shows the totals row with its SUBTOTAL formula as the tooltip', () => {
    const total = p.rows[p.rows.length - 1]!;
    expect(total[0]!.text).toBe('Total');
    expect(total[3]!.text).toBe('2060.5');
    expect(total[3]!.title).toMatch(/^=SUBTOTAL\(109,/);
  });

  it('carries header styles and caps long sheets', () => {
    expect(p.rows[0]![0]!.bold).toBe(true);
    expect(p.rows[0]![0]!.background).toBe('#DDEBF7');
    const big = fromDataset({ columns: [{ title: 'n', key: 'n' }], data: Array.from({ length: 500 }, (_, n) => ({ n })) });
    const capped = previewOf(big, 100);
    expect(capped.rows).toHaveLength(100);
    expect(capped.truncated).toBe(true);
  });
});
