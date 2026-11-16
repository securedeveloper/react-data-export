// @vitest-environment jsdom
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fromTable } from "javascript-excel/dom";
import { exportTable } from "react-data-export";
import { DemoTable } from "../src/demo-table";
import { previewOf } from "../src/preview";

function mount(): HTMLTableElement {
  document.body.innerHTML = renderToStaticMarkup(<DemoTable tableRef={createRef()} />);
  return document.querySelector("table")!;
}

const texts = (rows: ReturnType<typeof previewOf>["rows"]) => rows.map((r) => r.map((c) => c?.text ?? null));

describe("the Table tab's demo table", () => {
  afterEach(() => vi.restoreAllMocks());

  it("becomes a sheet with merges, typed values, and the ignored and hidden rows skipped", () => {
    const p = previewOf(fromTable(mount(), { freezeHeader: true }));
    expect(p.frozenRows).toBe(2);
    expect(texts(p.rows)).toEqual([
      ["Order", "Customer", "Amount", null],
      [null, null, "Net", "Shipped"],
      ["1001", "Ada", "1250.5", "2024-01-15"],
      ["1002", "Grace", "980", "2024-01-16"],
      ["Total", null, "2230.5", ""],
    ]);
    expect(p.rows[0]![0]).toMatchObject({ rowSpan: 2 });
    expect(p.rows[0]![2]).toMatchObject({ colSpan: 2 });
    expect(p.rows[4]![0]).toMatchObject({ colSpan: 2 });
  });

  it("exports as CSV through react-data-export's exportTable (the function behind useTableExport and <ExportTableButton>)", async () => {
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const ref = { current: mount() };
    const result = await exportTable(ref, { format: "csv", filename: "orders" });
    expect(result.filename).toBe("orders.csv");
    expect(create).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    const text = (await result.blob.text()).replace(/^﻿/, "");
    expect(text).toBe("Order,Customer,Amount,\r\n,,Net,Shipped\r\n1001,Ada,1250.5,2024-01-15\r\n1002,Grace,980,2024-01-16\r\nTotal,,2230.5,\r\n");
  });
});
