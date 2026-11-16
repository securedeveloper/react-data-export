// The starting dataset of the editor. Plain JSON, so the editor shows what an app would pass.
import type { Dataset } from "react-data-export";

export const SAMPLE_DATASET: Dataset<unknown> = {
  columns: [
    { title: "Name", key: "name", width: "auto" },
    { title: "City", key: "city" },
    { title: "Joined", key: "joined", type: "date", numFmt: "yyyy-mm-dd" },
    {
      title: "Sales",
      children: [
        { title: "Q1", path: "sales.q1", numFmt: "#,##0.00", total: "sum" },
        { title: "Q2", path: "sales.q2", numFmt: "#,##0.00", total: "sum" },
      ],
    },
  ],
  data: [
    { name: "Ada Lovelace", city: "London", joined: "2024-01-15", sales: { q1: 1200.5, q2: 980 } },
    { name: "Alan Turing", city: "Manchester", joined: "2024-05-02", sales: { q1: 860, q2: 1430.25 } },
    { name: "Grace Hopper", city: "New York", joined: "2023-11-30", sales: { q1: 0, q2: 75.5 } },
  ],
};
