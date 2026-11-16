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
