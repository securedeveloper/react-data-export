import { useEffect } from 'react';
import { useExcelExport, type Dataset } from 'react-data-export';

interface Row {
  name: string;
  amount: number;
}

// 0.x `hideElement`: download as soon as the component mounts, render nothing.
export function AutoDownload({ rows }: { rows: Row[] }) {
  const { exportDataset } = useExcelExport();
  useEffect(() => {
    const dataset: Dataset<Row> = {
      columns: [
        { title: 'Name', key: 'name' },
        { title: 'Amount', key: 'amount' },
      ],
      data: rows,
    };
    // Rejected with an AbortError if the component unmounts first
    // (StrictMode does that once in development, then runs the effect again).
    exportDataset(dataset, { filename: 'report' }).catch(() => {});
  }, [exportDataset, rows]);
  return null;
}
