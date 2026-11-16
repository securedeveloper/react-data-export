// useExcelExport (docs/api.md §5): the §4 functions plus React state, abort
// and unmount handling. Only hooks that exist in React 17.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DatasetOptions, Dataset, Progress } from 'javascript-excel';
import {
  exportDataset as exportDatasetFn,
  exportWorkbook as exportWorkbookFn,
  type ExportOptions,
  type ExportResult,
  type WorkbookSpec,
} from './export';

export type ExportStatus = 'idle' | 'exporting' | 'done' | 'error';

export interface UseExcelExport {
  exportDataset<T>(dataset: Dataset<T>, options?: ExportOptions & DatasetOptions<T>): Promise<ExportResult>;
  exportWorkbook(spec: WorkbookSpec, options?: ExportOptions): Promise<ExportResult>;
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

interface State {
  status: ExportStatus;
  progress: Progress | null;
  error: unknown;
  result: ExportResult | null;
}

const INITIAL: State = { status: 'idle', progress: null, error: undefined, result: null };

export function useExcelExport(defaults?: ExportOptions): UseExcelExport {
  const [state, setState] = useState<State>(INITIAL);
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;
  const mounted = useRef(false);
  const controllers = useRef(new Set<AbortController>());
  const running = useRef(0);
  const latestId = useRef(0);
  // Outcome of the most recently started export: decides the final status.
  const latestOutcome = useRef<ExportStatus>('idle');

  useEffect(() => {
    // Set in the effect (not at render), so StrictMode's extra
    // unmount/remount in development leaves exports started after the final
    // mount alone, and nothing updates state after a real unmount.
    mounted.current = true;
    const live = controllers.current;
    return () => {
      mounted.current = false;
      for (const c of live) c.abort();
      live.clear();
    };
  }, []);

  const run = useCallback(
    (perform: (options: ExportOptions) => Promise<ExportResult>, options: ExportOptions | undefined): Promise<ExportResult> => {
      const merged: ExportOptions = { ...defaultsRef.current, ...options };
      const controller = new AbortController();
      const external = merged.signal;
      if (external) {
        if (external.aborted) controller.abort(external.reason);
        else external.addEventListener('abort', () => controller.abort(external.reason), { once: true });
      }
      controllers.current.add(controller);
      running.current += 1;
      const id = ++latestId.current;
      latestOutcome.current = 'exporting';
      if (mounted.current) setState((s) => ({ ...s, status: 'exporting', error: undefined }));

      const userProgress = merged.onProgress;
      const onProgress = (p: Progress): void => {
        userProgress?.(p);
        if (mounted.current) setState((s) => ({ ...s, progress: p }));
      };

      const settle = (outcome: ExportStatus, patch: Partial<State>): void => {
        controllers.current.delete(controller);
        running.current -= 1;
        if (id === latestId.current) latestOutcome.current = outcome;
        if (!mounted.current) return;
        const idle = running.current === 0;
        setState((s) => ({
          ...s,
          ...patch,
          status: idle ? latestOutcome.current : 'exporting',
          progress: idle ? null : s.progress,
        }));
      };

      return perform({ ...merged, signal: controller.signal, onProgress }).then(
        (result) => {
          settle('done', { result });
          return result;
        },
        (err: unknown) => {
          if (controller.signal.aborted) settle('idle', {});
          else settle('error', { error: err });
          throw err;
        },
      );
    },
    [],
  );

  const exportDataset = useCallback(
    <T>(dataset: Dataset<T>, options?: ExportOptions & DatasetOptions<T>): Promise<ExportResult> =>
      run((merged) => exportDatasetFn(dataset, { ...options, ...merged }), options),
    [run],
  );

  const exportWorkbook = useCallback(
    (spec: WorkbookSpec, options?: ExportOptions): Promise<ExportResult> =>
      run((merged) => exportWorkbookFn(spec, merged), options),
    [run],
  );

  const abort = useCallback((reason?: unknown): void => {
    for (const c of controllers.current) c.abort(reason);
  }, []);

  return { exportDataset, exportWorkbook, abort, ...state };
}
