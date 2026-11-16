// Scenarios shared by the 0.6 golden generator (scripts/legacy-goldens.mjs,
// run against the real react-data-export@0.6.0) and the react-data-export/legacy
// tests. Plain JS so both can import it. Dates use Date.UTC, so the goldens
// don't depend on the time zone of the machine that generated them.
//
// scenarios(React, { ExcelFile, ExcelSheet, ExcelColumn }) -> [{ name, element }]

const d = (y, m, day, h = 0, min = 0) => new Date(Date.UTC(y, m, day, h, min));

export function scenarios(React, { ExcelFile, ExcelSheet, ExcelColumn }) {
  const h = React.createElement;
  const people = [
    { name: 'Ada', age: 36, joined: d(2024, 0, 15), active: true, note: undefined, score: Number.NaN, code: '007', empty: null },
    { name: 'Alan', age: 41, joined: d(2024, 4, 2, 12, 30), active: false, note: 'x', score: 0, code: '12', empty: null },
  ];

  return [
    {
      // <ExcelColumn> path: plain headers, string keys, value types, empty values, dates, default filename.
      name: 'columns-basic',
      element: h(
        ExcelFile,
        {},
        h(
          ExcelSheet,
          { data: people, name: 'People' },
          h(ExcelColumn, { label: 'Name', value: 'name' }),
          h(ExcelColumn, { label: 'Age', value: 'age' }),
          h(ExcelColumn, { label: 'Joined', value: 'joined' }),
          h(ExcelColumn, { label: 'Active', value: 'active' }),
          h(ExcelColumn, { label: 'Note', value: 'note' }),
          h(ExcelColumn, { label: 'Score', value: 'score' }),
          h(ExcelColumn, { label: 'Code', value: 'code' }),
          h(ExcelColumn, { label: 'Empty', value: 'empty' }),
        ),
      ),
    },
    {
      // Function values, data as a function, filename with the extension already in it.
      name: 'columns-functions',
      element: h(
        ExcelFile,
        { filename: 'report.xlsx' },
        h(
          ExcelSheet,
          { data: () => people, name: 'Computed' },
          h(ExcelColumn, { label: 'Upper', value: (r) => r.name.toUpperCase() }),
          h(ExcelColumn, { label: 'Double', value: (r) => r.age * 2 }),
        ),
      ),
    },
    {
      // dataSet: object columns (default 80 px, explicit wch/wpx), header style replacing the bold,
      // styled cells in xlsx-style keys, number formats, null cells, dates.
      name: 'dataset-styles',
      element: h(
        ExcelFile,
        { filename: 'styled', fileExtension: 'xlsx' },
        h(ExcelSheet, {
          name: 'Styled',
          dataSet: [
            {
              columns: [
                { title: 'Item' },
                { title: 'Qty', width: { wch: 12 } },
                { title: 'Price', width: { wpx: 120 }, style: { font: { color: { rgb: 'FFFF0000' } }, fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF00' } } } },
                { title: 'When' },
              ],
              data: [
                [{ value: 'Pens', style: { font: { sz: '14', bold: true, name: 'Arial' } } }, 10, { value: 1.5, style: { numFmt: '0.00' } }, d(2024, 0, 15)],
                ['Paper', { value: 3, style: { fill: { patternType: 'solid', fgColor: { rgb: 'FF00FF00' } }, alignment: { horizontal: 'right' } } }, null, d(2024, 11, 31, 18, 0)],
                [{ value: true, style: { border: { top: { style: 'thin', color: { rgb: 'FF000000' } } } } }, 0, -2.25, null],
              ],
            },
          ],
        }),
      ),
    },
    {
      // Several blocks: xSteps/ySteps placement, the last block's widths written from column A,
      // string columns (0.6.0 left these headers empty; see the legacy docs), empty columns.
      name: 'dataset-blocks',
      element: h(
        ExcelFile,
        { filename: 'blocks' },
        h(ExcelSheet, {
          name: 'Blocks',
          dataSet: [
            { ySteps: 1, columns: [{ title: 'A', width: { wpx: 50 } }, { title: 'B' }], data: [[1, 2], [3, 4]] },
            { xSteps: 1, ySteps: 2, columns: ['Name', 'Dept'], data: [['Johnson', 'Finance']] },
            { xSteps: 2, columns: [{ title: 'Last', width: { wch: 30 } }], data: [['z']] },
            { columns: [], data: [['no header', 5]] },
          ],
        }),
      ),
    },
    {
      // Several sheets, mixed shapes; an empty dataSet falls back to data + columns.
      name: 'sheets-mixed',
      element: h(
        ExcelFile,
        { filename: 'book' },
        h(ExcelSheet, { name: 'First', data: people }, h(ExcelColumn, { label: 'Name', value: 'name' })),
        h(ExcelSheet, { name: 'Second', dataSet: [{ columns: [{ title: 'X' }], data: [[1], [2]] }] }),
        h(ExcelSheet, { name: 'Third', dataSet: [], data: [{ v: 'fallback' }] }, h(ExcelColumn, { label: 'V', value: 'v' })),
      ),
    },
    {
      // fileExtension '' takes the extension from the filename (and still appends it).
      name: 'filename-from-name',
      element: h(
        ExcelFile,
        { filename: 'data.xlsx', fileExtension: '' },
        h(ExcelSheet, { name: 'S', data: [{ a: 1 }] }, h(ExcelColumn, { label: 'A', value: 'a' })),
      ),
    },
  ];
}
