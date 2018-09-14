# React-Data-Export

##### :warning: A complete re-write is coming soon (we won't need xlsx package anymore (It will be backward compatible):warning: 

## :new: I am re-writing complete excel api in JavaScript, please consider contributing or putting your ideas here https://github.com/securedeveloper/javascript-excel (After finishing will update this library)
(:exclamation::exclamation::exclamation:The purpose of having a new library is that open source libraries either does not support styling and rest functionality in excel or they are too heavy to  consider)

[![npm version](https://badge.fury.io/js/react-data-export.svg)](https://badge.fury.io/js/react-data-export)
[![dependencies Status](https://david-dm.org/securedeveloper/react-data-export/status.svg)](https://david-dm.org/securedeveloper/react-data-export)
[![devDependencies Status](https://david-dm.org/securedeveloper/react-data-export/dev-status.svg)](https://david-dm.org/securedeveloper/react-data-export?type=dev)
[![Build Status](https://travis-ci.org/securedeveloper/react-data-export.svg?branch=master)](https://travis-ci.org/securedeveloper/react-data-export)
[![Vulnerabilities](https://snyk.io/test/github/securedeveloper/react-data-export/badge.svg)](https://snyk.io/test/github/securedeveloper/react-data-export)
[![Coverage Status](https://coveralls.io/repos/github/securedeveloper/react-data-export/badge.svg?branch=master)](https://coveralls.io/github/securedeveloper/react-data-export?branch=master)


A data export library built with and for [React](http://facebook.github.io/react/index.html). 

## Installation

With [npm](https://www.npmjs.org/package/react-data-export):

```sh
npm install react-data-export --save
```

## Code Examples
* [Simple Excel Export](examples/simple_excel_export_01.md)
* [Excel Export with Dataset](examples/simple_excel_export_02.md)
* [Excel Export with Custom Download Button](examples/with_custom_download_element.md)
* [Excel Export with custom cells style](examples/styled_excel_sheet.md)

## Excel Props
| Prop          | Type                 | Default    | Required | Description                      
| :------------ | :------------------- | :--------- | :------- | :-------------------------------------------------
| hideElement	| `bool`			   | false      | `false`  | To hide the button & directly download excel file
| filename      | `string`             | Download   | `false`  | Excel file name to be downloaded 
| fileExtension | `string`             | xlsx       | `false`  | Download file extension [xlsx]
| element       | `HTMLElement`        | `<button>` | `false`  | Element to download excel file
| children      | `Array<ExcelSheet>`  |  `null`    | `true`   | ExcelSheet Represents data

### ExcelSheet Props
| Prop          | Type                    | Default    | Required | Description                      
| :------------ | :---------------------- | :--------- | :------- | :------------------------------- 
| name          | `string`                | `""`       | `true`   | Sheet name in file 
| data          | `array<object>`         | `null`     | `false`  | Excel Sheet data 
| dataSet       | `array<ExcelSheetData>` | `null`     | `false`  | Excel Sheet data
| children      | `ExcelColumn`           |  `null`    | `false`  | ExcelColumns

**Note:** In ExcelSheet props `dataSet` has `precedence` over `data` and `children` props.

For further types and definitions [Read More](types/types.md)

## Cell Style

Cell styles are specified by a style object that roughly parallels the OpenXML structure.  The style object has five
top-level attributes: `fill`, `font`, `numFmt`, `alignment`, and `border`.

| Style Attribute | Sub Attributes | Values |
| :-------------- | :------------- | :------------- |
| fill            | patternType    |  `"solid"` or `"none"`
|                 | fgColor        |  `COLOR_SPEC`
|                 | bgColor        |  `COLOR_SPEC`
| font            | name           |  `"Calibri"` // default
|                 | sz             |  `"11"` // font size in points
|                 | color          |  `COLOR_SPEC`
|                 | bold           |  `true` or `false`
|                 | underline      |  `true` or `false`
|                 | italic         |  `true` or `false`
|                 | strike         |  `true` or `false`
|                 | outline        |  `true` or `false`
|                 | shadow         |  `true` or `false`
|                 | vertAlign      |  `true` or `false`
| numFmt          |                |  `"0"`  // integer index to built in formats, see StyleBuilder.SSF property
|                 |                |  `"0.00%"` // string matching a built-in format, see StyleBuilder.SSF
|                 |                |  `"0.0%"`  // string specifying a custom format
|                 |                |  `"0.00%;\\(0.00%\\);\\-;@"` // string specifying a custom format, escaping special characters
|                 |                |  `"m/dd/yy"` // string a date format using Excel's format notation
| alignment       | vertical       | `"bottom"` or `"center"` or `"top"`
|                 | horizontal     | `"bottom"` or `"center"` or `"top"`
|                 | wrapText       |  `true ` or ` false`
|                 | readingOrder   |  `2` // for right-to-left
|                 | textRotation   | Number from `0` to `180` or `255` (default is `0`)
|                 |                |  `90` is rotated up 90 degrees
|                 |                |  `45` is rotated up 45 degrees
|                 |                | `135` is rotated down 45 degrees
|                 |                | `180` is rotated down 180 degrees
|                 |                | `255` is special,  aligned vertically
| border          | top            | `{ style: BORDER_STYLE, color: COLOR_SPEC }`
|                 | bottom         | `{ style: BORDER_STYLE, color: COLOR_SPEC }`
|                 | left           | `{ style: BORDER_STYLE, color: COLOR_SPEC }`
|                 | right          | `{ style: BORDER_STYLE, color: COLOR_SPEC }`
|                 | diagonal       | `{ style: BORDER_STYLE, color: COLOR_SPEC }`
|                 | diagonalUp     | `true` or `false`
|                 | diagonalDown   | `true` or `false`

**COLOR_SPEC**: Colors for `fill`, `font`, and `border` are specified as objects, either:
* `{ auto: 1}` specifying automatic values
* `{ rgb: "FFFFAA00" }` specifying a hex ARGB value
* `{ theme: "1", tint: "-0.25"}` specifying an integer index to a theme color and a tint value (default 0)
* `{ indexed: 64}` default value for `fill.bgColor`

**BORDER_STYLE**: Border style is a string value which may take on one of the following values:
 * `thin`
 * `medium`
 * `thick`
 * `dotted`
 * `hair`
 * `dashed`
 * `mediumDashed`
 * `dashDot`
 * `mediumDashDot`
 * `dashDotDot`
 * `mediumDashDotDot`
 * `slantDashDot`


Borders for merged areas are specified for each cell within the merged area.  So to apply a box border to a merged area of 3x3 cells, border styles would need to be specified for eight different cells:
* left borders for the three cells on the left,
* right borders for the cells on the right
* top borders for the cells on the top
* bottom borders for the cells on the left


## Dependencies 
This library uses [file-saver](https://www.npmjs.com/package/file-saver) and [xlsx](https://www.npmjs.com/package/xlsx) and using [json-loader](https://www.npmjs.com/package/json-loader) will do the magic for you.


```javascript
///webpack.config.js
vendor: [
        .....
        'xlsx',
        'file-saver'
],
.....
node: {fs: 'empty'},
externals: [
    {'./cptable': 'var cptable'},
    {'./jszip': 'jszip'}
 ]
```

