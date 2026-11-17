// The smallest dataset export: one exportDataset call behind a button.
import { createRoot } from "react-dom/client";
import { exportDataset } from "react-data-export";

const people = { columns: [{ title: "Name", key: "name" }], data: [{ name: "Ada" }] };

createRoot(document.getElementById("root")).render(<button onClick={() => exportDataset(people, { filename: "people" })}>Export</button>);
