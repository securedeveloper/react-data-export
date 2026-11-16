import { exportDataset, type Dataset } from 'react-data-export';

const people: Dataset<{ name: string; city: string }> = {
  columns: [
    { title: 'Name', key: 'name' },
    { title: 'City', key: 'city' },
  ],
  data: [{ name: 'Ada', city: 'London' }],
};

// fileExtension="xlsx" (the default) → format: 'xlsx' (the default). 'report' → report.xlsx.
export async function asXlsx(): Promise<void> {
  await exportDataset(people, { filename: 'report' });
}

// fileExtension="csv" → format: 'csv'. Real CSV text: UTF-8 with a BOM, formula-injection guard on.
export async function asCsv(): Promise<void> {
  await exportDataset(people, { filename: 'report', format: 'csv' });
}

// fileExtension="txt" has no format of its own: build tab-separated text, then save it under any name.
export async function asTabSeparatedTxt(): Promise<void> {
  const { blob } = await exportDataset(people, { format: 'csv', csv: { delimiter: '\t' }, download: false });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'report.txt';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
}
