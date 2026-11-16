'use client';

import { useDebugValue } from 'react';

// Types and helpers are javascript-excel's (docs/api.md §1–§2): re-exported,
// never redeclared, so a new javascript-excel option needs no release here.
export type { CellInput, DocProperties, ExcelWarning, Progress, Style, WriteOptions } from 'javascript-excel';
export type { CsvWriteOptions } from 'javascript-excel/csv';
export { isExcelError, sanitizeSheetName } from 'javascript-excel';
// Dataset, ColumnDef, LeafColumn, GroupColumn and DatasetOptions are re-exported
// here once javascript-excel 2.0.0-alpha.2 ships them with fromDataset (JSE-14).

/** The published version of react-data-export. */
export const version = '1.0.0-alpha.0';

/**
 * Placeholder hook so the React toolchain (peer resolution, tests across
 * React 17/18/19, typings) is exercised before any real API exists.
 * It only returns the package version; it does not export anything.
 */
export function useVersion(): string {
  useDebugValue(version);
  return version;
}

// RDE-1.9: dataset export lands here
