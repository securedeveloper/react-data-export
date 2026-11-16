// <ExcelExport> (docs/api.md §6). Written with createElement rather than JSX:
// JSX compiles to an import of 'react/jsx-runtime', which plain Node ESM
// can't resolve with React 17 (it has no exports map).
import { createElement, Fragment, useCallback, useRef, type ReactElement, type ReactNode } from 'react';
import type { Dataset, DatasetOptions, Progress } from 'javascript-excel';
import type { ExportOptions, ExportResult, WorkbookSpec } from './export';
import { useExcelExport, type ExportStatus } from './use-excel-export';

export interface ExcelExportRenderApi {
  /** Exports with the current props. Resolves with the result, or undefined after an error or abort; never rejects. */
  run(): Promise<ExportResult | undefined>;
  status: ExportStatus;
  progress: Progress | null;
}

export type ExcelExportProps = ExportOptions & {
  /** What to export: one dataset (with its sheet options) or a workbook. Exactly one. */
  dataset?: (Dataset<any> & DatasetOptions<any>) | undefined;
  workbook?: WorkbookSpec | undefined;
  onExported?: ((result: ExportResult) => void) | undefined;
  onError?: ((error: unknown) => void) | undefined;
  /**
   * Render prop, or the default button's label. Without children a
   * <button type="button"> labelled "Export" is rendered, disabled while exporting.
   */
  children?: ReactNode | ((api: ExcelExportRenderApi) => ReactNode) | undefined;
};

const MISUSE = '<ExcelExport> needs exactly one of `dataset` or `workbook`';

function isAbort(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { name?: unknown }).name === 'AbortError';
}

/**
 * Internal (shared with <ExportTableButton>): runs an export for a trigger.
 * Resolves with the result, or undefined after an error or abort; never
 * rejects. Errors go to onError, else console.error; aborts are not reported.
 */
export async function runForTrigger(
  perform: () => Promise<ExportResult>,
  onExported: ((result: ExportResult) => void) | undefined,
  onError: ((error: unknown) => void) | undefined,
): Promise<ExportResult | undefined> {
  try {
    const result = await perform();
    onExported?.(result);
    return result;
  } catch (err) {
    if (!isAbort(err)) {
      if (onError) onError(err);
      else console.error(err);
    }
    return undefined;
  }
}

/** Internal (shared with <ExportTableButton>): the default button or the render prop. */
export function renderTrigger(
  children: ReactNode | ((api: ExcelExportRenderApi) => ReactNode) | undefined,
  api: ExcelExportRenderApi,
): ReactElement {
  const content: ReactNode =
    typeof children === 'function'
      ? children(api)
      : createElement(
          'button',
          { type: 'button', disabled: api.status === 'exporting', onClick: () => void api.run() },
          children ?? 'Export',
        );
  return createElement(Fragment, null, content);
}

function isDev(): boolean {
  return typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production';
}

export function ExcelExport(props: ExcelExportProps): ReactElement {
  const { exportDataset, exportWorkbook, status, progress } = useExcelExport();
  // The data props are read when an export starts, not when it was rendered.
  const latest = useRef(props);
  latest.current = props;

  if ((props.dataset === undefined) === (props.workbook === undefined) && isDev()) {
    console.error(`react-data-export: ${MISUSE}.`);
  }

  const run = useCallback((): Promise<ExportResult | undefined> => {
    const { dataset, workbook, onExported, onError, children: _children, ...options } = latest.current;
    return runForTrigger(
      async () => {
        if (dataset !== undefined && workbook === undefined) {
          const { columns, data, ...sheetOptions } = dataset;
          return exportDataset({ columns, data }, { ...options, ...sheetOptions });
        }
        if (workbook !== undefined && dataset === undefined) return exportWorkbook(workbook, options);
        throw new TypeError(`react-data-export: ${MISUSE}`);
      },
      onExported,
      onError,
    );
  }, [exportDataset, exportWorkbook]);

  return renderTrigger(props.children, { run, status, progress });
}
