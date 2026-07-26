import { Search } from "lucide-react";

interface AdminSearchInputProps {
  className?: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}

export function AdminSearchInput({
  className = "mb-5 max-w-xs",
  onChange,
  placeholder,
  value,
}: AdminSearchInputProps) {
  return (
    <div className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-4 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
        />
      </div>
    </div>
  );
}