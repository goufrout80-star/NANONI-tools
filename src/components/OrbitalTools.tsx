import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { TOOLS } from "@/lib/tools";

export const OrbitalTools = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const inner = TOOLS.filter((t) => t.ring === "inner");
  const outer = TOOLS.filter((t) => t.ring === "outer");

  return (
    <section id="features" className="py-24 px-6 mesh-pattern">
      <div className="max-w-7xl mx-auto">
        <p className="text-sm uppercase tracking-[0.2em] text-orange font-medium mb-4">The Tools</p>
        <h2 className="text-4xl sm:text-5xl font-bold mb-16">Every Tool You Need</h2>

        <div className="flex justify-center mb-20">
          <div className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px]">
            {/* Center */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="p-5 sm:p-8 rounded-full bg-background border border-border shadow-[0_0_50px_rgba(255,61,0,0.2)]">
                <Logo className="w-10 h-10 sm:w-16 sm:h-16" />
              </div>
            </div>

            {/* Inner ring */}
            <div
              className="absolute inset-[20%] border border-border/40 rounded-full"
              style={{
                animation: hovered !== null && TOOLS[hovered]?.ring === 'inner' ? 'none' : 'orbit 30s linear infinite',
              }}
            >
              {inner.map((tool, i) => {
                const globalIdx = TOOLS.indexOf(tool);
                const angle = (i / inner.length) * 360;
                return (
                  <ToolNode
                    key={tool.name}
                    tool={tool}
                    angle={angle}
                    radius="50%"
                    index={globalIdx}
                    hovered={hovered}
                    onHover={setHovered}
                  />
                );
              })}
            </div>

            {/* Outer ring */}
            <div
              className="absolute inset-0 border border-border/20 rounded-full"
              style={{
                animation: hovered !== null && TOOLS[hovered]?.ring === 'outer' ? 'none' : 'orbit 50s linear infinite',
              }}
            >
              {outer.map((tool, i) => {
                const globalIdx = TOOLS.indexOf(tool);
                const angle = (i / outer.length) * 360;
                return (
                  <ToolNode
                    key={tool.name}
                    tool={tool}
                    angle={angle}
                    radius="50%"
                    index={globalIdx}
                    hovered={hovered}
                    onHover={setHovered}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Horizontal strip */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x">
            {TOOLS.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="min-w-[260px] p-5 rounded-2xl border border-border bg-card hover:border-orange/50 transition-colors snap-start"
              >
                <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center mb-3">
                  <div className="w-2 h-2 bg-orange rounded-full" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{tool.name}</h3>
                <p className="text-sm text-muted-foreground">{tool.desc}</p>
                <span className="text-xs text-orange mt-2 inline-block">{tool.model}</span>
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
  radius: string;
  index: number;
  hovered: number | null;
  onHover: (i: number | null) => void;
}

const ToolNode = ({ tool, angle, index, hovered, onHover }: ToolNodeProps) => {
  const isHovered = hovered === index;
  return (
    <div
      className="absolute top-1/2 left-1/2 w-8 h-8 sm:w-10 sm:h-10 -ml-4 -mt-4 sm:-ml-5 sm:-mt-5 cursor-pointer z-20"
      style={{
        transform: `rotate(${angle}deg) translate(calc(min(150px, 38vw))) rotate(-${angle}deg)`,
      }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <div className={`w-full h-full rounded-xl border flex items-center justify-center transition-all ${
        isHovered ? "border-orange bg-orange/10 scale-125" : "border-border bg-card"
      }`}>
        <div className={`w-2 h-2 rounded-full transition-colors ${isHovered ? "bg-orange" : "bg-muted-foreground"}`} />
      </div>
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 rounded-xl glass z-30 pointer-events-none"
          >
            <p className="font-semibold text-sm text-foreground">{tool.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
            <p className="text-xs text-orange mt-1">{tool.model}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
