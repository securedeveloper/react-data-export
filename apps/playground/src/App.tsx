import type { ReactElement } from 'react';
import { ExcelExport, version, type Dataset } from 'react-data-export';

interface Person {
  name: string;
  city: string;
  joined: Date;
  salary: number;
}

const people: Dataset<Person> = {
  columns: [
    { title: 'Name', key: 'name', width: 'auto' },
    { title: 'City', key: 'city' },
    { title: 'Joined', key: 'joined', type: 'date' },
    { title: 'Salary', key: 'salary', numFmt: '#,##0.00', total: 'sum' },
  ],
  data: [
    { name: 'Ada Lovelace', city: 'London', joined: new Date(2024, 0, 15), salary: 5200 },
    { name: 'Alan Turing', city: 'Manchester', joined: new Date(2024, 4, 2), salary: 4800 },
  ],
};

// Exported components need an explicit return type under isolatedDeclarations.
export function App(): ReactElement {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>react-data-export 1.0 playground — in progress</h1>
      <p>
        Workspace package version: <code>{version}</code>
      </p>
      <p>
        <ExcelExport dataset={{ ...people, name: 'People', freezeHeader: true }} filename="people">
          Download people.xlsx
        </ExcelExport>{' '}
        <ExcelExport dataset={people} filename="people" format="csv">
          Download people.csv
        </ExcelExport>
      </p>
    </main>
  );
}
