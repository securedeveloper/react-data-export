import { ExcelExport, type Dataset } from 'react-data-export';

// Rows are arrays, so each column takes the value at its position.
// A cell is a bare value or { value, style }; style keys are javascript-excel's.
const styles: Dataset<unknown[]> = {
  columns: [
    { title: 'Headings', width: { wpx: 80 } }, // pixels
    { title: 'Text Style', width: { wch: 40 } }, // characters
    { title: 'Colors', width: { wpx: 90 } },
  ],
  data: [
    [
      { value: 'H1', style: { font: { size: 24, bold: true } } },
      { value: 'Bold', style: { font: { bold: true } } },
      { value: 'Red', style: { fill: 'FF0000' } },
    ],
    [
      { value: 'H2', style: { font: { size: 18, bold: true } } },
      { value: 'underline', style: { font: { underline: true } } },
      { value: 'Blue', style: { fill: { pattern: 'solid', fgColor: { rgb: 'FF0000FF' } } } },
    ],
  ],
};

export function DownloadStyled() {
  return (
    <ExcelExport filename="Organization" dataset={{ ...styles, name: 'Organization' }}>
      Download Data With Styles
    </ExcelExport>
  );
}
