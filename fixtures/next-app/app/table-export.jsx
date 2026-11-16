"use client";
// A client component holding the table ref: refs can't cross the server/client
// boundary, so the table and <ExportTableButton> live together here.
import { useRef } from "react";
import { ExportTableButton } from "react-data-export";

export default function TableExport() {
  const ref = useRef(null);
  return (
    <section>
      <table ref={ref}>
        <thead>
          <tr>
            <th rowSpan={2}>Name</th>
            <th colSpan={2}>Amount</th>
          </tr>
          <tr>
            <th>Net</th>
            <th>Gross</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ada</td>
            <td data-type="number" data-value="1250.5">1,250.50</td>
            <td data-type="number" data-value="1500.6">1,500.60</td>
          </tr>
        </tbody>
      </table>
      <ExportTableButton tableRef={ref} filename="table">Export table</ExportTableButton>
    </section>
  );
}
