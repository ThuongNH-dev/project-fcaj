import { useState } from "react";
import { Upload, Search, FileText, Plus } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function ReceiptsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dragOver, setDragOver] = useState(false);
  const { t } = useLanguage();

  const filters = [
    { key: "all", label: t.all },
    { key: "processed", label: t.processed },
    { key: "pending", label: t.pendingReview },
    { key: "failed", label: t.failedErrors },
  ];

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t.receiptsTitle}</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">0 {t.receiptsUploaded}</p>
          </div>
          <label className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-all shadow-sm cursor-pointer" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            <Plus className="w-4 h-4" />
            {t.uploadReceipt}
            <input type="file" className="hidden" accept="image/*,.pdf" />
          </label>
        </div>

        <div
          className={`border-2 border-dashed rounded-2xl p-10 mb-7 text-center transition-all cursor-pointer ${dragOver ? "border-[#7EDDBA] bg-[#F0FAF5]" : "border-[#D1FAE5] bg-white hover:border-[#7EDDBA] hover:bg-[#F0FAF5]"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
        >
          <div className="w-14 h-14 bg-[#D1FAE5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7 text-[#16A34A]" />
          </div>
          <p className="text-[#374151] mb-1" style={{ fontWeight: 600 }}>{t.dragDrop}</p>
          <p className="text-[#9CA3AF] text-sm">{t.dragDropHint}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: t.processed, value: "0", bg: "bg-[#F0FAF5]" },
            { label: t.pendingReview, value: "0", bg: "bg-[#FEFCE8]" },
            { label: t.failedErrors, value: "0", bg: "bg-[#FEF2F2]" },
          ].map(({ label, value, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-5 border border-white`}>
              <p className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</p>
              <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder={t.searchReceipts}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${filter === f.key ? "bg-[#16A34A] text-white shadow-sm" : "text-[#6B7280] hover:text-[#111827]"}`}
                style={{ fontWeight: 500 }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#E5E7EB] text-center px-6">
          <div className="w-16 h-16 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-[#7EDDBA]" />
          </div>
          <h3 className="text-[#111827] mb-1" style={{ fontWeight: 700 }}>{t.noReceiptsTitle}</h3>
          <p className="text-[#6B7280] text-sm mb-6">{t.noReceiptsDesc}</p>
          <label className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors cursor-pointer" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            <Upload className="w-4 h-4" />
            {t.uploadFirstReceipt}
            <input type="file" className="hidden" accept="image/*,.pdf" />
          </label>
        </div>
      </div>
    </div>
  );
}
