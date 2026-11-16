import { useRef } from "react";
import ReactDOM from "react-dom";
import { ExcelExport, exportTable, useExcelExport, type ExcelExportProps, type ExportResult } from "react-data-export";

interface Row {
  name: string;
  total: number;
}

const dataset: NonNullable<ExcelExportProps["dataset"]> = {
  columns: [{ title: "Name", key: "name" }, { title: "Total", key: "total", numFmt: "#,##0.00" }],
  data: [{ name: "Ada", total: 1250.5 }] satisfies Row[],
};

function HookButton() {
  const { exportDataset, status } = useExcelExport({ filename: "hook" });
  return <button onClick={() => void exportDataset<Row>({ columns: dataset.columns, data: [{ name: "Grace", total: 980 }] })}>Hook export ({status})</button>;
}

// React 17's useRef<T>(null) is a RefObject<T> with a `current: T | null`; exportTable takes it as is.
function TableCsv() {
  const ref = useRef<HTMLTableElement>(null);
  const save = (): Promise<ExportResult> => exportTable(ref, { format: "csv", filename: "table" });
  return (
    <>
      <table ref={ref}>
        <thead>
          <tr>
            <th colSpan={2}>Totals</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ada</td>
            <td>1250.5</td>
          </tr>
        </tbody>
      </table>
      <button onClick={() => void save()}>Table CSV</button>
    </>
  );
}

ReactDOM.render(
  <>
    <ExcelExport dataset={dataset} filename="react17">
      {({ run, status }) => <button onClick={() => void run()}>Export ({status})</button>}
    </ExcelExport>
    <HookButton />
    <TableCsv />
  </>,
  document.getElementById("root"),
);
