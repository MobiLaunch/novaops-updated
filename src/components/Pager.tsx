import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PagerProps {
  /** Zero-based. */
  page: number;
  pageSize: number;
  total: number;
  rowsOnPage: number;
  onPageChange: (page: number) => void;
  label?: string;
}

/**
 * "Showing 1–50 of 130" with previous/next. Shared by DataTable and the
 * card lists that aren't tables, so paging looks and behaves the same
 * wherever it appears.
 */
export default function Pager({ page, pageSize, total, rowsOnPage, onPageChange, label = "results" }: PagerProps) {
  if (total <= pageSize) return null;
  const totalPages = Math.ceil(total / pageSize);
  const start = page * pageSize;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <span className="text-xs text-muted">
        Showing <strong className="font-bold text-foreground">{start + 1}</strong>–
        <strong className="font-bold text-foreground">{start + rowsOnPage}</strong> of{" "}
        <strong className="font-bold text-foreground">{total}</strong> {label}
      </span>
      <div className="flex items-center gap-2">
        <Button isDisabled={page === 0} size="sm" variant="outline" onPress={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" />
          <span>Previous</span>
        </Button>
        <span className="text-xs font-semibold text-muted">
          {page + 1} / {totalPages}
        </span>
        <Button isDisabled={page >= totalPages - 1} size="sm" variant="outline" onPress={() => onPageChange(page + 1)}>
          <span>Next</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
