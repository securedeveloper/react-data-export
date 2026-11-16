import ReactDOM from "react-dom";
import { ExcelExport, useExcelExport, type ExcelExportProps } from "react-data-export";

interface Row {
  name: string;
  total: number;
}

const dataset: NonNullable<ExcelExportProps["dataset"]> = {
  columns: [{ title: "Name", key: "name" }, { title: "Total", key: "total", numFmt: "#,##0.00" }],
  data: [{ name: "Ada", total: 1250.5 }] satisfies Row[],
};

function HookButton() {
  const { exportDataset, status } = useExcelExport({ filename: "hook" });
  return <button onClick={() => void exportDataset<Row>({ columns: dataset.columns, data: [{ name: "Grace", total: 980 }] })}>Hook export ({status})</button>;
}

ReactDOM.render(
  <>
    <ExcelExport dataset={dataset} filename="react17">
      {({ run, status }) => <button onClick={() => void run()}>Export ({status})</button>}
    </ExcelExport>
    <HookButton />
  </>,
  document.getElementById("root"),
);
