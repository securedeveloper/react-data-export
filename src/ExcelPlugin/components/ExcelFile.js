import React from "react";
import PropTypes from "prop-types";
import {saveAs} from "file-saver";
import XLSX from "tempa-xlsx";

import ExcelSheet from "../elements/ExcelSheet";
import {strToArrBuffer, excelSheetFromAoA, excelSheetFromDataSet} from "../utils/DataUtil";

class ExcelFile extends React.Component {
    fileExtensions = ['xlsx', 'xls', 'csv', 'txt', 'html'];
    defaultFileExtension = 'xlsx';

    static  props = {
        hideElement: PropTypes.bool,
        filename: PropTypes.string,
        fileExtension: PropTypes.string,
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
        hideElement: false,
        filename: "Download",
        fileExtension: "xlsx",
        element: <button>Download</button>
    };

    constructor(props) {
        super(props);

        if (this.props.hideElement) {
            this.download();
        } else {
            this.handleDownload = this.download.bind(this);
        }

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
                const itemValue = getValue(row);
                sheetRow.push(isNaN(itemValue) ? (itemValue || '') : itemValue);
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
            if (typeof sheet.props.dataSet === 'undefined' || sheet.props.dataSet.length === 0) {
                wb.Sheets[sheet.props.name] = excelSheetFromAoA(this.createSheetData(sheet));
            } else {
                wb.Sheets[sheet.props.name] = excelSheetFromDataSet(sheet.props.dataSet);
            }
        });

        const fileExtension = this.getFileExtension();
        const fileName = this.getFileName();
        const wbout = XLSX.write(wb, {bookType: fileExtension, bookSST: true, type: 'binary'});

        saveAs(new Blob([strToArrBuffer(wbout)], {type: "application/octet-stream"}), fileName);
    }

    getFileName() {
        if (this.props.filename === null || typeof this.props.filename !== 'string') {
            throw Error('Invalid file name provided');
        }
        return this.getFileNameWithExtension(this.props.filename, this.getFileExtension());
    }

    getFileExtension() {
        let extension = this.props.fileExtension;

        if (extension.length === 0) {
            const slugs = this.props.filename.split('.');
            if (slugs.length === 0) {
                throw Error('Invalid file name provided');
            }
            extension = slugs[slugs.length - 1];
        }

        if (this.fileExtensions.indexOf(extension) !== -1) {
            return extension;
        }

        return this.defaultFileExtension;
    }

    getFileNameWithExtension(filename, extension) {
        return `${filename}.${extension}`;
    }

    render() {
        const { hideElement, element } = this.props;

        if (hideElement) {
            return null;
        } else {
            return (<span onClick={this.handleDownload}>{element}</span>);
        }
        
    }
}

export default ExcelFile;
