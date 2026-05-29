import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
}

/**
 * Plain HTML table styled for the cream palette. First row gets a faint
 * accent tint — useful for emphasising "top by metric" tables.
 */
export function DataTable<T>({ columns, rows, rowKey, caption }: Props<T>) {
  return (
    <div className="overflow-x-auto">
      {caption && (
        <div className="border-b border-rule px-[18px] py-3 text-[13.5px] font-semibold">
          {caption}
        </div>
      )}
      <table className="w-full border-collapse text-[12.5px]">
        <thead className="border-b border-rule bg-surface-2">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-faint ${
                  c.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={rowKey(row)}
              className="border-t border-rule"
              style={
                idx === 0
                  ? {
                      background:
                        "color-mix(in srgb, var(--color-accent-soft) 30%, var(--color-surface))",
                    }
                  : undefined
              }
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-3 py-2.5 ${c.align === "right" ? "text-right" : "text-left"}`}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
