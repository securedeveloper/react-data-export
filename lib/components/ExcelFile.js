import React from "react";
import PropTypes from "prop-types";
import { saveAs } from "file-saver";
import XLSX from "xlsx";

import ExcelColumn from "../elements/ExcelColumn";
import ExcelSheet from "../elements/ExcelSheet";

/* tslint:disable */
function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);

    for (var i = 0; i != s.length; ++i) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }

    return buf;
}

function datenum(v, date1904) {
    if (date1904) {
        v += 1462;
    }

    var epoch = Date.parse(v);

    return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function sheetFromAOA(data) {
    var ws = {};
    var range = { s: { c: 10000000, r: 10000000 }, e: { c: 0, r: 0 } };

    for (var R = 0; R != data.length; ++R) {
        for (var C = 0; C != data[R].length; ++C) {
            if (range.s.r > R) {
                range.s.r = R;
            }

            if (range.s.c > C) {
                range.s.c = C;
            }

            if (range.e.r < R) {
                range.e.r = R;
            }

            if (range.e.c < C) {
                range.e.c = C;
            }

            var cell = { v: data[R][C] };
            if (cell.v === null) { continue; }

            var cellRef = XLSX.utils.encode_cell({ c: C, r: R });
            if (typeof cell.v === 'number') {
                cell.t = 'n';
            } else if (typeof cell.v === 'boolean') {
                cell.t = 'b';
            } else if (cell.v instanceof Date) {
                cell.t = 'n'; cell.z = XLSX.SSF._table[14];
                cell.v = datenum(cell.v);
            } else {
                cell.t = 's';
            }

            ws[cellRef] = cell;
        }
    }

    if (range.s.c < 10000000) {
        ws['!ref'] = XLSX.utils.encode_range(range);
    }

    return ws;
}
/* tslint:enable  */

class ExcelFile extends React.Component {
    static  props = {
        filename: PropTypes.string,
        element: PropTypes.any,
        children: function (props, propName, componentName) {
            React.Children.forEach(props[propName], child => {
                if (child.type !== ExcelSheet) {
                    throw new Error('<ExcelFile> can only have <ExcelSheet> as children. ');
                }
            });
        }
    };

    constructor(props) {
        super(props);

        this.handleDownload = this.download.bind(this);
        this.createSheetData = this.createSheetData.bind(this);
    }

    createSheetData(sheet) {
        const columns = sheet.props.children;
        const sheetData = [React.Children.map(columns, column => column.props.label)];
        const data = typeof (sheet.props.data) === 'function' ? sheet.props.data() : sheet.props.data;

        data.forEach(row => {
            const sheetRow = [];

            React.Children.forEach(columns, column => {
                const getValue = typeof (column.props.value) === 'function' ? column.props.value : row => row[column.props.value];
                sheetRow.push(getValue(row) || '');
            });

            sheetData.push(sheetRow);
        });

        return sheetData;
    }

    download() {
        const wb = {
            SheetNames: React.Children.map(this.props.children, sheet => sheet.props.name),
            Sheets: {}
        };

        React.Children.forEach(this.props.children, sheet => {
            wb.Sheets[sheet.props.name] = sheetFromAOA(this.createSheetData(sheet));
        });

        const wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'binary' });
        saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), this.props.filename);
    }

    render() {
        return (<span onClick={this.handleDownload}>{this.props.element}</span>);
    }
}

export default ExcelFile;
