import { motion, useScroll, useTransform } from "framer-motion";
import { TOOLS } from "@/lib/tools";
import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
];

export const SidebarNav = () => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [400, 600], [0, 1]);
  const x = useTransform(scrollY, [400, 600], [-60, 0]);
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.aside
      style={{ opacity, x }}
      className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-10"
    >
      <nav className="flex flex-col gap-3 border-l border-border pl-4">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={`text-[11px] uppercase tracking-[0.15em] text-left transition-colors flex items-center gap-2 ${
              active === s.id ? "text-orange" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${active === s.id ? "bg-orange" : "bg-muted-foreground/30"}`} />
            {s.label}
          </button>
        ))}
      </nav>

      <div className="border-l border-border pl-4 max-h-[30vh] overflow-y-auto scrollbar-hide">
        <p className="text-[10px] uppercase text-orange font-bold mb-2 tracking-wider">19 Tools</p>
        {TOOLS.map((t) => (
          <button
            key={t.name}
            onClick={() => scrollTo("features")}
            className="block text-[10px] text-muted-foreground hover:text-orange transition-colors py-0.5 truncate max-w-[120px]"
          >
            {t.name}
          </button>
        ))}
      </div>
    </motion.aside>
  );
};
