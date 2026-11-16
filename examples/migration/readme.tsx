// 1.0
import { ExcelExport } from 'react-data-export';

const employees = [{ name: 'Monika', is_married: false }];

export const Download = () => (
  <ExcelExport
    filename="employees"
    dataset={{
      name: 'Employees',
      columns: [
        { title: 'Name', key: 'name' },
        { title: 'Marital Status', value: (row: (typeof employees)[number]) => (row.is_married ? 'Married' : 'Single') },
      ],
      data: employees,
    }}
  >
    Download
  </ExcelExport>
);
