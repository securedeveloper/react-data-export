// react-data-export 0.6.0 (the current `latest` on npm), the same one-sheet export.
import { createRoot } from "react-dom/client";
import ReactExport from "react-data-export-0.6";

const { ExcelFile } = ReactExport;
const { ExcelSheet, ExcelColumn } = ExcelFile;

createRoot(document.getElementById("root")).render(
  <ExcelFile filename="people" element={<button>Export</button>}>
    <ExcelSheet data={[{ name: "Ada" }]} name="People">
      <ExcelColumn label="Name" value="name" />
    </ExcelSheet>
  </ExcelFile>,
);
