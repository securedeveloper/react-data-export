import type { Style } from 'react-data-export';

/** A 0.x (xlsx-style) style object, as documented in the 0.6 README. */
export interface LegacyColor {
  auto?: number;
  rgb?: string;
  theme?: string | number;
  tint?: string | number;
  indexed?: number;
}
export interface LegacyBorderSide {
  style: string;
  color?: LegacyColor;
}
export interface LegacyStyle {
  fill?: { patternType?: string; fgColor?: LegacyColor; bgColor?: LegacyColor };
  font?: {
    name?: string;
    sz?: string | number;
    color?: LegacyColor;
    bold?: boolean;
    underline?: boolean;
    italic?: boolean;
    strike?: boolean;
    outline?: boolean;
    shadow?: boolean;
  };
  numFmt?: string;
  alignment?: { vertical?: string; horizontal?: string; wrapText?: boolean; readingOrder?: number; textRotation?: number };
  border?: { top?: LegacyBorderSide; bottom?: LegacyBorderSide; left?: LegacyBorderSide; right?: LegacyBorderSide; diagonal?: LegacyBorderSide; diagonalUp?: boolean; diagonalDown?: boolean };
}

type Font = NonNullable<Style['font']>;
type Color = NonNullable<Font['color']>;
type Alignment = NonNullable<Style['alignment']>;
type Border = NonNullable<Style['border']>;
type BorderSide = NonNullable<Border['top']>;

function color(c: LegacyColor | undefined): Color | undefined {
  if (!c) return undefined;
  if (c.rgb !== undefined) return { rgb: c.rgb };
  if (c.theme !== undefined) return { theme: Number(c.theme), ...(c.tint !== undefined ? { tint: Number(c.tint) } : {}) };
  if (c.indexed !== undefined) return { indexed: c.indexed };
  if (c.auto) return { auto: true };
  return undefined;
}

// 0.x: 0–90 up, 91–180 down (135 = 45° down), 255 = stacked. 1.0: -90..90, or 'vertical'.
function rotation(r: number | undefined): Alignment['rotation'] {
  if (r === undefined) return undefined;
  if (r === 255) return 'vertical';
  return r > 90 ? 90 - r : r;
}

const HORIZONTAL = ['general', 'left', 'center', 'right', 'fill', 'justify', 'centerContinuous', 'distributed'] as const;
const VERTICAL = ['top', 'center', 'bottom', 'justify', 'distributed'] as const;
const pick = <T extends string>(allowed: readonly T[], v: string | undefined): T | undefined =>
  allowed.find((a) => a === v);

function side(s: LegacyBorderSide | undefined): BorderSide | undefined {
  if (!s) return undefined;
  const c = color(s.color);
  return { style: s.style as BorderSide['style'], ...(c ? { color: c } : {}) };
}

/** Converts a 0.x cell style to a react-data-export 1.0 (javascript-excel) style. */
export function convertLegacyStyle(old: LegacyStyle): Style {
  const style: Style = {};
  if (old.font) {
    const { sz, color: c, name, bold, italic, underline, strike, outline, shadow } = old.font;
    const font: Font = { name, bold, italic, underline, strike, outline, shadow };
    if (sz !== undefined) font.size = Number(sz);
    if (c) font.color = color(c);
    style.font = font;
  }
  // A fill with a colour becomes a solid fill; 'none' or no colour means no fill.
  if (old.fill && old.fill.patternType !== 'none' && old.fill.fgColor) {
    const fg = color(old.fill.fgColor);
    const bg = color(old.fill.bgColor);
    style.fill = { pattern: 'solid', ...(fg ? { fgColor: fg } : {}), ...(bg ? { bgColor: bg } : {}) };
  }
  if (old.numFmt !== undefined) style.numFmt = old.numFmt;
  if (old.alignment) {
    const a = old.alignment;
    style.alignment = {
      horizontal: pick(HORIZONTAL, a.horizontal),
      vertical: pick(VERTICAL, a.vertical),
      wrapText: a.wrapText,
      rotation: rotation(a.textRotation),
      readingOrder: a.readingOrder === 2 ? 'rtl' : a.readingOrder === 1 ? 'ltr' : undefined,
    };
  }
  if (old.border) {
    const b = old.border;
    style.border = {
      top: side(b.top),
      bottom: side(b.bottom),
      left: side(b.left),
      right: side(b.right),
      diagonal: side(b.diagonal),
      diagonalUp: b.diagonalUp,
      diagonalDown: b.diagonalDown,
    };
  }
  return style;
}
