import { useRef } from "react";
import { createRoot } from "react-dom/client";
import { ExcelExport, ExportTableButton, useExcelExport } from "react-data-export";

const dataset = {
  columns: [{ title: "Name", key: "name" }, { title: "Total", key: "total", numFmt: "#,##0.00" }],
  data: [{ name: "Ada", total: 1250.5 }],
};

function HookButton() {
  const { exportDataset, status } = useExcelExport({ filename: "hook" });
  return <button onClick={() => exportDataset(dataset)}>Hook export ({status})</button>;
}

function TableButton() {
  const ref = useRef(null);
  return (
    <>
      <table ref={ref}>
        <tbody>
          <tr><td>Ada</td><td>1250.5</td></tr>
        </tbody>
      </table>
      <ExportTableButton tableRef={ref} filename="table" format="csv" />
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <>
    <ExcelExport dataset={dataset} filename="cra" />
    <HookButton />
    <TableButton />
  </>,
);
