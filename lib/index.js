import ExcelFile from "./components/ExcelFile";
import ExcelSheet from "./elements/ExcelSheet";
import ExcelColumn from "./elements/ExcelColumn";

ExcelFile.ExcelSheet = ExcelSheet;
ExcelFile.ExcelColumn = ExcelColumn;

export default ExcelFile;

export {
    ExcelSheet,
    ExcelColumn
};
