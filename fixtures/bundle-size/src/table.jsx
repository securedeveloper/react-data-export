// Table export: <ExportTableButton> on a table ref.
import { useRef } from "react";
import { createRoot } from "react-dom/client";
import { ExportTableButton } from "react-data-export";

function App() {
  const ref = useRef(null);
  return (
    <>
      <table ref={ref}><tbody><tr><td>Ada</td></tr></tbody></table>
      <ExportTableButton tableRef={ref} filename="people">Export</ExportTableButton>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
