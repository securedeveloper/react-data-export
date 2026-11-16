// Regenerates packages/react-data-export/test/legacy/goldens-0.6.json from the
// real react-data-export@0.6.0, so the react-data-export/legacy tests compare
// against what 0.6 actually built, not against a reading of its source.
//
//   mkdir -p /some/dir && cd /some/dir
//   npm install --ignore-scripts react-data-export@0.6.0 react@16.14.0 react-dom@16.14.0 prop-types@15
//   node scripts/legacy-goldens.mjs --pkg /some/dir
//
// For each scenario in test/legacy/scenarios.mjs it runs 0.6's own sheet
// building (ExcelFile#createSheetData + excelSheetFromAoA, or
// excelSheetFromDataSet), exactly as ExcelFile#download did before handing the
// workbook to tempa-xlsx, plus 0.6's file name logic. Nothing is downloaded.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const pkgDir = resolve(args[args.indexOf('--pkg') + 1] ?? '');
const root = resolve(import.meta.dirname, '..');
const out = join(root, 'packages/react-data-export/test/legacy/goldens-0.6.json');

const req = createRequire(join(pkgDir, 'noop.js'));
const React = req('react');
const version = req('react-data-export/package.json').version;
if (version !== '0.6.0') throw new Error(`expected react-data-export@0.6.0 in ${pkgDir}, found ${version}`);
const ExcelFile = req('react-data-export/dist/ExcelPlugin/components/ExcelFile').default;
const ExcelSheet = req('react-data-export/dist/ExcelPlugin/elements/ExcelSheet').default;
const ExcelColumn = req('react-data-export/dist/ExcelPlugin/elements/ExcelColumn').default;
const { excelSheetFromAoA, excelSheetFromDataSet } = req('react-data-export/dist/ExcelPlugin/utils/DataUtil');

const { scenarios } = await import(pathToFileURL(join(root, 'packages/react-data-export/test/legacy/scenarios.mjs')).href);

function normalizeSheet(ws) {
  const cells = {};
  for (const [ref, cell] of Object.entries(ws)) {
    if (ref.startsWith('!')) continue;
    cells[ref] = { t: cell.t, v: cell.v === undefined ? null : cell.v, ...(cell.s ? { s: cell.s } : {}), ...(cell.z !== undefined ? { z: cell.z } : {}) };
  }
  return { ref: ws['!ref'] ?? null, cols: ws['!cols'] ?? null, cells };
}

const goldens = {};
for (const { name, element } of scenarios(React, { ExcelFile, ExcelSheet, ExcelColumn })) {
  const props = { ...ExcelFile.defaultProps, ...element.props };
  const file = new ExcelFile(props); // hideElement is false in every scenario: nothing runs here
  const sheets = [];
  React.Children.forEach(props.children, (sheet) => {
    const ds = sheet.props.dataSet;
    const ws = typeof ds === 'undefined' || ds.length === 0 ? excelSheetFromAoA(file.createSheetData(sheet)) : excelSheetFromDataSet(ds);
    sheets.push({ name: sheet.props.name, ...normalizeSheet(ws) });
  });
  goldens[name] = { fileName: file.getFileName(), fileExtension: file.getFileExtension(), sheets };
}

writeFileSync(out, `${JSON.stringify({ generatedFrom: `react-data-export@${version}`, goldens }, null, 2)}\n`);
console.log(`wrote ${Object.keys(goldens).length} scenarios to ${out}`);
