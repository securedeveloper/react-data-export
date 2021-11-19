declare module "react-data-export" {
  export interface ExcelFileProps {
    filename?: string;
    onFileGenerated?: () => void;
    onGenerationStart?: () => void;
    fileExtension?: string;
    element?: any;
    children?: any
  }

  export interface ExcelSheetProps {
    name: string;
    data?: () => any | any[];
    dataSet?: any;
    value?: string[] | Function;
    children?: any
  }

  export interface ExcelSheetData {
    xSteps?: number;
    ySteps?: number;
    columns: Array<string>;
    data: any
  }

  export type ExcelCellData = ExcelValue | ExcelCell;
  export type ExcelValue = string | number | Date | boolean;

  export interface ExcelCell {
    value: ExcelCell;
    style: ExcelStyle;
  }

  export interface ExcelColumnProps {
    label: string;
    value: number | boolean | string | Function;
  }

  export interface ExcelStyle {
    fill?: ExcelCellFillType;
    font?: ExcelFont;
    numFmt?: ExcelNumFormat;
    alignment?: ExcelAlignment;
    border?: ExcelBorder;
  }

  /* ExcelCell Fill Type */
  export type ExcelCellPatternType = "solid" | "none";

  export interface ExcelColorSpec {
    auto?: number; //default 1
    rgb?: string; //hex ARGB color
    theme?: ExcelTheme;
    indexed?: number;
  }

  export interface ExcelTheme {
    theme: string;
    tint: string;
  }

  export interface ExcelCellFillType {
    patternType?: ExcelCellPatternType;
    fgColor?: ExcelColorSpec;
    bgColor?: ExcelColorSpec;
  }

  /* Excel Font */
  export interface ExcelFont {
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
  export type ExcelNumFormat = "0" | "0.00%" | "0.0%" | "0.00%;\\(0.00%\\);\\-;@" | "m/dd/yy" | string;

  /* ExcelAlignment */
  export interface ExcelAlignment {
    vertical?: ExcelAlignmentType;
    horizontal?: ExcelAlignmentType;
    wrapText?: boolean;
    readingOrder?: ExcelReadingOrder;
    textRotation?: ExcelTextRotation;
  }

  export type ExcelTextRotation = 0 | 45 | 90 | 135 | 180 | 255;

  enum ExcelReadingOrder { LeftToRight = 1, RightToLeft }

  export type ExcelAlignmentType = "bottom" | "center" | "top";

  /* ExcelBorder */
  export interface ExcelBorder {
    style: ExcelBorderStyle;
    color: ExcelColorSpec;
  }

  export type ExcelBorderStyle = "thin" | "medium" | "thick" | "dotted" | "hair" | "dashed" | "mediumDashed" | "dashDot" | "mediumDashDot" | "dashDotDot" | "mediumDashDotDot" | "slantDashDot";

  declare class ExcelFile extends React.Component<ExcelFileProps> {
    static ExcelSheet: typeof ExcelSheet
    static ExcelColumn: typeof ExcelColumn
  }
  declare class ExcelSheet extends React.Component<ExcelSheetProps> { }
  declare class ExcelColumn extends React.Component<ExcelColumnProps> { }
}
