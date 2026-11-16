import { createRoot } from "react-dom/client";
import { ExcelExport, useExcelExport } from "react-data-export";

const dataset = {
  columns: [{ title: "Name", key: "name" }, { title: "Total", key: "total", numFmt: "#,##0.00" }],
  data: [{ name: "Ada", total: 1250.5 }],
};

function HookButton() {
  const { exportDataset, status } = useExcelExport({ filename: "hook" });
  return <button onClick={() => exportDataset(dataset)}>Hook export ({status})</button>;
}

createRoot(document.getElementById("root")).render(
  <>
    <ExcelExport dataset={dataset} filename="cra" />
    <HookButton />
  </>,
);
