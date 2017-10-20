'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.excelSheetFromAoA = exports.dateToNumber = exports.strToArrBuffer = undefined;

var _xlsx = require('xlsx');

var _xlsx2 = _interopRequireDefault(_xlsx);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
}

var strToArrBuffer = function strToArrBuffer(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);

    for (var i = 0; i != s.length; ++i) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }

    return buf;
};

var dateToNumber = function dateToNumber(v, date1904) {
    if (date1904) {
        v += 1462;
    }

    var epoch = Date.parse(v);

    return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
};

var excelSheetFromAoA = function excelSheetFromAoA(data) {
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

            var cellRef = _xlsx2.default.utils.encode_cell({c: C, r: R});
            if (typeof cell.v === 'number') {
                cell.t = 'n';
            } else if (typeof cell.v === 'boolean') {
                cell.t = 'b';
            } else if (cell.v instanceof Date) {
                cell.t = 'n';
                cell.z = _xlsx2.default.SSF._table[14];
                cell.v = dateToNumber(cell.v);
            } else {
                cell.t = 's';
            }

            ws[cellRef] = cell;
        }
    }

    if (range.s.c < 10000000) {
        ws['!ref'] = _xlsx2.default.utils.encode_range(range);
    }

    return ws;
};

exports.strToArrBuffer = strToArrBuffer;
exports.dateToNumber = dateToNumber;
exports.excelSheetFromAoA = excelSheetFromAoA;