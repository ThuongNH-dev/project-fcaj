import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  onPageChange: (page: number) => void;
  page: number;
  totalPages: number;
}

function getPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current]);

  if (current - 1 > 1) pages.add(current - 1);
  if (current + 1 < total) pages.add(current + 1);

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: (number | "...")[] = [];

  sorted.forEach((pageNumber, index) => {
    if (index > 0) {
      const previous = sorted[index - 1];
      if (pageNumber - previous === 2) {
        result.push(previous + 1);
      } else if (pageNumber - previous > 2) {
        result.push("...");
      }
    }
    result.push(pageNumber);
  });

  return result;
}

export function AdminPagination({ onPageChange, page, totalPages }: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pageList = getPageList(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 border-t border-[#F3F4F6] px-5 py-4">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] transition-colors hover:border-[#BBF7D0] hover:bg-[#F0FAF5] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pageList.map((entry, index) =>
        entry === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-8 w-8 items-center justify-center text-sm text-[#9CA3AF]"
          >
            ...
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onPageChange(entry)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-all ${
              entry === page
                ? "bg-[#16A34A] text-white shadow-sm"
                : "border border-[#E5E7EB] bg-white text-[#374151] hover:border-[#BBF7D0] hover:bg-[#F0FAF5]"
            }`}
            style={{ fontWeight: entry === page ? 700 : 500 }}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] transition-colors hover:border-[#BBF7D0] hover:bg-[#F0FAF5] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}