// A generated sheet -> a grid for the HTML preview, with merges as row/col spans.
// Pure and unit-tested; the React component only maps it to elements.
import { cellText, decodeRange, type Cell, type CellInput, type Sheet, type Style } from "javascript-excel";

export interface PreviewCell {
  text: string;
  colSpan: number;
  rowSpan: number;
  bold: boolean;
  /** CSS colour of a solid fill, e.g. "#DDEBF7". */
  background: string | undefined;
  align: "left" | "right" | "center" | undefined;
  /** Number format or formula, for the tooltip. */
  title: string | undefined;
}

export interface Preview {
  columns: number;
  rows: Array<Array<PreviewCell | null>>; // null: covered by a merge
  frozenRows: number;
  truncated: boolean;
}

const isCell = (c: CellInput): c is Cell => typeof c === "object" && c !== null && !(c instanceof Date) && !("error" in c) && !("richText" in c);

function fillColor(style: Style | undefined): string | undefined {
  const fill = style?.fill;
  if (typeof fill === "string") return `#${fill.replace(/^#/, "").slice(-6)}`;
  if (fill && "pattern" in fill && fill.pattern === "solid" && typeof fill.fgColor === "string") return `#${fill.fgColor.replace(/^#/, "").slice(-6)}`;
  if (fill && "pattern" in fill && fill.pattern === "solid" && fill.fgColor && typeof fill.fgColor === "object" && "rgb" in fill.fgColor) return `#${fill.fgColor.rgb.slice(-6)}`;
  return undefined;
}

export function previewOf(sheet: Sheet, maxRows = 200): Preview {
  const rows = sheet.rows.slice(0, maxRows);
  const columns = Math.max(0, ...rows.map((r) => r?.length ?? 0));
  const out: Array<Array<PreviewCell | null>> = rows.map((row) =>
    Array.from({ length: columns }, (_, c) => {
      const input = row?.[c];
      const cell = isCell(input) ? input : undefined;
      const value = cell ? cell.value : input;
      const text = value === undefined || value === null ? "" : cellText(cell ?? { value: value as never });
      const style = cell?.style;
      const numeric = typeof value === "number" || value instanceof Date;
      const align = style?.alignment?.horizontal;
      return {
        text,
        colSpan: 1,
        rowSpan: 1,
        bold: style?.font?.bold === true,
        background: fillColor(style),
        align: align === "left" || align === "right" || align === "center" ? align : numeric ? "right" : undefined,
        title: cell?.formula ? `=${cell.formula}` : style?.numFmt !== undefined ? `Number format: ${String(style.numFmt)}` : undefined,
      };
    }),
  );
  for (const ref of sheet.merges ?? []) {
    const { start, end } = decodeRange(ref);
    const anchor = out[start.row]?.[start.col];
    if (!anchor) continue;
    anchor.rowSpan = end.row - start.row + 1;
    anchor.colSpan = end.col - start.col + 1;
    for (let r = start.row; r <= end.row; r++) {
      for (let c = start.col; c <= end.col; c++) if ((r !== start.row || c !== start.col) && out[r]) out[r]![c] = null;
    }
  }
  return { columns, rows: out, frozenRows: sheet.view?.freeze?.rows ?? 0, truncated: sheet.rows.length > maxRows };
}
