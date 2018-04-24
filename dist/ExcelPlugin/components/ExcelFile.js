"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _propTypes = require("prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

var _fileSaver = require("file-saver");

var _tempaXlsx = require("tempa-xlsx");

var _tempaXlsx2 = _interopRequireDefault(_tempaXlsx);

var _ExcelSheet = require("../elements/ExcelSheet");

var _ExcelSheet2 = _interopRequireDefault(_ExcelSheet);

var _DataUtil = require("../utils/DataUtil");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ExcelFile = function (_React$Component) {
    _inherits(ExcelFile, _React$Component);

    function ExcelFile(props) {
        _classCallCheck(this, ExcelFile);

        var _this = _possibleConstructorReturn(this, (ExcelFile.__proto__ || Object.getPrototypeOf(ExcelFile)).call(this, props));

        _initialiseProps.call(_this);

        if (_this.props.hideElement) {
            _this.download();
        } else {
            _this.handleDownload = _this.download.bind(_this);
        }

        _this.createSheetData = _this.createSheetData.bind(_this);
        return _this;
    }

    _createClass(ExcelFile, [{
        key: "createSheetData",
        value: function createSheetData(sheet) {
            var columns = sheet.props.children;
            var sheetData = [_react2.default.Children.map(columns, function (column) {
                return column.props.label;
            })];
            var data = typeof sheet.props.data === 'function' ? sheet.props.data() : sheet.props.data;

            data.forEach(function (row) {
                var sheetRow = [];

                _react2.default.Children.forEach(columns, function (column) {
                    var getValue = typeof column.props.value === 'function' ? column.props.value : function (row) {
                        return row[column.props.value];
                    };
                    var itemValue = getValue(row);
                    sheetRow.push(isNaN(itemValue) ? itemValue || '' : itemValue);
                });

                sheetData.push(sheetRow);
            });

            return sheetData;
        }
    }, {
        key: "download",
        value: function download() {
            var _this2 = this;

            var wb = {
                SheetNames: _react2.default.Children.map(this.props.children, function (sheet) {
                    return sheet.props.name;
                }),
                Sheets: {}
            };

            _react2.default.Children.forEach(this.props.children, function (sheet) {
                if (typeof sheet.props.dataSet === 'undefined' || sheet.props.dataSet.length === 0) {
                    wb.Sheets[sheet.props.name] = (0, _DataUtil.excelSheetFromAoA)(_this2.createSheetData(sheet));
                } else {
                    wb.Sheets[sheet.props.name] = (0, _DataUtil.excelSheetFromDataSet)(sheet.props.dataSet);
                }
            });

            var fileExtension = this.getFileExtension();
            var fileName = this.getFileName();
            var wbout = _tempaXlsx2.default.write(wb, { bookType: fileExtension, bookSST: true, type: 'binary' });

            (0, _fileSaver.saveAs)(new Blob([(0, _DataUtil.strToArrBuffer)(wbout)], { type: "application/octet-stream" }), fileName);
        }
    }, {
        key: "getFileName",
        value: function getFileName() {
            if (this.props.filename === null || typeof this.props.filename !== 'string') {
                throw Error('Invalid file name provided');
            }
            return this.getFileNameWithExtension(this.props.filename, this.getFileExtension());
        }
    }, {
        key: "getFileExtension",
        value: function getFileExtension() {
            var extension = this.props.fileExtension;

            if (extension.length === 0) {
                var slugs = this.props.filename.split('.');
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
    }, {
        key: "getFileNameWithExtension",
        value: function getFileNameWithExtension(filename, extension) {
            return filename + "." + extension;
        }
    }, {
        key: "render",
        value: function render() {
            var _props = this.props,
                hideElement = _props.hideElement,
                element = _props.element;


            if (hideElement) {
                return null;
            } else {
                return _react2.default.createElement(
                    "span",
                    { onClick: this.handleDownload },
                    element
                );
            }
        }
    }]);

    return ExcelFile;
}(_react2.default.Component);

ExcelFile.props = {
    hideElement: _propTypes2.default.bool,
    filename: _propTypes2.default.string,
    fileExtension: _propTypes2.default.string,
    element: _propTypes2.default.any,
    children: function children(props, propName, componentName) {
        _react2.default.Children.forEach(props[propName], function (child) {
            if (child.type !== _ExcelSheet2.default) {
                throw new Error('<ExcelFile> can only have <ExcelSheet> as children. ');
            }
        });
    }
};
ExcelFile.defaultProps = {
    hideElement: false,
    filename: "Download",
    fileExtension: "xlsx",
    element: _react2.default.createElement(
        "button",
        null,
        "Download"
    )
};

var _initialiseProps = function _initialiseProps() {
    this.fileExtensions = ['xlsx', 'xls', 'csv', 'txt', 'html'];
    this.defaultFileExtension = 'xlsx';
};

exports.default = ExcelFile;