import type { ReactElement, RefObject } from "react";

/**
 * The Table tab's source table: a two-row header (rowspan + colspan), typed
 * number/date cells, a link, a row marked data-export-ignore, a hidden row
 * and a footer total. It's a component of its own so the tests can render it.
 */
export function DemoTable({ tableRef }: { tableRef?: RefObject<HTMLTableElement | null> }): ReactElement {
  return (
    <table ref={tableRef} className="demo">
      <caption>Orders (the table on the page)</caption>
      <thead>
        <tr>
          <th rowSpan={2}>Order</th>
          <th rowSpan={2}>Customer</th>
          <th colSpan={2}>Amount</th>
        </tr>
        <tr>
          <th>Net</th>
          <th>Shipped</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">1001</th>
          <td>
            <a href="https://example.com/customers/ada">Ada</a>
          </td>
          <td data-type="number" data-value="1250.5" data-numfmt="#,##0.00">
            1,250.50
          </td>
          <td data-type="date" data-value="2024-01-15">
            15 Jan 2024
          </td>
        </tr>
        <tr data-export-ignore="">
          <th scope="row">draft</th>
          <td colSpan={3}>Not exported (data-export-ignore)</td>
        </tr>
        <tr hidden>
          <th scope="row">1003</th>
          <td>Hidden row (not shown, not exported)</td>
          <td data-type="number" data-value="1">
            1.00
          </td>
          <td />
        </tr>
        <tr>
          <th scope="row">1002</th>
          <td>Grace</td>
          <td data-type="number" data-value="980" data-numfmt="#,##0.00">
            980.00
          </td>
          <td data-type="date" data-value="2024-01-16">
            16 Jan 2024
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" colSpan={2}>
            Total
          </th>
          <td data-type="number" data-value="2230.5" data-numfmt="#,##0.00">
            2,230.50
          </td>
          <td />
        </tr>
      </tfoot>
    </table>
  );
}
