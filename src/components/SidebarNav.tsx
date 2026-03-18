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
      className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-8 w-[180px] p-4 rounded-2xl"
      aria-label="Page navigation"
    >
      {/* Section nav */}
      <nav className="flex flex-col gap-2 border-l border-[hsla(245,100%,71%,0.15)] pl-4">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={`text-[11px] uppercase tracking-[0.15em] text-left transition-all duration-300 flex items-center gap-2.5 py-1 ${
              active === s.id ? "text-orange" : "text-soft-gray hover:text-foreground"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              active === s.id ? "bg-orange shadow-[0_0_6px_hsla(14,100%,50%,0.5)]" : "bg-soft-gray/30"
            }`} />
            {s.label}
          </button>
        ))}
      </nav>

      {/* Tools list */}
      <div className="border-l border-[hsla(245,100%,71%,0.15)] pl-4 max-h-[30vh] overflow-y-auto scrollbar-thin">
        <p className="text-[10px] uppercase text-purple font-bold mb-2 tracking-[0.15em]">19 Tools</p>
        {TOOLS.map((t) => (
          <button
            key={t.name}
            onClick={() => scrollTo("features")}
            className="block text-[11px] text-soft-gray hover:text-orange hover:bg-orange/5 transition-all py-1 px-1 rounded truncate max-w-full w-full text-left"
          >
            {t.name}
          </button>
        ))}
      </div>
    </motion.aside>
  );
};
