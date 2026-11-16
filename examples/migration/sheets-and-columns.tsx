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
