import type { ReactElement } from 'react';
import { useVersion } from 'react-data-export';

// Exported components need an explicit return type under isolatedDeclarations.
export function App(): ReactElement {
  const version = useVersion();
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>react-data-export 1.0 playground — in progress</h1>
      <p>
        Workspace package version: <code>{version}</code>
      </p>
    </main>
  );
}
