import XLSX from "xlsx";

const strToArrBuffer = (s) => {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);

    for (var i = 0; i != s.length; ++i) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }

    return buf;
};

const dateToNumber = (v, date1904) => {
    if (date1904) {
        v += 1462;
    }

    var epoch = Date.parse(v);

    return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
};

const excelSheetFromDataSet = (dataSet) => {
    /*
    Assuming the structure of dataset
    {
        xSteps?: number; //How many cells to skips from left
        ySteps?: number; //How many rows to skips from last data
        columns: [array | string]
        data: [array_of_array | string|boolean|number | CellObject]
        fill, font, numFmt, alignment, and border
    }
     */
    if (dataSet === undefined || dataSet.length === 0) {
        return {};
    }

    var ws = {};
    var range = {s: {c: 10000000, r: 10000000}, e: {c: 0, r: 0}};
    var rowCount = 0;

    dataSet.forEach(dataSetItem => {
        var columns = dataSetItem.columns;
        var xSteps = typeof(dataSetItem.xSteps) === 'number' ? dataSetItem.xSteps : 0;
        var ySteps = typeof(dataSetItem.ySteps) === 'number' ? dataSetItem.ySteps : 0;
        var data = dataSetItem.data;
        if (dataSet === undefined || dataSet.length === 0) {
            return;
        }

        rowCount += ySteps;

        if (columns.length >= 0) {
            columns.forEach((col, index) => {
                var cellRef = XLSX.utils.encode_cell({c: xSteps + index, r: rowCount});
                fixRange(range, 0, 0, rowCount, xSteps, ySteps);
                getHeaderCell(col, cellRef, ws);
            });

            rowCount += 1;
        }

        for (var R = 0; R != data.length; ++R, rowCount++) {
            for (var C = 0; C != data[R].length; ++C) {
                var cellRef = XLSX.utils.encode_cell({c: C + xSteps, r: rowCount});
                fixRange(range, R, C, rowCount, xSteps, ySteps);
                getCell(data[R][C], cellRef, ws);
            }
        }
    });

    if (range.s.c < 10000000) {
        ws['!ref'] = XLSX.utils.encode_range(range);
    }

    return ws;
};

function getHeaderCell(v, cellRef, ws) {
    var cell = {};
    var headerCellStyle = {font: {bold: true}};
    cell.v = v;
    cell.t = 's';
    cell.s = headerCellStyle;
    ws[cellRef] = cell;
}

function getCell(v, cellRef, ws) {
    var cell = {};
    if (v === null) {
        return;
    }
    if (typeof v === 'number') {
        cell.v = v;
        cell.t = 'n';
    } else if (typeof v === 'boolean') {
        cell.v = v;
        cell.t = 'b';
    } else if (v instanceof Date) {
        cell.t = 'n';
        cell.z = XLSX.SSF._table[14];
        cell.v = dateToNumber(cell.v);
    } else if (typeof v === 'object') {
        cell.v = v.value;
        cell.s = v.style;
    } else {
        cell.v = v;
        cell.t = 's';
    }
    ws[cellRef] = cell;
}

function fixRange(range, R, C, rowCount, xSteps, ySteps) {
    if (range.s.r > R + rowCount) {
        range.s.r = R + rowCount;
    }

    if (range.s.c > C + xSteps) {
        range.s.c = C + xSteps;
    }

    if (range.e.r < R + rowCount) {
        range.e.r = R + rowCount;
    }

    if (range.e.c < C + xSteps) {
        range.e.c = C + xSteps;
    }
}

const excelSheetFromAoA = (data) => {
    var ws = {};
    var range = {s: {c: 10000000, r: 10000000}, e: {c: 0, r: 0}};

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

            var cell = {v: data[R][C]};
            if (cell.v === null) {
                continue;
            }

            var cellRef = XLSX.utils.encode_cell({c: C, r: R});
            if (typeof cell.v === 'number') {
                cell.t = 'n';
            } else if (typeof cell.v === 'boolean') {
                cell.t = 'b';
            } else if (cell.v instanceof Date) {
                cell.t = 'n';
                cell.z = XLSX.SSF._table[14];
                cell.v = dateToNumber(cell.v);
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
};


export {strToArrBuffer, dateToNumber, excelSheetFromAoA, excelSheetFromDataSet};
