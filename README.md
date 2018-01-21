# React-Data-Export

[![npm version](https://badge.fury.io/js/react-data-export.svg)](https://badge.fury.io/js/react-data-export)
[![dependencies Status](https://david-dm.org/securedeveloper/react-data-export/status.svg)](https://david-dm.org/securedeveloper/react-data-export)
[![devDependencies Status](https://david-dm.org/securedeveloper/react-data-export/dev-status.svg)](https://david-dm.org/securedeveloper/react-data-export?type=dev)
[![Build Status](https://travis-ci.org/securedeveloper/react-data-export.svg?branch=master)](https://travis-ci.org/securedeveloper/react-data-export)
[![Coverage Status](https://coveralls.io/repos/github/securedeveloper/react-data-export/badge.svg?branch=master)](https://coveralls.io/github/securedeveloper/react-data-export?branch=master)


A data export library built with and for [React](http://facebook.github.io/react/index.html). 

## Getting Started

```javascript
import React from "react"
import * from "react-data-export"

const dataSet1 = [
    {
        name: "Johson",
        amount: 30000,
        sex: 'M',
        is_married: true
    },
    {
        name: "Monika",
        amount: 355000,
        sex: 'F',
        is_married: false
    },
    {
        name: "John",
        amount: 250000,
        sex: 'M',
        is_married: false
    },
    {
        name: "Josef",
        amount: 450500,
        sex: 'M',
        is_married: true
    }
];

var dataSet2 = [
    {
        name: "Johnson",
        total: 25,
        remainig: 16
    },
    {
        name: "Josef",
        total: 25,
        remainig: 7
    }
];

class App extends React.Component {
    render() {
        return (
            <ExcelFile>
                <ExcelSheet data={dataSet1} name="Employees">
                    <ExcelColumn label="Name" value="name" />
                    <ExcelColumn label="Wallet Money" value="amount" />
                    <ExcelColumn label="Gender" value="sex" />
                    <ExcelColumn label="Marital Status" 
                                 value={(col) => col.is_married ? "Married" : "Single"} />
                </ExcelSheet>
                <ExcelSheet data={dataSet2} name="Leaves">
                    <ExcelColumn label="Name" value="name" />
                    <ExcelColumn label="Total Leaves" value="total" />
                    <ExcelColumn label="Remaining Leaves" value="remaining" />
                </ExcelSheet>
            </ExcelFile>
        );
    }
}
```

![Example](https://i.imgur.com/6fwdJeo.png)

With release `0.3.0` and upwards you can also pass **multiple** dataset to *ExcelSheet*, and you can have more than one *ExcelSheets* in 1 excel file.

```javascript
/*When you want to use dataSet directly, you can specify multiple data to single ExcelSheet with following structure,
//i.e You can have multiple dataSets on Multiple Sheets in Single Excel File
interface {
        xSteps?: number; //How many cells to skips from left (Optional)
        ySteps?: number; //How many rows to skips from last data (Optional)
        columns: [array | string] //array (required)
        data: [array_of_array | string|boolean|number] //array of arrays (required)
    }
*/
import React from "react"
import {default as ExcelFile, ExcelSheet} from "react-data-export"

const multiDataSet = [
    {
        columns: ["Name", "Salary", "Sex"],
        data: [
            ["Johnson", 30000, "Male"],
            ["Monika", 355000, "Female"],
            ["Konstantina", 20000, "Female"],
            ["John", 250000, "Male"],
            ["Josef", 450500, "Male"],
        ]
    },
    {
        xSteps: 1, // Will start putting cell with 1 empty cell on left most
        ySteps: 5, //will put space of 5 rows,
        columns: ["Name", "Department"],
        data: [
            ["Johnson", "Finance"],
            ["Monika", "IT"],
            ["Konstantina", "IT Billing"],
            ["John", "HR"],
            ["Josef", "Testing"],
        ]
    }
];

class App extends React.Component {
    render() {
        return (
            <ExcelFile>
                <ExcelSheet dataSet={multiDataSet} name="Organization" />
                <!-- You can add more ExcelSheets if you need -->
            </ExcelFile>
        );
    }
}
```


## Dependencis 
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

