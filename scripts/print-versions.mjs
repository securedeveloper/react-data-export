// Prints the React / Testing Library versions the library's tests actually resolve.
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const req = createRequire(join(resolve(import.meta.dirname, '../packages/react-data-export'), 'noop.js'));
for (const name of ['react', 'react-dom', '@testing-library/react', '@types/react']) {
  console.log(`${name}@${req(`${name}/package.json`).version}`);
}
