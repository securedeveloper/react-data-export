import ExcelFile from "./ExcelPlugin/components/ExcelFile";
import ExcelSheet from "./ExcelPlugin/elements/ExcelSheet";
import ExcelColumn from "./ExcelPlugin/elements/ExcelColumn";

ExcelFile.ExcelSheet = ExcelSheet;
ExcelFile.ExcelColumn = ExcelColumn;

const ReactExport = {
    ExcelFile
};

export default ReactExport;
exports.modules = {
    ExcelFile,
    ExcelSheet,
    ExcelColumn
};
