import type { Style } from 'react-data-export';
import { convertLegacyStyle, type LegacyStyle } from 'react-data-export/legacy';

// A 0.x (xlsx-style) style object, as documented in the 0.6 README.
const header: LegacyStyle = {
  font: { sz: '14', bold: true, color: { rgb: 'FFFF0000' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF00' } },
  alignment: { horizontal: 'center', textRotation: 135 },
};

// { font: { size: 14, bold: true, color: { rgb: 'FFFF0000' } }, fill: { pattern: 'solid', … }, alignment: { horizontal: 'center', rotation: -45 } }
export const headerStyle: Style = convertLegacyStyle(header);
