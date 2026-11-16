'use client';

// react-data-export/legacy: the 0.x API (<ExcelFile>, <ExcelSheet>,
// <ExcelColumn>, the `dataSet` shape and xlsx-style cell styles) on top of
// 1.0. Deprecated: supported for all of 1.x, removed in 2.0. See
// docs/migration.md, "Quick path: react-data-export/legacy".
//
//   import ReactExport from 'react-data-export/legacy';
//   const { ExcelFile } = ReactExport;
//   const { ExcelSheet, ExcelColumn } = ExcelFile;

import { ExcelColumn, ExcelFile, ExcelSheet, type ExcelFileComponent } from './legacy/components';

export { ExcelColumn, ExcelFile, ExcelSheet } from './legacy/components';
export type { ExcelColumnProps, ExcelFileComponent, ExcelFileProps, ExcelSheetProps } from './legacy/components';
export type { ExcelCell, ExcelCellData, ExcelDataSetColumn, ExcelSheetData, ExcelValue } from './legacy/build';
export { convertLegacyStyle } from './legacy/style';
export type { LegacyBorderSide, LegacyColor, LegacyStyle, LegacyStyle as ExcelStyle } from './legacy/style';

/** The 0.x default export: `import ReactExport from 'react-data-export/legacy'`. */
const ReactExport: { ExcelFile: ExcelFileComponent; ExcelSheet: typeof ExcelSheet; ExcelColumn: typeof ExcelColumn } = {
  ExcelFile,
  ExcelSheet,
  ExcelColumn,
};
export default ReactExport;
