import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Users, Calculator, TrendingUp, Upload, Check, Star, Github, Twitter, Leaf, ChevronRight, Zap, Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface LandingPageProps {
  section?: string;
}

export function LandingPage({ section }: LandingPageProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  useEffect(() => {
    if (section && section !== "landing") {
      const el = document.getElementById(section);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [section]);
  const features = [
    { icon: Users, title: t.feat1Title, desc: t.feat1Desc, color: "bg-[#D1FAE5]", iconColor: "text-[#16A34A]" },
    { icon: Calculator, title: t.feat2Title, desc: t.feat2Desc, color: "bg-[#DBEAFE]", iconColor: "text-[#2563EB]" },
    { icon: TrendingUp, title: t.feat3Title, desc: t.feat3Desc, color: "bg-[#FEF3C7]", iconColor: "text-[#D97706]" },
    { icon: Upload, title: t.feat4Title, desc: t.feat4Desc, color: "bg-[#FCE7F3]", iconColor: "text-[#DB2777]" },
  ];

  const steps = [
    { n: "01", title: t.step1Title, desc: t.step1Desc },
    { n: "02", title: t.step2Title, desc: t.step2Desc },
    { n: "03", title: t.step3Title, desc: t.step3Desc },
  ];

  const testimonials = [
    { name: "Sarah K.", role: "Grad student", text: "Finally stopped the awkward 'hey can you pay me back' texts. Splitly makes it effortless.", avatar: "SK" },
    { name: "Marcus T.", role: "Software engineer", text: "Used it for a 3-week Euro trip with 8 friends. Balanced to the cent with zero drama.", avatar: "MT" },
    { name: "Priya R.", role: "Project manager", text: "We use it for our shared apartment. Rent, groceries, utilities — all in one place.", avatar: "PR" },
  ];

  const pricingPlans = [
    { name: t.free, price: t.pricingFreePrice, period: t.pricingPeriod, features: t.pricingFreeFeatures, cta: t.getStarted, primary: false },
    { name: t.pro, price: t.pricingProPrice, period: t.pricingPeriod, features: t.pricingProFeatures, cta: t.startTrial, primary: true },
    { name: t.team, price: t.pricingTeamPrice, period: t.pricingPeriod, features: t.pricingTeamFeatures, cta: t.contactSales, primary: false },
  ];

  return (
    <div className="bg-[#F6FBF8]">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#D1FAE5] text-[#065f46] px-3 py-1.5 rounded-full text-sm mb-6" style={{ fontWeight: 500 }}>
              <Zap className="w-3.5 h-3.5" />
              {t.freeForSmall}
            </div>
            <h1 className="text-[#111827] mb-6 leading-tight" style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1 }}>
              {t.heroHeadline}
            </h1>
            <p className="text-[#6B7280] mb-10 max-w-md" style={{ fontSize: "1.125rem", lineHeight: 1.7 }}>
              {t.heroDesc}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => navigate("/register")}
                className="flex items-center gap-2 bg-[#16A34A] text-white px-7 py-3.5 rounded-2xl hover:bg-[#15803d] transition-all shadow-md hover:shadow-lg"
                style={{ fontWeight: 600, fontSize: "1rem" }}
              >
                {t.getStarted}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 bg-white text-[#374151] px-7 py-3.5 rounded-2xl border border-[#E5E7EB] hover:border-[#7EDDBA] hover:bg-[#F0FAF5] transition-all"
                style={{ fontWeight: 500, fontSize: "1rem" }}
              >
                {t.viewDemo}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-2">
                {["#7EDDBA", "#93C5FD", "#FCA5A5", "#FCD34D", "#C4B5FD"].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs" style={{ background: c, fontWeight: 700, color: "#065f46", zIndex: 5 - i }}>
                    {["J", "M", "A", "S", "K"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />)}
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">{t.lovedBy}</p>
              </div>
            </div>
          </div>

          {/* Hero illustration */}
          <div className="relative hidden lg:block">
            <div className="absolute -top-8 -left-8 w-72 h-72 bg-[#D1FAE5] rounded-full opacity-50 blur-3xl" />
            <div className="absolute -bottom-8 -right-8 w-56 h-56 bg-[#DBEAFE] rounded-full opacity-40 blur-3xl" />
            <div className="relative bg-white rounded-3xl shadow-xl p-6 border border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-[#9CA3AF] uppercase tracking-wider" style={{ fontWeight: 600 }}>Group Balance</p>
                  <p className="text-3xl text-[#111827] mt-1" style={{ fontWeight: 800 }}>$284.50</p>
                </div>
                <div className="bg-[#F0FAF5] px-3 py-1.5 rounded-xl">
                  <span className="text-[#16A34A] text-sm" style={{ fontWeight: 600 }}>🏖 Bali Trip</span>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  { name: "Alex", paid: "$120", owes: "", color: "#7EDDBA", label: "paid" },
                  { name: "Mia", paid: "", owes: "$45.50", color: "#FCA5A5", label: "owes" },
                  { name: "Sam", paid: "", owes: "$78.20", color: "#FCD34D", label: "owes" },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-3 bg-[#F9FAFB] rounded-xl px-3 py-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: p.color, fontWeight: 700, color: "#065f46" }}>
                      {p.name[0]}
                    </div>
                    <span className="flex-1 text-sm text-[#374151]" style={{ fontWeight: 500 }}>{p.name}</span>
                    {p.paid && <span className="text-sm text-[#16A34A]" style={{ fontWeight: 600 }}>+{p.paid}</span>}
                    {p.owes && <span className="text-sm text-[#EF4444]" style={{ fontWeight: 600 }}>-{p.owes}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.label === "paid" ? "bg-[#D1FAE5] text-[#065f46]" : "bg-[#FEE2E2] text-[#991b1b]"}`} style={{ fontWeight: 500 }}>
                      {p.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-[#16A34A] text-white text-center py-3 rounded-xl text-sm" style={{ fontWeight: 600 }}>
                Settle Up → Save $123.70
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg px-4 py-3 border border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#D1FAE5] rounded-xl flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#16A34A]" />
                </div>
                <div>
                  <p className="text-xs text-[#111827]" style={{ fontWeight: 600 }}>Payment sent!</p>
                  <p className="text-xs text-[#9CA3AF]">$45.50 to Mia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#F0FAF5] text-[#16A34A] px-3 py-1.5 rounded-full text-sm mb-4" style={{ fontWeight: 500 }}>
              <Leaf className="w-3.5 h-3.5" />
              Features
            </div>
            <h2 className="text-[#111827] mb-4" style={{ fontSize: "2rem", fontWeight: 800 }}>{t.featuresTitle}</h2>
            <p className="text-[#6B7280] max-w-md mx-auto" style={{ lineHeight: 1.7 }}>{t.featuresDesc}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc, color, iconColor }) => (
              <div key={title} className="bg-[#F6FBF8] rounded-2xl p-6 hover:shadow-md transition-all border border-[#E5E7EB] group hover:-translate-y-0.5">
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="text-[#111827] mb-2" style={{ fontWeight: 700 }}>{title}</h3>
                <p className="text-[#6B7280] text-sm" style={{ lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-[#111827] mb-4" style={{ fontSize: "2rem", fontWeight: 800 }}>{t.howItWorks}</h2>
          <p className="text-[#6B7280]" style={{ lineHeight: 1.7 }}>{t.howItWorksDesc}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ n, title, desc }) => (
            <div key={n} className="text-center">
              <div className="w-14 h-14 bg-[#7EDDBA] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                <span className="text-[#065f46]" style={{ fontWeight: 800, fontSize: "1.125rem" }}>{n}</span>
              </div>
              <h3 className="text-[#111827] mb-2" style={{ fontWeight: 700, fontSize: "1.125rem" }}>{title}</h3>
              <p className="text-[#6B7280] text-sm" style={{ lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="about" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-[#111827] mb-3" style={{ fontSize: "2rem", fontWeight: 800 }}>{t.peopleLove}</h2>
            <p className="text-[#6B7280]">{t.realStories}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, avatar }) => (
              <div key={name} className="bg-[#F6FBF8] rounded-2xl p-6 border border-[#E5E7EB]">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />)}
                </div>
                <p className="text-[#374151] text-sm mb-5" style={{ lineHeight: 1.7 }}>"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#7EDDBA] flex items-center justify-center text-xs text-[#065f46]" style={{ fontWeight: 700 }}>{avatar}</div>
                  <div>
                    <p className="text-sm text-[#111827]" style={{ fontWeight: 600 }}>{name}</p>
                    <p className="text-xs text-[#9CA3AF]">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-[#111827] mb-3" style={{ fontSize: "2rem", fontWeight: 800 }}>{t.simplePricing}</h2>
          <p className="text-[#6B7280]">{t.startFree}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {pricingPlans.map(({ name, price, period, features, cta, primary }) => (
            <div
              key={name}
              className={`rounded-2xl p-6 border ${primary ? "bg-[#16A34A] border-[#16A34A] shadow-xl" : "bg-white border-[#E5E7EB]"}`}
            >
              <p className={`text-sm mb-1 ${primary ? "text-[#A7F3D0]" : "text-[#6B7280]"}`} style={{ fontWeight: 500 }}>{name}</p>
              <div className="flex items-end gap-1 mb-5">
                <span className={`${primary ? "text-white" : "text-[#111827]"}`} style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}>{price}</span>
                <span className={`mb-1 text-sm ${primary ? "text-[#A7F3D0]" : "text-[#9CA3AF]"}`}>{period}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className={`w-4 h-4 flex-shrink-0 ${primary ? "text-[#A7F3D0]" : "text-[#16A34A]"}`} />
                    <span className={primary ? "text-[#D1FAE5]" : "text-[#374151]"}>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/login")}
                className={`w-full py-3 rounded-xl text-sm transition-all ${
                  primary
                    ? "bg-white text-[#16A34A] hover:bg-[#F0FAF5]"
                    : "bg-[#F0FAF5] text-[#16A34A] hover:bg-[#D1FAE5]"
                }`}
                style={{ fontWeight: 600 }}
              >
                {cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-[#16A34A] py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-white mb-4" style={{ fontSize: "2rem", fontWeight: 800 }}>{t.readyToSplit}</h2>
          <p className="text-[#A7F3D0] mb-8" style={{ lineHeight: 1.7 }}>{t.joinUsers}</p>
          <button
            onClick={() => navigate("/register")}
            className="bg-white text-[#16A34A] px-8 py-4 rounded-2xl hover:bg-[#F0FAF5] transition-all shadow-lg"
            style={{ fontWeight: 700, fontSize: "1rem" }}
          >
            {t.getStartedFree}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#7EDDBA] rounded-lg flex items-center justify-center">
                <Leaf className="w-3.5 h-3.5 text-[#065f46]" />
              </div>
              <span className="text-[#111827]" style={{ fontWeight: 700 }}>Splitly</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#9CA3AF]">
              {[t.privacy, t.terms, t.helpCenter, t.contact].map((l) => (
                <a key={l} href="#" className="hover:text-[#374151] transition-colors">{l}</a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 bg-[#F6FBF8] rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F0FAF5] transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-[#F6FBF8] rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F0FAF5] transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-[#F6FBF8] rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F0FAF5] transition-colors">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#E5E7EB] text-center text-xs text-[#9CA3AF]">
            © 2026 Splitly Inc. Made with ♥ for fair friends.
          </div>
        </div>
      </footer>
    </div>
  );
}
