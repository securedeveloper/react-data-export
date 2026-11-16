// 0.x code on 1.0 with one import change. Deprecated: supported for all of 1.x, removed in 2.0.
import ReactExport from 'react-data-export/legacy';

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

interface Employee {
  name: string;
  is_married: boolean;
}

export function Download({ employees }: { employees: Employee[] }) {
  return (
    <ExcelFile filename="employees" element={<button>Download</button>}>
      <ExcelSheet data={employees} name="Employees">
        <ExcelColumn label="Name" value="name" />
        <ExcelColumn label="Marital Status" value={(col: Employee) => (col.is_married ? 'Married' : 'Single')} />
      </ExcelSheet>
    </ExcelFile>
  );
}
