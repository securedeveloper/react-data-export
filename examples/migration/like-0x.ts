import { exportDataset, type Dataset } from 'react-data-export';

interface Row {
  name: string;
  joined: Date;
}

// Options that bring 1.0's output closer to what 0.x wrote, where it differs.
export async function exportLike0x(rows: Row[]): Promise<void> {
  const dataset: Dataset<Row> = {
    columns: [
      // dataSet columns given as objects got 80 px unless they had a width
      { title: 'Name', key: 'name', width: { wpx: 80 } },
      { title: 'Joined', key: 'joined', width: { wpx: 80 } },
    ],
    data: rows,
  };
  await exportDataset(dataset, {
    filename: 'Download', // the 0.x default name
    headerStyle: {}, // <ExcelColumn> headers were not bold (dataSet headers were: leave this out)
    write: { dateZone: 'utc' }, // 0.x wrote dates as UTC times
  });
}
