# React-Data-Export
============

A data export library built with and for [React](http://facebook.github.io/react/index.html). 

## Example

```javascript
import React from "react"
import * from "react-data-export"

class App extends React.Component {
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
