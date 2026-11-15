import { render, screen } from '@testing-library/react';
import { version as reactVersion } from 'react';
import { version as reactDomVersion } from 'react-dom';
import pkg from '../package.json';
import { useVersion, version } from '../src/index';

function Probe() {
  const v = useVersion();
  return <output data-testid="version">{v}</output>;
}

describe('react-data-export placeholder', () => {
  it('exports the package version', () => {
    expect(version).toBe(pkg.version);
  });

  it('useVersion renders inside a React tree', () => {
    render(<Probe />);
    expect(screen.getByTestId('version').textContent).toBe(pkg.version);
  });

  // Guards the CI matrix: fails if the job did not really install the React major it claims.
  it.runIf(process.env.REACT_MAJOR)('runs against the expected React major', () => {
    expect(reactVersion.split('.')[0]).toBe(process.env.REACT_MAJOR);
    expect(reactDomVersion).toBe(reactVersion);
  });
});
