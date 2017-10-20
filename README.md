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
            </ExcelFile>
        );
    }
}
```

![Example](https://i.imgur.com/6fwdJeo.png)

## Dependencis 
This package uses [file-saver](https://www.npmjs.com/package/file-saver) and [xlsx](https://www.npmjs.com/package/xlsx) and using [json-loader](https://www.npmjs.com/package/json-loader) will do the magic for you.


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

