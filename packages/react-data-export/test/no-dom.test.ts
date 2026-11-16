// @vitest-environment node
// Without a DOM (SSR, Node): importing is safe, download: true rejects with
// javascript-excel's ENVIRONMENT_UNSUPPORTED, download: false works.
import { isExcelError } from 'javascript-excel';
import * as rde from '../src/index';

const ds = { columns: [{ title: 'A', key: 'a' }], data: [{ a: 1 }] };

it('imports without touching browser globals', () => {
  expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
  expect(typeof rde.exportDataset).toBe('function');
});

it('download: true rejects with ENVIRONMENT_UNSUPPORTED', async () => {
  const err = await rde.exportDataset(ds).catch((e: unknown) => e);
  expect(isExcelError(err)).toBe(true);
  expect((err as { code: string }).code).toBe('ENVIRONMENT_UNSUPPORTED');
});

it('download: false returns the file', async () => {
  const result = await rde.exportDataset(ds, { download: false });
  expect(result.blob.size).toBeGreaterThan(0);
});
