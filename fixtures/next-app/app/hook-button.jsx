"use client";
import { useExcelExport } from "react-data-export";

export default function HookButton() {
  const { exportDataset, status } = useExcelExport({ filename: "hook" });
  return (
    <button onClick={() => exportDataset({ columns: [{ title: "A", key: "a" }], data: [{ a: 1 }] })}>
      Hook export ({status})
    </button>
  );
}
