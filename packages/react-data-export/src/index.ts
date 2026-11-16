'use client';

// react-data-export 1.0: dataset export (docs/api.md). The data shape, column
// types, styles and options are javascript-excel's own, re-exported rather
// than redeclared, so a new javascript-excel option needs no release here.

export { exportDataset, exportWorkbook } from './export';
export type { ExportFormat, ExportOptions, ExportResult, SheetSpec, WorkbookSpec } from './export';
export { useExcelExport } from './use-excel-export';
export type { ExportStatus, UseExcelExport } from './use-excel-export';
export { ExcelExport } from './excel-export';
export type { ExcelExportProps, ExcelExportRenderApi } from './excel-export';
export { exportTable } from './table';
export type { TableRef, TableTarget } from './table';
export { ExportTableButton, useTableExport } from './table-react';
export type { ExportTableButtonProps, UseTableExport } from './table-react';

export type {
  CellInput,
  ColumnDef,
  Dataset,
  DatasetBlock,
  DatasetOptions,
  DocProperties,
  ExcelWarning,
  GroupColumn,
  LeafColumn,
  Progress,
  Style,
  WriteOptions,
} from 'javascript-excel';
export type { CsvWriteOptions } from 'javascript-excel/csv';
export type { FromTableOptions, TableCellElement, TableElement } from 'javascript-excel/dom';
export { isExcelError, sanitizeSheetName } from 'javascript-excel';

/** The published version of react-data-export. */
export const version = '1.0.0-alpha.1';
