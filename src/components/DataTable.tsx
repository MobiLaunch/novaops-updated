import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Table } from "@heroui/react";

import Pager from "./Pager";

export interface DataTableColumn<T extends object> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T extends object> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyState: { icon: LucideIcon; title: string; description: string };
  ariaLabel?: string;
  /** Rows per page. Pass 0 to render every row at once. */
  pageSize?: number;
  /**
   * Server-paged mode: `data` is already just the current page, `totalRows`
   * is how many exist in total, and paging is driven by the parent. Without
   * these the table pages through `data` itself.
   */
  page?: number;
  totalRows?: number;
  onPageChange?: (page: number) => void;
}

export default function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  emptyState,
  ariaLabel = "Data table",
  pageSize = 50,
  page: serverPage,
  totalRows,
  onPageChange,
}: DataTableProps<T>) {
  const [requestedPage, setRequestedPage] = useState(0);
  const serverPaged = serverPage !== undefined && totalRows !== undefined && onPageChange !== undefined;

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-surface-secondary p-10 text-center sm:p-14">
        <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-surface-tertiary text-muted">
          <emptyState.icon className="size-8" />
        </span>
        <h4 className="m-0 text-lg font-bold text-foreground">{emptyState.title}</h4>
        <p className="m-0 max-w-md text-sm text-muted">{emptyState.description}</p>
      </div>
    );
  }

  // Server-paged: the rows handed in are the page, and the parent owns which
  // page that is. Client-paged: slice here and keep the page in local state.
  const total = serverPaged ? totalRows : data.length;
  const paginated = pageSize > 0 && total > pageSize;
  const totalPages = paginated ? Math.ceil(total / pageSize) : 1;
  // Clamped rather than reset: filtering down to fewer pages shows the last
  // one instead of an empty table, and clearing the filter puts you back
  // where you were.
  const page = serverPaged ? serverPage : Math.min(requestedPage, totalPages - 1);
  const start = paginated ? page * pageSize : 0;
  const rows = serverPaged || !paginated ? data : data.slice(start, start + pageSize);
  const goTo = (next: number) => (serverPaged ? onPageChange(next) : setRequestedPage(next));

  // Keyed on the page so a page change remounts the table rather than making
  // HeroUI diff one row collection into a completely different one, which it
  // reports as a concurrent-rendering error.

  return (
    <div className="flex flex-col gap-3">
      <Table
        className="w-full overflow-hidden rounded-[28px] border border-border bg-surface-secondary shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
        variant="secondary"
      >
        <Table.ScrollContainer className="w-full">
          <Table.Content key={page} aria-label={ariaLabel} className="min-w-[800px]">
            <Table.Header>
              {columns.map((column) => (
                <Table.Column key={column.key} id={column.key} className={column.headerClassName}>
                  {column.header}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body items={rows}>
              {(row) => (
                <Table.Row id={rowKey(row)}>
                  {columns.map((column) => (
                    <Table.Cell key={column.key} className={column.cellClassName}>
                      {column.render(row)}
                    </Table.Cell>
                  ))}
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {paginated && (
        <Pager page={page} pageSize={pageSize} rowsOnPage={rows.length} total={total} onPageChange={goTo} label="rows" />
      )}
    </div>
  );
}
