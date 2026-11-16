import { useRef } from 'react';
import { ExportTableButton } from 'react-data-export';

interface Order {
  id: string;
  customer: string;
  total: number;
}

// 0.x apps often rendered a <table> and passed the same rows to <ExcelFile> again.
// In 1.0 the rendered table can be exported as it is.
export function Orders({ orders }: { orders: Order[] }) {
  const ref = useRef<HTMLTableElement>(null);
  return (
    <>
      <table ref={ref}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.customer}</td>
              <td data-type="number" data-numfmt="#,##0.00">
                {o.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ExportTableButton tableRef={ref} filename="orders" name="Orders" freezeHeader autoWidth>
        Download orders.xlsx
      </ExportTableButton>
    </>
  );
}
