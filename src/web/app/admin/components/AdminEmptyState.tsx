import type { LucideIcon } from "lucide-react";

interface AdminEmptyStateProps {
  description: string;
  icon: LucideIcon;
  title: string;
}

export function AdminEmptyState({
  description,
  icon: Icon,
  title,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0FAF5]">
        <Icon className="h-7 w-7 text-[#7EDDBA]" />
      </div>
      <h3 className="mb-1 text-[#111827]" style={{ fontWeight: 700 }}>
        {title}
      </h3>
      <p className="text-sm text-[#6B7280]">{description}</p>
    </div>
  );
}
