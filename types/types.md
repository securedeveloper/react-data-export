```javascript
/* index.d.ts (C) react-data- */

// TypeScript Version: 2.2

interface ExcelFileProps {
    filename?: string;
    fileExtension?: string;
    element?: any;
    children?: Array<ExcelSheetProps>;
}

interface ExcelSheetProps {
    name: string;
    data?: Array<object>;
    dataSet?: Array<ExcelSheetData>;
    value?: Array<string> | Function;
    children?: Array<ExcelColumnProps>
}

interface ExcelSheetData {
    xSteps?: number;
    ySteps?: number;
    columns: Array<string>;
    data: Array<ExcelCellData>;
}

type ExcelCellData = ExcelValue | ExcelCell;
type ExcelValue = string | number | Date | boolean;

interface ExcelCell {
    value: ExcelCell;
    style: ExcelStyle;
}

interface ExcelColumnProps {
    label: string;
    value: number | boolean | string | Function;
}

interface ExcelStyle {
    fill?: ExcelCellFillType;
    font?: ExcelFont;
    numFmt?: ExcelNumFormat;
    alignment?: ExcelAlignment;
    border?: ExcelBorder;
}

/* ExcelCell Fill Type */
type ExcelCellPatternType = "solid" | "none";

interface ExcelColorSpec {
    auto?: number; //default 1
    rgb?: string; //hex ARGB color
    theme?: ExcelTheme;
    indexed?: number;
}

interface ExcelTheme {
    theme: string;
    tint: string;
}

interface ExcelCellFillType {
    patternType?: ExcelCellPatternType;
    fgColor?: ExcelColorSpec;
    bgColor?: ExcelColorSpec;
}

/* Excel Font */
interface ExcelFont {
    name?: string;          // default `"Calibri"`
    sz?: number;             //font size in points default 11
    color?: ExcelColorSpec;
    bold?: boolean;
    underline?: boolean;
    italic?: boolean;
    strike?: boolean;
    outline?: boolean;
    shadow?: boolean;
    vertAlign?: boolean;
}

/* ExcelNumFormat */
type ExcelNumFormat = "0" | "0.00%" | "0.0%" | "0.00%;\\(0.00%\\);\\-;@" | "m/dd/yy" | string;

/* ExcelAlignment */
interface ExcelAlignment {
    vertical?: ExcelAlignmentType;
    horizontal?: ExcelAlignmentType;
    wrapText?: boolean;
    readingOrder?: ExcelReadingOrder;
    textRotation?: ExcelTextRotation;
}

type ExcelTextRotation = 0 | 45 | 90 | 135 | 180 | 255;

enum ExcelReadingOrder { LeftToRight = 1, RightToLeft}

type ExcelAlignmentType = "bottom" | "center" | "top";

/* ExcelBorder */
interface ExcelBorder {
    style: ExcelBorderStyle;
    color: ExcelColorSpec;
}

type ExcelBorderStyle = "thin" | "medium" | "thick" | "dotted" | "hair" | "dashed" | "mediumDashed" | "dashDot" | "mediumDashDot" | "dashDotDot" | "mediumDashDotDot" | "slantDashDot";
```
