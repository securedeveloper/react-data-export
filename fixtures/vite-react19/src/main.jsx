import { createRoot } from "react-dom/client";
import { ExcelExport, useExcelExport, exportDataset } from "react-data-export";

const dataset = {
  columns: [{ title: "Name", key: "name" }, { title: "Total", key: "total", numFmt: "#,##0.00" }],
  data: [{ name: "Ada", total: 1250.5 }],
};

function HookButton() {
  const { exportDataset: run, status } = useExcelExport({ filename: "hook" });
  return <button onClick={() => run(dataset)}>Hook export ({status})</button>;
}

createRoot(document.getElementById("root")).render(
  <>
    <ExcelExport dataset={dataset} filename="component" />
    <HookButton />
    <button onClick={() => exportDataset(dataset, { format: "csv" })}>CSV</button>
  </>,
);
