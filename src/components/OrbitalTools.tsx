import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Logo } from "./Logo";
import { TOOLS } from "@/lib/tools";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const OrbitalTools = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const inner = TOOLS.filter((t) => t.ring === "inner");
  const outer = TOOLS.filter((t) => t.ring === "outer");
  const stripRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  const scroll = (dir: number) => {
    stripRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  return (
    <section id="features" className="py-32 px-6" ref={sectionRef}>
      <div className="max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          className="text-xs uppercase tracking-[0.2em] text-purple font-semibold mb-4"
        >
          The Tools
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-4xl sm:text-5xl lg:text-6xl font-black mb-3"
        >
          Every Tool You Need
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.1 }}
          className="text-soft-gray text-lg mb-20"
        >
          One platform. Infinite creative possibilities.
        </motion.p>

        {/* Orbital */}
        <div className="flex justify-center mb-24">
          <div className="relative w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] lg:w-[520px] lg:h-[520px]">
            {/* Center */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="relative">
                <div className="absolute inset-0 blur-[60px] rounded-full bg-orange/15 scale-[2]" />
                <div className="p-6 sm:p-8 rounded-full bg-background border border-[hsla(0,0%,100%,0.08)] shadow-[0_0_80px_hsla(14,100%,50%,0.12)] relative">
                  <Logo className="w-12 h-12 sm:w-20 sm:h-20" glow />
                </div>
              </div>
            </div>

            {/* Inner ring */}
            <div
              className="absolute inset-[22%] border border-dashed border-[hsla(0,0%,100%,0.06)] rounded-full"
              style={{
                animation: hovered !== null && TOOLS[hovered]?.ring === 'inner' ? 'none' : 'orbit 20s linear infinite',
              }}
            >
              {inner.map((tool, i) => {
                const globalIdx = TOOLS.indexOf(tool);
                const angle = (i / inner.length) * 360;
                return (
                  <ToolNode key={tool.name} tool={tool} angle={angle} index={globalIdx} hovered={hovered} onHover={setHovered} ringRadius="50%" ring="inner" />
                );
              })}
            </div>

            {/* Outer ring */}
            <div
              className="absolute inset-0 border border-dashed border-[hsla(245,100%,71%,0.06)] rounded-full"
              style={{
                animation: hovered !== null && TOOLS[hovered]?.ring === 'outer' ? 'none' : 'orbit 35s linear infinite reverse',
              }}
            >
              {outer.map((tool, i) => {
                const globalIdx = TOOLS.indexOf(tool);
                const angle = (i / outer.length) * 360;
                return (
                  <ToolNode key={tool.name} tool={tool} angle={angle} index={globalIdx} hovered={hovered} onHover={setHovered} ringRadius="50%" ring="outer" />
                );
              })}
            </div>

            {/* Glow rings */}
            <div className="absolute inset-0 rounded-full" style={{ boxShadow: "inset 0 0 60px hsla(245,100%,71%,0.04)" }} />
          </div>
        </div>

        {/* Horizontal Strip */}
        <div className="relative group">
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div ref={stripRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x cursor-grab active:cursor-grabbing">
            {TOOLS.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="min-w-[220px] p-5 rounded-2xl border border-border bg-surface hover:border-orange/40 transition-all snap-start group/card hover:shadow-[0_0_20px_hsla(14,100%,50%,0.06)]"
                style={{ perspective: "600px" }}
              >
                <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center mb-3">
                  <div className="w-3 h-3 bg-orange rounded-full" />
                </div>
                <h3 className="font-semibold text-[15px] text-foreground mb-1">{tool.name}</h3>
                <p className="text-[13px] text-soft-gray leading-relaxed">{tool.desc}</p>
                <span className="inline-block mt-3 text-[11px] px-2.5 py-1 rounded-full bg-purple/10 text-purple border border-purple/20 font-medium">
                  {tool.model}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

interface ToolNodeProps {
  tool: { name: string; desc: string; model: string };
  angle: number;
  index: number;
  hovered: number | null;
  onHover: (i: number | null) => void;
  ringRadius: string;
  ring: "inner" | "outer";
}

const ToolNode = ({ tool, angle, index, hovered, onHover, ring }: ToolNodeProps) => {
  const isHovered = hovered === index;
  const translateDist = ring === "inner" ? "min(120px, 30vw)" : "min(180px, 42vw)";

  return (
    <div
      className="absolute top-1/2 left-1/2 w-8 h-8 sm:w-10 sm:h-10 -ml-4 -mt-4 sm:-ml-5 sm:-mt-5 cursor-pointer z-20"
      style={{ transform: `rotate(${angle}deg) translate(calc(${translateDist})) rotate(-${angle}deg)` }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <div className={`w-full h-full rounded-full border flex items-center justify-center transition-all duration-200 ${
        isHovered ? "border-orange bg-orange/15 scale-[1.4]" : "border-[hsla(0,0%,100%,0.1)] bg-[hsla(0,0%,100%,0.05)]"
      }`}>
        <div className={`w-2 h-2 rounded-full transition-colors ${isHovered ? "bg-orange" : "bg-soft-gray/40"}`} />
      </div>
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 p-4 rounded-xl glass z-30 pointer-events-none"
          >
            <p className="font-bold text-sm text-foreground">{tool.name}</p>
            <p className="text-xs text-soft-gray mt-1 leading-relaxed">{tool.desc}</p>
            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-purple/10 text-purple border border-purple/20">
              {tool.model}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
