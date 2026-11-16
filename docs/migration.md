# Migrating from 0.6 to 1.0

react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0, and a clean break: the 0.x components `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` are gone. This guide shows every 0.x pattern next to its 1.0 code, then lists the behaviour that changed on purpose.

**You don't have to move now.** 0.6.x stays on npm unchanged: `npm install react-data-export@0.6` keeps working, and nothing is unpublished or deprecated. Its docs are at the [`v0.6.0` tag](https://github.com/securedeveloper/react-data-export/tree/v0.6.0).

Every 1.0 snippet below is a file in [`examples/migration/`](../examples/migration), type-checked in CI against the library. The 0.x snippets are taken from the 0.6 README and examples. The exact 1.0 API is in [api.md](api.md).

## Contents

1. [Install and imports](#1-install-and-imports)
2. [Quick reference](#2-quick-reference)
3. [Side by side](#3-side-by-side)
   - [3.1 `ExcelFile` + `ExcelSheet` + `ExcelColumn`](#31-excelfile--excelsheet--excelcolumn)
   - [3.2 `dataSet`: array rows, styled cells, widths](#32-dataset-array-rows-styled-cells-widths)
   - [3.3 `xSteps` / `ySteps`](#33-xsteps--ysteps)
   - [3.4 `hideElement`](#34-hideelement)
   - [3.5 `element`](#35-element)
   - [3.6 `fileExtension` and `filename`](#36-fileextension-and-filename)
   - [3.7 Cell styles](#37-cell-styles)
4. [Behaviour differences](#4-behaviour-differences)
5. [Not carried over](#5-not-carried-over)

## 1. Install and imports

```sh
npm uninstall file-saver tempa-xlsx    # only if you added them for 0.x
npm install react-data-export@next     # 1.0 prereleases go to the `next` tag; none is out yet
```

- **No peer libraries, no bundler setup.** 0.x needed `file-saver` and `tempa-xlsx`, and webpack settings for them (`node: { fs: 'empty' }`, `externals` for `./cptable` and `./jszip`). Delete those. 1.0's only dependency is javascript-excel, which has no dependencies of its own.
- **Named exports.** 0.x had a default export (`ReactExport.ExcelFile`, `ReactExport.ExcelFile.ExcelSheet`, …). 1.0 has named exports only:

  ```ts
  import { ExcelExport, useExcelExport, exportDataset, exportWorkbook } from 'react-data-export';
  import type { Dataset, Style } from 'react-data-export';
  ```
- **Types ship with the package**, generated from the source, so they match the code. The hand-written 0.x `types/index.d.ts` is gone.
- React 17, 18 and 19 are supported. Importing the package is safe during server rendering, and the entry is marked `"use client"`.

## 2. Quick reference

| 0.x | 1.0 | section |
|---|---|---|
| `<ExcelFile>` with `<ExcelSheet>` children | `<ExcelExport workbook={{ sheets: [...] }}>`, or `dataset={...}` for one sheet | [3.1](#31-excelfile--excelsheet--excelcolumn) |
| `<ExcelSheet name data>` | a sheet: `{ name, columns, data }` | [3.1](#31-excelfile--excelsheet--excelcolumn) |
| `<ExcelColumn label value="key">` | `{ title, key }` (`path` for nested properties) | [3.1](#31-excelfile--excelsheet--excelcolumn) |
| `<ExcelColumn label value={(row) => …}>` | `{ title, value: (row) => … }` | [3.1](#31-excelfile--excelsheet--excelcolumn) |
| `dataSet={[{ columns, data }]}` | `{ columns: [{ title }, …], data }`; array rows are read by position | [3.2](#32-dataset-array-rows-styled-cells-widths) |
| `columns: ['Name']` (strings) | `columns: [{ title: 'Name' }]` | [3.2](#32-dataset-array-rows-styled-cells-widths) |
| column `width: { wpx }` / `{ wch }` | the same, plus `'auto'` | [3.2](#32-dataset-array-rows-styled-cells-widths) |
| column `style` (header cell) | column `headerStyle`, or sheet `headerStyle` | [4](#4-behaviour-differences) |
| several `dataSet` entries, `xSteps`, `ySteps` | sheet `blocks`, `offset: { cols, rows }`, `gap: 0` | [3.3](#33-xsteps--ysteps) |
| `hideElement` | `useExcelExport` in a `useEffect` | [3.4](#34-hideelement) |
| `element={<button>…</button>}` | children as the label, or a render prop | [3.5](#35-element) |
| `filename` (default `Download`) | `filename` (default `export`) | [3.6](#36-fileextension-and-filename) |
| `fileExtension="xlsx"` / `"csv"` | `format="xlsx"` / `"csv"` | [3.6](#36-fileextension-and-filename) |
| `fileExtension="txt"` / `"xls"` / `"html"` | CSV with a tab delimiter / `xlsx` / none | [3.6](#36-fileextension-and-filename) |
| cell `{ value, style }` | the same, with javascript-excel style keys | [3.7](#37-cell-styles) |
| `font.sz`, `fill.patternType`/`fgColor`, `alignment.textRotation` | `font.size`, `fill: 'RRGGBB'` or `{ pattern, fgColor }`, `alignment.rotation` | [3.7](#37-cell-styles) |

## 3. Side by side

### 3.1 `ExcelFile` + `ExcelSheet` + `ExcelColumn`

**0.x**

```jsx
import ReactExport from "react-data-export";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

<ExcelFile>
    <ExcelSheet data={dataSet1} name="Employees">
        <ExcelColumn label="Name" value="name"/>
        <ExcelColumn label="Wallet Money" value="amount"/>
        <ExcelColumn label="Gender" value="sex"/>
        <ExcelColumn label="Marital Status"
                     value={(col) => col.is_married ? "Married" : "Single"}/>
    </ExcelSheet>
    <ExcelSheet data={dataSet2} name="Leaves">
        <ExcelColumn label="Name" value="name"/>
        <ExcelColumn label="Total Leaves" value="total"/>
        <ExcelColumn label="Remaining Leaves" value="remaining"/>
    </ExcelSheet>
</ExcelFile>
```

**1.0**

<!-- example: examples/migration/sheets-and-columns.tsx -->
```tsx
import { ExcelExport, type Dataset } from 'react-data-export';

interface Employee {
  name: string;
  amount: number;
  sex: 'M' | 'F';
  is_married: boolean;
}
interface Leave {
  name: string;
  total: number;
  remaining: number;
}

const employees: Employee[] = [
  { name: 'Johnson', amount: 30000, sex: 'M', is_married: true },
  { name: 'Monika', amount: 355000, sex: 'F', is_married: false },
];
const leaves: Leave[] = [{ name: 'Johnson', total: 25, remaining: 16 }];

// <ExcelColumn label value="key"> → { title, key }; a value function → { title, value }.
const employeeSheet: Dataset<Employee> = {
  columns: [
    { title: 'Name', key: 'name' },
    { title: 'Wallet Money', key: 'amount' },
    { title: 'Gender', key: 'sex' },
    { title: 'Marital Status', value: (row) => (row.is_married ? 'Married' : 'Single') },
  ],
  data: employees,
};
const leaveSheet: Dataset<Leave> = {
  columns: [
    { title: 'Name', key: 'name' },
    { title: 'Total Leaves', key: 'total' },
    { title: 'Remaining Leaves', key: 'remaining' },
  ],
  data: leaves,
};

export function Download() {
  return (
    <ExcelExport
      filename="Download"
      workbook={{
        sheets: [
          { ...employeeSheet, name: 'Employees' },
          { ...leaveSheet, name: 'Leaves' },
        ],
      }}
    >
      Download
    </ExcelExport>
  );
}
```

- Each `<ExcelSheet>` becomes one entry in `workbook.sheets`: its `name`, plus a dataset (`columns` and `data`). For a single sheet, `<ExcelExport dataset={{ ...dataset, name }}>` is shorter.
- `label` becomes `title`. A string `value` becomes `key` (an own property, read literally) or `path` (`'address.city'`, `'items[0].name'`). A function `value` stays `value`, and it also gets `{ rowIndex }`.
- `data={() => rows}` (a function) is gone: pass the array. To build the rows only when the user clicks, call `exportWorkbook`/`exportDataset` from your own handler (see [3.5](#35-element)).
- Sheets can be conditional: `sheets: [summary, isAdmin && salaries]`. Falsy entries are skipped. Columns work the same way.
- New per-sheet options: `freezeHeader`, `autoFilter`, `autoWidth`, `rightToLeft`, `totals`, `rowStyle`, header groups (`children` on a column), and per-column `type` and `numFmt`. See [api.md §3](api.md#3-the-dataset-shape).

### 3.2 `dataSet`: array rows, styled cells, widths

**0.x**

```jsx
const multiDataSet = [
    {
        columns: [
            {title: "Headings", width: {wpx: 80}},//pixels width
            {title: "Text Style", width: {wch: 40}},//char width
            {title: "Colors", width: {wpx: 90}},
        ],
        data: [
            [
                {value: "H1", style: {font: {sz: "24", bold: true}}},
                {value: "Bold", style: {font: {bold: true}}},
                {value: "Red", style: {fill: {patternType: "solid", fgColor: {rgb: "FFFF0000"}}}},
            ],
            [
                {value: "H2", style: {font: {sz: "18", bold: true}}},
                {value: "underline", style: {font: {underline: true}}},
                {value: "Blue", style: {fill: {patternType: "solid", fgColor: {rgb: "FF0000FF"}}}},
            ],
        ]
    }
];

<ExcelFile element={<button>Download Data With Styles</button>}>
    <ExcelSheet dataSet={multiDataSet} name="Organization"/>
</ExcelFile>
```

**1.0**

<!-- example: examples/migration/styled-dataset.tsx -->
```tsx
import { ExcelExport, type Dataset } from 'react-data-export';

// Rows are arrays, so each column takes the value at its position.
// A cell is a bare value or { value, style }; style keys are javascript-excel's.
const styles: Dataset<unknown[]> = {
  columns: [
    { title: 'Headings', width: { wpx: 80 } }, // pixels
    { title: 'Text Style', width: { wch: 40 } }, // characters
    { title: 'Colors', width: { wpx: 90 } },
  ],
  data: [
    [
      { value: 'H1', style: { font: { size: 24, bold: true } } },
      { value: 'Bold', style: { font: { bold: true } } },
      { value: 'Red', style: { fill: 'FF0000' } },
    ],
    [
      { value: 'H2', style: { font: { size: 18, bold: true } } },
      { value: 'underline', style: { font: { underline: true } } },
      { value: 'Blue', style: { fill: { pattern: 'solid', fgColor: { rgb: 'FF0000FF' } } } },
    ],
  ],
};

export function DownloadStyled() {
  return (
    <ExcelExport filename="Organization" dataset={{ ...styles, name: 'Organization' }}>
      Download Data With Styles
    </ExcelExport>
  );
}
```

- **Array rows stay array rows.** A column without `key`, `path` or `value` takes the cell at its own position; `index` picks another position.
- **Columns must be objects.** A plain string throws `INVALID_COLUMN`. (In 0.6.0 a string column also misbehaved: the header code reads `col.title`, so the header cell came out empty.)
- **Cells** are a bare value or `{ value, style }`, as before. They can also carry `formula`, `hyperlink` and `type`.
- **Widths** keep `{ wpx }` and `{ wch }`, and add a bare number (characters) and `'auto'`.
- The style keys changed. See [3.7](#37-cell-styles) for the table, and a converter for existing style objects.

### 3.3 `xSteps` / `ySteps`

**0.x**

```jsx
const multiDataSet = [
    {
        columns: ["Name", "Salary", "Sex"],
        data: [["Johnson", 30000, "Male"], ["Monika", 355000, "Female"]]
    },
    {
        xSteps: 1, // Will start putting cell with 1 empty cell on left most
        ySteps: 5, //will put space of 5 rows,
        columns: ["Name", "Department"],
        data: [["Johnson", "Finance"], ["Monika", "IT"]]
    }
];

<ExcelFile>
    <ExcelSheet dataSet={multiDataSet} name="Organization"/>
</ExcelFile>
```

**1.0**

<!-- example: examples/migration/stacked-blocks.tsx -->
```tsx
import { ExcelExport } from 'react-data-export';

// Several blocks on one sheet. 0.x `xSteps` → offset.cols (from column A);
// 0.x `ySteps` → offset.rows (empty rows above the block). `gap: 0` matches 0.x,
// which put a block right under the previous one unless ySteps said otherwise.
export function DownloadOrganization() {
  return (
    <ExcelExport
      filename="Organization"
      workbook={{
        sheets: [
          {
            name: 'Organization',
            gap: 0,
            blocks: [
              {
                columns: [{ title: 'Name' }, { title: 'Salary' }, { title: 'Sex' }],
                data: [
                  ['Johnson', 30000, 'Male'],
                  ['Monika', 355000, 'Female'],
                ],
              },
              {
                offset: { cols: 1, rows: 5 },
                columns: [{ title: 'Name' }, { title: 'Department' }],
                data: [
                  ['Johnson', 'Finance'],
                  ['Monika', 'IT'],
                ],
              },
            ],
          },
        ],
      }}
    >
      Download
    </ExcelExport>
  );
}
```

- `xSteps` → `offset.cols` and `ySteps` → `offset.rows`, with the same meaning. Columns count from column A for every block. Rows count from the end of the previous block, or from row 1 for the first block.
- 1.0's default is one empty row between blocks (`gap: 1`). 0.x put each block straight under the previous one. With `gap: 0` and the same `offset` values, every cell lands where 0.x put it: in the example the second block starts at B9 in both versions.
- `freezeHeader` and `autoFilter` apply to the first block that has a header row.

### 3.4 `hideElement`

**0.x**

```jsx
<ExcelFile hideElement={true} filename="report">
    <ExcelSheet data={rows} name="Sheet1">
        <ExcelColumn label="Name" value="name"/>
        <ExcelColumn label="Amount" value="amount"/>
    </ExcelSheet>
</ExcelFile>
```

**1.0**

<!-- example: examples/migration/auto-download.tsx -->
```tsx
import { useEffect } from 'react';
import { useExcelExport, type Dataset } from 'react-data-export';

interface Row {
  name: string;
  amount: number;
}

// 0.x `hideElement`: download as soon as the component mounts, render nothing.
export function AutoDownload({ rows }: { rows: Row[] }) {
  const { exportDataset } = useExcelExport();
  useEffect(() => {
    const dataset: Dataset<Row> = {
      columns: [
        { title: 'Name', key: 'name' },
        { title: 'Amount', key: 'amount' },
      ],
      data: rows,
    };
    // Rejected with an AbortError if the component unmounts first
    // (StrictMode does that once in development, then runs the effect again).
    exportDataset(dataset, { filename: 'report' }).catch(() => {});
  }, [exportDataset, rows]);
  return null;
}
```

- 0.x started the download in the `ExcelFile` constructor, so it ran on every construction. In development, React's StrictMode constructs class components twice, which gave two files. 1.0 starts it in an effect, and the hook aborts it when the component unmounts. StrictMode's simulated unmount aborts the first run and the remount starts a new one, so an xlsx export saves one file.
  - **CSV caveat:** a CSV export finishes synchronously inside the first call, before the simulated unmount can abort it. Until that is fixed, this recipe saves the CSV twice under StrictMode in development. Production builds, which run effects once, are not affected.
- Browsers may block a download that doesn't follow a click or a key press. That was true in 0.x too. Prefer a button where you can.
- The hook also gives `status`, `progress`, `error`, `result` and `abort()`. See [api.md §5](api.md#5-useexcelexport).

### 3.5 `element`

**0.x**

```jsx
<ExcelFile element={<button>Download Data</button>}>
    <ExcelSheet data={dataSet1} name="Employees">
        <ExcelColumn label="Name" value="name"/>
    </ExcelSheet>
</ExcelFile>
```

**1.0**

<!-- example: examples/migration/custom-trigger.tsx -->
```tsx
import type { ReactElement } from 'react';
import { ExcelExport, type Dataset } from 'react-data-export';

declare function MyButton(props: { onClick: () => void; disabled: boolean; children: string }): ReactElement;

const people: Dataset<{ name: string }> = {
  columns: [{ title: 'Name', key: 'name' }],
  data: [{ name: 'Ada' }],
};

// 0.x `element={<button>Download Data</button>}` → the default button's label…
export function WithLabel() {
  return <ExcelExport dataset={people}>Download Data</ExcelExport>;
}

// …or any element, through the render prop.
export function WithOwnButton() {
  return (
    <ExcelExport dataset={people} filename="people">
      {({ run, status }) => (
        <MyButton onClick={() => void run()} disabled={status === 'exporting'}>
          Download Data
        </MyButton>
      )}
    </ExcelExport>
  );
}
```

- 0.x wrapped `element` in a `<span onClick>`. 1.0 adds no wrapper element.
- Without children, `<ExcelExport>` renders `<button type="button">Export</button>`, disabled while the export runs. A string or element child becomes that button's label.
- For anything else (a design-system button, a menu item, a link), use the render prop: you get `run`, `status` and `progress`. `run()` never rejects. Errors go to `onError`, or to `console.error` if there is no `onError`. `onExported` fires once the file has been handed to the browser.
- Not using a component at all? Call `exportDataset` / `exportWorkbook` from any handler. They return a promise with `{ blob, filename, format, warnings }`.

### 3.6 `fileExtension` and `filename`

**0.x**

```jsx
<ExcelFile filename="report" fileExtension="csv">…</ExcelFile>
```

**1.0**

<!-- example: examples/migration/file-formats.ts -->
```ts
import { exportDataset, type Dataset } from 'react-data-export';

const people: Dataset<{ name: string; city: string }> = {
  columns: [
    { title: 'Name', key: 'name' },
    { title: 'City', key: 'city' },
  ],
  data: [{ name: 'Ada', city: 'London' }],
};

// fileExtension="xlsx" (the default) → format: 'xlsx' (the default). 'report' → report.xlsx.
export async function asXlsx(): Promise<void> {
  await exportDataset(people, { filename: 'report' });
}

// fileExtension="csv" → format: 'csv'. Real CSV text: UTF-8 with a BOM, formula-injection guard on.
export async function asCsv(): Promise<void> {
  await exportDataset(people, { filename: 'report', format: 'csv' });
}

// fileExtension="txt" has no format of its own: build tab-separated text, then save it under any name.
export async function asTabSeparatedTxt(): Promise<void> {
  const { blob } = await exportDataset(people, { format: 'csv', csv: { delimiter: '\t' }, download: false });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'report.txt';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
}
```

| 0.x `fileExtension` | what 0.6.0 actually saved | 1.0 |
|---|---|---|
| `xlsx` (default) | an `.xlsx` workbook | `format: 'xlsx'` (default) |
| `csv` | the xlsx zip package, under a `.csv` name | `format: 'csv'`: real CSV text |
| `txt` | the xlsx zip package, under a `.txt` name | `format: 'csv'` with `csv: { delimiter: '\t' }`, saved under your own name (example above) |
| `xls` | the xlsx zip package, under a `.xls` name | `format: 'xlsx'`. Legacy `.xls` (BIFF8) output isn't planned for 1.0 |
| `html` | the xlsx zip package, under an `.html` name | none. Render an HTML table in your app |
| anything else | an `.xlsx` workbook | a `TypeError` |

0.6.0 handed every extension to tempa-xlsx, whose write function only special-cases `'xml'`. Every other book type went through its zip writer. So any CSV, TXT, XLS or HTML file from 0.6 was really an xlsx package with another name.

- **Filename:** 1.0 appends the extension only when the name doesn't already end with it: `'report'` → `report.xlsx`, `'report.xlsx'` → `report.xlsx`. 0.x always appended it, so `filename="report.xlsx"` gave `report.xlsx.xlsx`. The default name changes from `Download` to `export`, and an empty name falls back to `export`.
- **CSV holds one sheet.** `exportWorkbook` with `format: 'csv'` and several sheets throws a `TypeError`. Export each sheet as its own file (`Promise.all` over several `exportDataset` calls).
- **CSV defaults:**
  - UTF-8 with a byte-order mark, so Excel detects the encoding.
  - CRLF line endings.
  - A formula-injection guard: a text field starting with `=`, `+`, `-`, `@`, tab or CR gets a leading `'`.

  All of these can be changed in `csv` (`bom`, `newline`, `delimiter`, `quote`, `escapeFormulas`, `dates`). Only turn the guard off for data you trust.

### 3.7 Cell styles

1.0 uses javascript-excel's style model. It has the same five groups (`font`, `fill`, `border`, `alignment`, `numFmt`), with these changes:

| 0.x (xlsx-style) | 1.0 |
|---|---|
| `font.sz: "24"` | `font.size: 24` (a number) |
| `font.color: { rgb: 'FFFF0000' }` | `font.color: 'FF0000'`, or `{ rgb: 'FFFF0000' }` |
| `fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF00' } }` | `fill: 'FFFF00'`, or `{ pattern: 'solid', fgColor: { rgb: 'FFFFFF00' } }` |
| `fill: { patternType: 'none' }` | leave `fill` out |
| colour `{ theme: '1', tint: '-0.25' }` | `{ theme: 1, tint: -0.25 }` (numbers) |
| colour `{ auto: 1 }` | `{ auto: true }` |
| `alignment.textRotation: 0`–`90` | `alignment.rotation`: the same value |
| `alignment.textRotation: 91`–`180` (135 = 45° down) | `alignment.rotation: 90 - value` (135 → `-45`) |
| `alignment.textRotation: 255` (stacked) | `alignment.rotation: 'vertical'` |
| `alignment.readingOrder: 2` | `alignment.readingOrder: 'rtl'` (`1` → `'ltr'`) |
| `alignment.horizontal`/`vertical` | the same keys. `horizontal` takes `left`, `center`, `right`, `justify`, …; `vertical` takes `top`, `center`, `bottom`, … |
| `font.vertAlign: true` | `font.vertAlign: 'superscript'` or `'subscript'` |
| `border.top: { style, color }` (and `bottom`, `left`, `right`, `diagonal`) | the same; `'double'` is also accepted |
| `numFmt: '0.00%'` | the same. A string is always a format code; a number is a built-in format id |

Invalid styles now fail loudly, with some exceptions. A 0.x fill (`patternType` but no `pattern`), a string theme index, `auto: 1`, a boolean `vertAlign` or `horizontal: 'bottom'` throws `INVALID_STYLE`, naming the cell. But keys that 1.0 doesn't know, such as `font.sz` and `alignment.textRotation`, are ignored without an error. Convert them; don't rely on an error to find them.

If your app has many 0.x style objects, convert them in one place. This helper is type-checked with the rest of the examples. Copy it into your project:

<!-- example: examples/migration/legacy-style.ts -->
```ts
import type { Style } from 'react-data-export';

/** A 0.x (xlsx-style) style object, as documented in the 0.6 README. */
export interface LegacyColor {
  auto?: number;
  rgb?: string;
  theme?: string | number;
  tint?: string | number;
  indexed?: number;
}
export interface LegacyBorderSide {
  style: string;
  color?: LegacyColor;
}
export interface LegacyStyle {
  fill?: { patternType?: string; fgColor?: LegacyColor; bgColor?: LegacyColor };
  font?: {
    name?: string;
    sz?: string | number;
    color?: LegacyColor;
    bold?: boolean;
    underline?: boolean;
    italic?: boolean;
    strike?: boolean;
    outline?: boolean;
    shadow?: boolean;
  };
  numFmt?: string;
  alignment?: { vertical?: string; horizontal?: string; wrapText?: boolean; readingOrder?: number; textRotation?: number };
  border?: { top?: LegacyBorderSide; bottom?: LegacyBorderSide; left?: LegacyBorderSide; right?: LegacyBorderSide; diagonal?: LegacyBorderSide; diagonalUp?: boolean; diagonalDown?: boolean };
}

type Font = NonNullable<Style['font']>;
type Color = NonNullable<Font['color']>;
type Alignment = NonNullable<Style['alignment']>;
type Border = NonNullable<Style['border']>;
type BorderSide = NonNullable<Border['top']>;

function color(c: LegacyColor | undefined): Color | undefined {
  if (!c) return undefined;
  if (c.rgb !== undefined) return { rgb: c.rgb };
  if (c.theme !== undefined) return { theme: Number(c.theme), ...(c.tint !== undefined ? { tint: Number(c.tint) } : {}) };
  if (c.indexed !== undefined) return { indexed: c.indexed };
  if (c.auto) return { auto: true };
  return undefined;
}

// 0.x: 0–90 up, 91–180 down (135 = 45° down), 255 = stacked. 1.0: -90..90, or 'vertical'.
function rotation(r: number | undefined): Alignment['rotation'] {
  if (r === undefined) return undefined;
  if (r === 255) return 'vertical';
  return r > 90 ? 90 - r : r;
}

const HORIZONTAL = ['general', 'left', 'center', 'right', 'fill', 'justify', 'centerContinuous', 'distributed'] as const;
const VERTICAL = ['top', 'center', 'bottom', 'justify', 'distributed'] as const;
const pick = <T extends string>(allowed: readonly T[], v: string | undefined): T | undefined =>
  allowed.find((a) => a === v);

function side(s: LegacyBorderSide | undefined): BorderSide | undefined {
  if (!s) return undefined;
  const c = color(s.color);
  return { style: s.style as BorderSide['style'], ...(c ? { color: c } : {}) };
}

/** Converts a 0.x cell style to a react-data-export 1.0 (javascript-excel) style. */
export function convertLegacyStyle(old: LegacyStyle): Style {
  const style: Style = {};
  if (old.font) {
    const { sz, color: c, name, bold, italic, underline, strike, outline, shadow } = old.font;
    const font: Font = { name, bold, italic, underline, strike, outline, shadow };
    if (sz !== undefined) font.size = Number(sz);
    if (c) font.color = color(c);
    style.font = font;
  }
  // A fill with a colour becomes a solid fill; 'none' or no colour means no fill.
  if (old.fill && old.fill.patternType !== 'none' && old.fill.fgColor) {
    const fg = color(old.fill.fgColor);
    const bg = color(old.fill.bgColor);
    style.fill = { pattern: 'solid', ...(fg ? { fgColor: fg } : {}), ...(bg ? { bgColor: bg } : {}) };
  }
  if (old.numFmt !== undefined) style.numFmt = old.numFmt;
  if (old.alignment) {
    const a = old.alignment;
    style.alignment = {
      horizontal: pick(HORIZONTAL, a.horizontal),
      vertical: pick(VERTICAL, a.vertical),
      wrapText: a.wrapText,
      rotation: rotation(a.textRotation),
      readingOrder: a.readingOrder === 2 ? 'rtl' : a.readingOrder === 1 ? 'ltr' : undefined,
    };
  }
  if (old.border) {
    const b = old.border;
    style.border = {
      top: side(b.top),
      bottom: side(b.bottom),
      left: side(b.left),
      right: side(b.right),
      diagonal: side(b.diagonal),
      diagonalUp: b.diagonalUp,
      diagonalDown: b.diagonalDown,
    };
  }
  return style;
}
```

```ts
import { convertLegacyStyle } from './legacy-style';

const cell = { value: 'Red', style: convertLegacyStyle({ fill: { patternType: 'solid', fgColor: { rgb: 'FFFF0000' } } }) };
```

Styles also cascade in 1.0: a column's `style` applies to every data cell in the column, a `rowStyle` function styles whole rows, and a cell's own `style` is merged on top.

## 4. Behaviour differences

Intentional changes, found by comparing the 0.6.0 source with 1.0. Where you might want the old behaviour back, the last column says how.

| | 0.6.0 | 1.0 | to get the 0.6 output |
|---|---|---|---|
| **Header style, `<ExcelColumn>`** | plain text, not bold | bold (`{ font: { bold: true } }`) | `headerStyle: {}` |
| **Header style, `dataSet`** | bold; a column's `style` replaced the bold | bold. The sheet's `headerStyle` replaces the bold; a column's `headerStyle` is merged over the sheet's | put the full style in `headerStyle` |
| **Column widths** | `dataSet` columns written as objects: `{ wpx: 80 }` unless set. `<ExcelColumn>`: none. Several blocks on one sheet: the last block's widths won | no width unless set, so Excel's default (about 64 px) applies | `width: { wpx: 80 }` on each column |
| **Dates** | converted as UTC: midnight local time in Berlin became 23:00 UTC the day before, so a date-only format showed the previous day | the local time zone of the browser (javascript-excel's default) | `write: { dateZone: 'utc' }` |
| **Date format** | built-in format 14 (short date) | the same, unless the column or cell sets `numFmt` | — |
| **`hideElement` / auto-download** | downloads in the constructor: twice under StrictMode in development | xlsx: once under StrictMode (CSV: see [3.4](#34-hideelement)); aborted on unmount | — |
| **`fileExtension` other than xlsx** | an xlsx package under that name ([3.6](#36-fileextension-and-filename)) | real CSV for `'csv'`; any other format is a `TypeError` | — |
| **File name** | extension always appended; default `Download` | appended unless already there; default `export` | `filename: 'Download'` |
| **Trigger markup** | `<span onClick>` around `element`; default `<button>Download</button>` | no wrapper; default `<button type="button">Export</button>`, disabled while exporting | `<ExcelExport …>Download</ExcelExport>` |
| **Timing and errors** | synchronous; errors thrown inside the click handler | a promise; errors go to `onError` or `console.error`; `onExported` on success | — |
| **Empty `columns: []`** | an empty header row, then the data | no columns, so no cells | `columns: [{}, {}], header: false` (one `{}` per column) |
| **Empty values (`<ExcelColumn>`)** | `undefined`, `''` and `NaN` → an empty text cell; `null` → no cell | `null`/`undefined` → no cell; `NaN`/`Infinity` → no cell plus a `NON_FINITE_NUMBER` warning | — |
| **Invalid styles** | passed to tempa-xlsx | `INVALID_STYLE` for invalid values; unknown keys ignored ([3.7](#37-cell-styles)) | convert with `convertLegacyStyle` |
| **Sheet names** | passed through | validated: an invalid name throws `INVALID_SHEET_NAME` | `sanitizeSheetName(name)` |
| **CSV** | not available (see above) | UTF-8 BOM, CRLF, formula-injection guard on | `csv: { bom: false, escapeFormulas: false }` |
| **`dataSet` and `data` on one sheet** | `dataSet` won when it wasn't empty | one shape per sheet | — |

Together, for a sheet that should look like a 0.6 export:

<!-- example: examples/migration/like-0x.ts -->
```ts
import { exportDataset, type Dataset } from 'react-data-export';

interface Row {
  name: string;
  joined: Date;
}

// Options that bring 1.0's output closer to what 0.x wrote, where it differs.
export async function exportLike0x(rows: Row[]): Promise<void> {
  const dataset: Dataset<Row> = {
    columns: [
      // dataSet columns given as objects got 80 px unless they had a width
      { title: 'Name', key: 'name', width: { wpx: 80 } },
      { title: 'Joined', key: 'joined', width: { wpx: 80 } },
    ],
    data: rows,
  };
  await exportDataset(dataset, {
    filename: 'Download', // the 0.x default name
    headerStyle: {}, // <ExcelColumn> headers were not bold (dataSet headers were: leave this out)
    write: { dateZone: 'utc' }, // 0.x wrote dates as UTC times
  });
}
```

## 5. Not carried over

- **`.xls`, `.html` and `.txt` output**, and `fileExtension` itself. See the table in [3.6](#36-fileextension-and-filename).
- **`element` cloning.** Injecting `onClick` into an arbitrary element breaks with components that don't forward it, and with fragments. The render prop replaces it ([api.md §12 Q5](api.md#12-design-decisions)).
- **A `hideElement` prop.** It is a three-line effect instead ([3.4](#34-hideelement)).
- **`data` as a function** on a sheet. Pass the rows, or build them in your own handler.
- **The default export and `ExcelFile.ExcelSheet` / `ExcelFile.ExcelColumn`**, and PropTypes. 1.0 has named exports and TypeScript types.

Found a 0.x pattern this guide doesn't cover? Please open an issue with the snippet.
