import React from "react";
import PropTypes from "prop-types";
import ExcelColumn from "./ExcelColumn";

export default class ExcelSheet extends React.Component {
    static propsTypes = {
        name: PropTypes.string.isRequired,
        data: PropTypes.arrayOf(PropTypes.object),
        dataSet: PropTypes.arrayOf(PropTypes.object),
        value: PropTypes.oneOfType([
            PropTypes.array,
            PropTypes.func
        ]).isRequired,
        children: PropTypes.arrayOf((propValue, key) => {
            const type = propValue[key];

            if (type !== ExcelColumn) {
                throw new Error("<ExcelSheet> can only have <ExcelColumn> as children");
            }
        }).isRequired
    };

    render() {
        return null;
    }
}
