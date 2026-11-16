// useExcelExport and <ExcelExport>, on React 17, 18 and 19 (CI matrix).
// Only APIs that exist in Testing Library 12 (React 17) are used.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode, useEffect, useRef, version as reactVersion } from 'react';
import { version as reactDomVersion } from 'react-dom';
import { download } from 'javascript-excel/dom';
import pkg from '../package.json';
import { ExcelExport, useExcelExport, version, type ExportResult, type UseExcelExport } from '../src/index';

vi.mock('javascript-excel/dom', () => ({ download: vi.fn() }));
const downloadMock = vi.mocked(download);

const people = {
  columns: [{ title: 'Name', key: 'name' }],
  data: [{ name: 'Ada' }, { name: 'Alan' }],
};

beforeEach(() => downloadMock.mockClear());

/** Renders the hook and exposes it through a ref. */
function HookProbe({ api, defaults }: { api: { current: UseExcelExport | null }; defaults?: Parameters<typeof useExcelExport>[0] }) {
  const hook = useExcelExport(defaults);
  api.current = hook;
  return (
    <output data-testid="state">
      {hook.status}|{hook.result ? hook.result.filename : '-'}|{hook.error ? String((hook.error as Error).message) : '-'}
    </output>
  );
}

function stateText(): string {
  return screen.getByTestId('state').textContent ?? '';
}

describe('version', () => {
  it('matches package.json', () => {
    expect(version).toBe(pkg.version);
  });

  // Guards the CI matrix: fails if the job did not really install the React major it claims.
  it.runIf(process.env['REACT_MAJOR'])('runs against the expected React major', () => {
    expect(reactVersion.split('.')[0]).toBe(process.env['REACT_MAJOR']);
    expect(reactDomVersion).toBe(reactVersion);
  });
});

describe('useExcelExport', () => {
  it('idle -> exporting -> done, with the result', async () => {
    const api: { current: UseExcelExport | null } = { current: null };
    render(<HookProbe api={api} />);
    expect(stateText()).toBe('idle|-|-');
    let pending!: Promise<ExportResult>;
    act(() => {
      pending = api.current!.exportDataset(people, { filename: 'people' });
    });
    expect(stateText()).toBe('exporting|-|-');
    await act(async () => {
      await pending;
    });
    expect(stateText()).toBe('done|people.xlsx|-');
    expect(downloadMock).toHaveBeenCalledTimes(1);
  });

  it('returns the same promise result as the plain function and merges defaults under call options', async () => {
    const api: { current: UseExcelExport | null } = { current: null };
    render(<HookProbe api={api} defaults={{ filename: 'default-name', download: false }} />);
    let result!: ExportResult;
    await act(async () => {
      result = await api.current!.exportDataset(people);
    });
    expect(result.filename).toBe('default-name.xlsx');
    expect(downloadMock).not.toHaveBeenCalled();
    await act(async () => {
      result = await api.current!.exportDataset(people, { filename: 'override' });
    });
    expect(result.filename).toBe('override.xlsx');
  });

  it('keeps stable function identities across renders', async () => {
    const api: { current: UseExcelExport | null } = { current: null };
    const { rerender } = render(<HookProbe api={api} />);
    const first = api.current!;
    await act(async () => {
      await api.current!.exportDataset(people, { download: false });
    });
    rerender(<HookProbe api={api} />);
    expect(api.current!.exportDataset).toBe(first.exportDataset);
    expect(api.current!.exportWorkbook).toBe(first.exportWorkbook);
    expect(api.current!.abort).toBe(first.abort);
  });

  it('a failure sets status error and error; the next export clears it', async () => {
    const api: { current: UseExcelExport | null } = { current: null };
    render(<HookProbe api={api} />);
    await act(async () => {
      await api.current!.exportDataset(people, { name: 'bad/name' }).catch(() => undefined);
    });
    expect(stateText()).toMatch(/^error\|-\|.+/);
    await act(async () => {
      await api.current!.exportDataset(people, { download: false });
    });
    expect(stateText()).toBe('done|export.xlsx|-');
  });

  it('abort() rejects with AbortError, is not an error, and returns to idle', async () => {
    const api: { current: UseExcelExport | null } = { current: null };
    render(<HookProbe api={api} />);
    let pending!: Promise<ExportResult>;
    act(() => {
      pending = api.current!.exportDataset(people);
      api.current!.abort();
    });
    await act(async () => {
      await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    });
    expect(stateText()).toBe('idle|-|-');
    expect(downloadMock).not.toHaveBeenCalled();
  });

  it('an external signal aborts the export too', async () => {
    const api: { current: UseExcelExport | null } = { current: null };
    render(<HookProbe api={api} />);
    const controller = new AbortController();
    let pending!: Promise<ExportResult>;
    act(() => {
      pending = api.current!.exportDataset(people, { signal: controller.signal });
      controller.abort(new Error('external'));
    });
    await act(async () => {
      await expect(pending).rejects.toThrow('external');
    });
    expect(stateText()).toBe('idle|-|-');
  });

  it('unmounting aborts running exports and updates no state', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const api: { current: UseExcelExport | null } = { current: null };
    const { unmount } = render(<HookProbe api={api} />);
    let pending!: Promise<ExportResult>;
    act(() => {
      pending = api.current!.exportDataset(people);
    });
    unmount();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(downloadMock).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled(); // React 17 would warn about a state update after unmount
    errors.mockRestore();
  });

  it('StrictMode: an export started on mount survives the development remount (one download)', async () => {
    const results: string[] = [];
    function AutoExport() {
      const { exportDataset, status } = useExcelExport();
      useEffect(() => {
        exportDataset(people, { filename: 'auto' }).then(
          (r) => results.push(r.filename),
          () => undefined, // StrictMode's simulated unmount aborts the first run
        );
      }, [exportDataset]);
      return <output data-testid="auto">{status}</output>;
    }
    render(
      <StrictMode>
        <AutoExport />
      </StrictMode>,
    );
    await waitFor(() => expect(screen.getByTestId('auto').textContent).toBe('done'));
    expect(results).toEqual(['auto.xlsx']);
    expect(downloadMock).toHaveBeenCalledTimes(1);
  });

  it('exportWorkbook through the hook', async () => {
    const api: { current: UseExcelExport | null } = { current: null };
    render(<HookProbe api={api} />);
    let result!: ExportResult;
    await act(async () => {
      result = await api.current!.exportWorkbook({ sheets: [{ ...people, name: 'A' }, false, { ...people, name: 'B' }] }, { filename: 'book', download: false });
    });
    expect(result.filename).toBe('book.xlsx');
  });
});

