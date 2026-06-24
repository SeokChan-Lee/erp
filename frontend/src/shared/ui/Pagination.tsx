type PaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

const MAX_VISIBLE_PAGES = 5;

export function Pagination({ page, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  const startPage = Math.min(
    Math.max(1, page - Math.floor(MAX_VISIBLE_PAGES / 2)),
    Math.max(1, totalPages - MAX_VISIBLE_PAGES + 1)
  );
  const pages = Array.from({ length: Math.min(MAX_VISIBLE_PAGES, totalPages) }, (_, index) => startPage + index);

  return (
    <nav className="flex items-center justify-between gap-3 border-t border-axis-border bg-white px-4 py-3">
      <p className="text-xs font-semibold text-axis-muted">
        총 {totalItems}건 · {page}/{totalPages} 페이지
      </p>
      <div className="flex items-center gap-1">
        <button
          className="h-9 min-w-9 rounded-md border border-axis-border bg-white px-2 text-sm font-bold text-axis-ink transition hover:border-axis-ink disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page <= 1}
          type="button"
          onClick={() => onPageChange(page - 1)}
        >
          {"<"}
        </button>
        {pages.map((item) => (
          <button
            key={item}
            aria-current={item === page ? "page" : undefined}
            className={[
              "h-9 min-w-9 rounded-md border px-3 text-sm font-bold transition",
              item === page
                ? "border-axis-ink bg-axis-ink text-white"
                : "border-axis-border bg-white text-axis-muted hover:border-axis-ink hover:text-axis-ink"
            ].join(" ")}
            type="button"
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ))}
        <button
          className="h-9 min-w-9 rounded-md border border-axis-border bg-white px-2 text-sm font-bold text-axis-ink transition hover:border-axis-ink disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page >= totalPages}
          type="button"
          onClick={() => onPageChange(page + 1)}
        >
          {">"}
        </button>
      </div>
    </nav>
  );
}
