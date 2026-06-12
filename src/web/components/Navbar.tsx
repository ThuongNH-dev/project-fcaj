import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Menu, X, Leaf } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface NavbarProps {
  currentPath?: string;
}

export function Navbar({ currentPath }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const nav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const links = [
    { label: t.home, path: "/" },
    { label: t.features, path: "/features" },
    { label: t.pricing, path: "/pricing" },
    { label: t.about, path: "/about" },
  ];

  return (
    <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#7EDDBA] rounded-xl flex items-center justify-center">
            <Leaf className="w-4 h-4 text-[#065f46]" strokeWidth={2.5} />
          </div>
          <span className="text-[#111827]" style={{ fontWeight: 700, fontSize: "1.125rem" }}>
            Splitly
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.path}
              onClick={() => nav(l.path)}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                currentPath === l.path
                  ? "bg-[#F0FAF5] text-[#16A34A]"
                  : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]"
              }`}
              style={{ fontWeight: 500 }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Language toggle — always visible */}
          <div className="flex items-center gap-0.5 bg-[#F3F4F6] rounded-xl p-0.5">
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${lang === "en" ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#374151]"}`}
              style={{ fontWeight: 600 }}
            >EN</button>
            <button
              onClick={() => setLang("vi")}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${lang === "vi" ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#374151]"}`}
              style={{ fontWeight: 600 }}
            >VI</button>
          </div>
          <button
            onClick={() => nav("/login")}
            className="hidden md:block px-4 py-2 text-sm text-[#374151] hover:text-[#111827] rounded-xl hover:bg-[#F9FAFB] transition-colors"
            style={{ fontWeight: 500 }}
          >
            {t.login}
          </button>
          <button
            onClick={() => nav("/register")}
            className="hidden md:block px-5 py-2 bg-[#16A34A] text-white text-sm rounded-xl hover:bg-[#15803d] transition-all shadow-sm"
            style={{ fontWeight: 600 }}
          >
            {t.signupFree}
          </button>
        </div>

        <button
          className="md:hidden p-2 rounded-xl text-[#6B7280] hover:bg-[#F0FAF5]"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
          {links.map((l) => (
            <button
              key={l.path}
              onClick={() => nav(l.path)}
              className="text-left px-4 py-2.5 rounded-xl text-sm text-[#374151] hover:bg-[#F0FAF5]"
              style={{ fontWeight: 500 }}
            >
              {l.label}
            </button>
          ))}
          <div className="border-t border-[#E5E7EB] mt-2 pt-2 flex flex-col gap-2">
            <button onClick={() => nav("/login")} className="px-4 py-2.5 text-sm text-[#374151] rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB]" style={{ fontWeight: 500 }}>{t.login}</button>
            <button onClick={() => nav("/register")} className="px-4 py-2.5 bg-[#16A34A] text-white text-sm rounded-xl hover:bg-[#15803d]" style={{ fontWeight: 600 }}>{t.signupFree}</button>
          </div>
        </div>
      )}
    </nav>
  );
}
