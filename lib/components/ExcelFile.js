import React from "react";
import PropTypes from "prop-types";
import {saveAs} from "file-saver";
import XLSX from "xlsx";

import ExcelSheet from "../elements/ExcelSheet";
import {strToArrBuffer, excelSheetFromAoA} from "../utils/DataUtil";

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

    static defaultProps = {
        filename: "Download.xlsx",
        element: <button>Download</button>
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
            wb.Sheets[sheet.props.name] = excelSheetFromAoA(this.createSheetData(sheet));
        });

        const wbout = XLSX.write(wb, {bookType: 'xlsx', bookSST: true, type: 'binary'});
        saveAs(new Blob([strToArrBuffer(wbout)], {type: "application/octet-stream"}), this.props.filename);
    }

    render() {
        return (<span onClick={this.handleDownload}>{this.props.element}</span>);
    }
}

export default ExcelFile;
