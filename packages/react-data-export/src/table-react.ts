// useTableExport and <ExportTableButton> (docs/api.md §13): the §5/§6 hook
// and trigger with a table ref instead of data. They share useExportRunner,
// runForTrigger and renderTrigger with the dataset module, so the behaviour
// (state, abort, unmount, run() contract) is the same by construction.
import { useCallback, useRef, type ReactElement, type ReactNode } from 'react';
import type { Progress } from 'javascript-excel';
import type { FromTableOptions } from 'javascript-excel/dom';
import type { ExportOptions, ExportResult } from './export';
import { renderTrigger, runForTrigger, type ExcelExportRenderApi } from './excel-export';
import { exportTable as exportTableFn, type TableRef } from './table';
import { useExportRunner, type ExportStatus } from './use-excel-export';

export interface UseTableExport {
  /** Exports the table the ref points to when it is called. */
  exportTable(options?: ExportOptions & FromTableOptions): Promise<ExportResult>;
  status: ExportStatus;
  /** Latest progress of the running export(s); null when idle. */
  progress: Progress | null;
  /** The error of the last failed export (aborts excluded); cleared when a new export starts. */
  error: unknown;
  /** The result of the last successful export. */
  result: ExportResult | null;
  /** Abort every running export started from this hook. */
  abort(reason?: unknown): void;
}

export function useTableExport(ref: TableRef, defaults?: ExportOptions & FromTableOptions): UseTableExport {
  const { run, ...rest } = useExportRunner(defaults);
  // The latest ref object; its `current` is read when an export starts.
  const refRef = useRef(ref);
  refRef.current = ref;

  const exportTable = useCallback(
    (options?: ExportOptions & FromTableOptions): Promise<ExportResult> =>
      // The runner merges the latest `defaults` under `options` (all keys, the
      // fromTable ones included) and adds its own signal and onProgress.
      run((merged) => exportTableFn(refRef.current, { ...options, ...merged }), options),
    [run],
  );

  return { exportTable, ...rest };
}

export type ExportTableButtonProps = ExportOptions &
  FromTableOptions & {
    /** The table to export, read when the export starts. */
    tableRef: TableRef;
    onExported?: ((result: ExportResult) => void) | undefined;
    onError?: ((error: unknown) => void) | undefined;
    /**
     * Render prop, or the default button's label. Without children a
     * <button type="button"> labelled "Export" is rendered, disabled while exporting.
     */
    children?: ReactNode | ((api: ExcelExportRenderApi) => ReactNode) | undefined;
  };

export function ExportTableButton(props: ExportTableButtonProps): ReactElement {
  const latest = useRef(props);
  latest.current = props;
  const { exportTable, status, progress } = useTableExport(props.tableRef);

  const run = useCallback((): Promise<ExportResult | undefined> => {
    const { tableRef: _ref, onExported, onError, children: _children, ...options } = latest.current;
    return runForTrigger(() => exportTable(options), onExported, onError);
  }, [exportTable]);

  return renderTrigger(props.children, { run, status, progress });
}
