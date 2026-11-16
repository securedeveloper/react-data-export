// exportTable (docs/api.md §13): javascript-excel/dom's fromTable builds the
// sheet, then the same write/download path as exportDataset (§4).
import type { ExcelWarning } from 'javascript-excel';
import { fromTable, type FromTableOptions, type TableElement } from 'javascript-excel/dom';
import {
  collecting,
  formatOf,
  splitOptions,
  throwIfAborted,
  writeAndSave,
  type ExportOptions,
  type ExportResult,
} from './export';

/** Anything with a `current` table, e.g. the object from useRef<HTMLTableElement>(null). */
export interface TableRef {
  readonly current: TableElement | null;
}

export type TableTarget = TableElement | TableRef;

function isRef(target: TableTarget): target is TableRef {
  return typeof target === 'object' && target !== null && 'current' in target;
}

/** Internal: the element behind a target, read now. */
export function resolveTable(target: TableTarget | null | undefined): TableElement {
  const el = target != null && isRef(target) ? target.current : target;
  if (el == null) {
    throw new TypeError('react-data-export: no table to export (the ref is empty: not rendered yet, or unmounted)');
  }
  return el;
}

/** Reads an HTML table with fromTable and exports it as .xlsx or .csv. */
export async function exportTable(
  table: TableTarget,
  options: ExportOptions & FromTableOptions = {},
): Promise<ExportResult> {
  const { exportOptions, rest } = splitOptions(options);
  const format = formatOf(exportOptions);
  throwIfAborted(exportOptions.signal);
  const el = resolveTable(table);
  const warnings: ExcelWarning[] = [];
  const sheet = fromTable(el, { ...rest, onWarning: collecting(warnings, rest.onWarning) });
  return writeAndSave([sheet], undefined, warnings, exportOptions, format);
}
