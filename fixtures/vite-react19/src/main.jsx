import { useRef } from "react";
import { createRoot } from "react-dom/client";
import { ExcelExport, useExcelExport, useTableExport, exportDataset } from "react-data-export";

const dataset = {
  columns: [{ title: "Name", key: "name" }, { title: "Total", key: "total", numFmt: "#,##0.00" }],
  data: [{ name: "Ada", total: 1250.5 }],
};

function HookButton() {
  const { exportDataset: run, status } = useExcelExport({ filename: "hook" });
  return <button onClick={() => run(dataset)}>Hook export ({status})</button>;
}

function TableHook() {
  const ref = useRef(null);
  const { exportTable, status } = useTableExport(ref, { filename: "table" });
  return (
    <>
      <table ref={ref}>
        <thead>
          <tr><th colSpan={2}>Totals</th></tr>
        </thead>
        <tbody>
          <tr><td>Ada</td><td data-type="number" data-value="1250.5">1,250.50</td></tr>
        </tbody>
      </table>
      <button onClick={() => exportTable({ styles: "computed" })}>Table export ({status})</button>
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <>
    <ExcelExport dataset={dataset} filename="component" />
    <HookButton />
    <TableHook />
    <button onClick={() => exportDataset(dataset, { format: "csv" })}>CSV</button>
  </>,
);
