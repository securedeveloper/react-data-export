// Every export of the main entry, used: the upper bound for react-data-export.
import { useRef } from "react";
import { createRoot } from "react-dom/client";
import { ExcelExport, ExportTableButton, exportDataset, exportTable, exportWorkbook, isExcelError, sanitizeSheetName, useExcelExport, useTableExport } from "react-data-export";

const people = { columns: [{ title: "Name", key: "name" }], data: [{ name: "Ada" }] };

function App() {
  const ref = useRef(null);
  const hook = useExcelExport();
  const table = useTableExport(ref);
  return (
    <>
      <table ref={ref}><tbody><tr><td>Ada</td></tr></tbody></table>
      <ExcelExport dataset={people}>Component</ExcelExport>
      <ExportTableButton tableRef={ref}>Table button</ExportTableButton>
      <button onClick={() => hook.exportDataset(people, { format: "csv" })}>Hook</button>
      <button onClick={() => table.exportTable()}>Table hook</button>
      <button onClick={() => exportWorkbook({ sheets: [{ ...people, name: sanitizeSheetName("a/b") }] }).catch((e) => isExcelError(e))}>Workbook</button>
      <button onClick={() => Promise.all([exportDataset(people), exportTable(ref)])}>Both</button>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
