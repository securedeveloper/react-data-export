import { useDebugValue } from 'react';

/** The published version of react-data-export. */
export const version = '1.0.0-alpha.0';

/**
 * Placeholder hook so the React toolchain (peer resolution, tests across
 * React 17/18/19, typings) is exercised before any real API exists.
 * It only returns the package version; it does not export anything.
 */
export function useVersion(): string {
  useDebugValue(version);
  return version;
}

// RDE-1.9: dataset export lands here
