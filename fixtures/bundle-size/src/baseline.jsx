// React alone: the app every other entry is measured against.
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")).render(<button onClick={() => console.log("export")}>Export</button>);
