// A server component. <ExcelExport> comes from a package whose entry starts
// with "use client", so the server sees a client reference and renders it
// without running its hooks; without the directive this page fails to build.
import { ExcelExport } from "react-data-export";
import HookButton from "./hook-button";
import TableExport from "./table-export";

const dataset = {
  columns: [{ title: "Name", key: "name" }, { title: "Total", key: "total", numFmt: "#,##0.00" }],
  data: [{ name: "Ada", total: 1250.5 }],
};

export default function Page() {
  return (
    <main>
      <h1>Server-rendered page</h1>
      <ExcelExport dataset={dataset} filename="from-server-page" />
      <HookButton />
      <TableExport />
    </main>
  );
}