describe('<ExcelExport>', () => {
  it('renders a default "Export" button that exports the dataset', async () => {
    const onExported = vi.fn();
    render(<ExcelExport dataset={{ ...people, name: 'People' }} filename="people" onExported={onExported} />);
    const button = screen.getByRole('button', { name: 'Export' });
    expect(button.getAttribute('type')).toBe('button');
    fireEvent.click(button);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await waitFor(() => expect(onExported).toHaveBeenCalledTimes(1));
    expect((onExported.mock.calls[0]![0] as ExportResult).filename).toBe('people.xlsx');
    expect(downloadMock).toHaveBeenCalledTimes(1);
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it('uses a string child as the button label', () => {
    render(<ExcelExport dataset={people}>Download people.xlsx</ExcelExport>);
    expect(screen.getByRole('button', { name: 'Download people.xlsx' })).toBeTruthy();
  });

  it('render prop: run() resolves with the result and the status is passed through', async () => {
    let run!: () => Promise<ExportResult | undefined>;
    render(
      <ExcelExport workbook={{ sheets: [people] }} filename="book" download={false}>
        {(api) => {
          run = api.run;
          return <span data-testid="rp">{api.status}</span>;
        }}
      </ExcelExport>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    let result: ExportResult | undefined;
    await act(async () => {
      result = await run();
    });
    expect(result?.filename).toBe('book.xlsx');
    expect(screen.getByTestId('rp').textContent).toBe('done');
  });

  it('run() never rejects: errors go to onError and it resolves undefined', async () => {
    const onError = vi.fn();
    let run!: () => Promise<ExportResult | undefined>;
    render(
      <ExcelExport dataset={{ ...people, name: 'bad/name' }} onError={onError}>
        {(api) => {
          run = api.run;
          return null;
        }}
      </ExcelExport>,
    );
    let result: ExportResult | undefined = { filename: 'x' } as ExportResult;
    await act(async () => {
      result = await run();
    });
    expect(result).toBeUndefined();
    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0]![0] as { code: string }).code).toBe('INVALID_SHEET_NAME');
  });

  it('without onError, errors are logged with console.error', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<ExcelExport dataset={{ ...people, name: 'bad/name' }} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(errors).toHaveBeenCalled());
    errors.mockRestore();
  });

  it('both dataset and workbook (or neither): console.error at render, TypeError on run', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onError = vi.fn();
    render(<ExcelExport dataset={people} workbook={{ sheets: [people] }} onError={onError} />);
    expect(errors.mock.calls.some((c) => String(c[0]).includes('exactly one of `dataset` or `workbook`'))).toBe(true);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0]![0]).toBeInstanceOf(TypeError);
    expect(downloadMock).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('reads the data props when the export starts', async () => {
    const onExported = vi.fn();
    function Host() {
      const renders = useRef(0);
      renders.current += 1;
      return <ExcelExport dataset={people} filename={`v${renders.current}`} onExported={onExported} download={false} />;
    }
    const { rerender } = render(<Host />);
    rerender(<Host />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onExported).toHaveBeenCalledTimes(1));
    expect((onExported.mock.calls[0]![0] as ExportResult).filename).toBe('v2.xlsx');
  });
});
