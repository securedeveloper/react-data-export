// Types for scenarios.mjs (plain JS so the 0.6 golden generator can import it too).
export interface Scenario {
  name: string;
  /** An <ExcelFile> element built with the components passed in. */
  element: { props: Record<string, unknown> };
}
export function scenarios(React: { createElement: (...args: any[]) => unknown }, components: { ExcelFile: unknown; ExcelSheet: unknown; ExcelColumn: unknown }): Scenario[];
