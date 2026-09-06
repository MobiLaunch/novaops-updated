import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Button, Table } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
}

export default function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  emptyState,
  ariaLabel = "Data table",
  pageSize = 50,
}: DataTableProps<T>) {
  const [requestedPage, setRequestedPage] = useState(0);

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

  const paginated = pageSize > 0 && data.length > pageSize;
  const totalPages = paginated ? Math.ceil(data.length / pageSize) : 1;
  // Clamped rather than reset: filtering down to fewer pages shows the last
  // one instead of an empty table, and clearing the filter puts you back
  // where you were.
  const page = Math.min(requestedPage, totalPages - 1);
  const start = paginated ? page * pageSize : 0;
  const rows = paginated ? data.slice(start, start + pageSize) : data;

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
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <span className="text-xs text-muted">
            Showing <strong className="font-bold text-foreground">{start + 1}</strong>–
            <strong className="font-bold text-foreground">{start + rows.length}</strong> of{" "}
            <strong className="font-bold text-foreground">{data.length}</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button isDisabled={page === 0} size="sm" variant="outline" onPress={() => setRequestedPage(page - 1)}>
              <ChevronLeft className="size-4" />
              <span>Previous</span>
            </Button>
            <span className="text-xs font-semibold text-muted">
              {page + 1} / {totalPages}
            </span>
            <Button isDisabled={page >= totalPages - 1} size="sm" variant="outline" onPress={() => setRequestedPage(page + 1)}>
              <span>Next</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
