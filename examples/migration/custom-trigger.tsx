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
