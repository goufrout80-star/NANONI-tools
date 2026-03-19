import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Logo } from "./Logo";
import { TOOLS } from "@/lib/tools";
import { ChevronLeft, ChevronRight, Sparkles, Camera, Wand2, Palette, Scissors, ImagePlus, ScanSearch, Eraser, Clapperboard, Workflow, Layers3, Brush, Aperture } from "lucide-react";

const TOOL_ICON_SET = [Sparkles, Camera, Wand2, Palette, Scissors, ImagePlus, ScanSearch, Eraser, Clapperboard, Workflow, Layers3, Brush, Aperture];

export const OrbitalTools = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [autoHovered, setAutoHovered] = useState<number | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const inner = TOOLS.filter((t) => t.ring === "inner");
  const outer = TOOLS.filter((t) => t.ring === "outer");
  const stripRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  const activeHover = hovered ?? autoHovered;

  useEffect(() => {
    if (hovered !== null) {
      setAutoHovered(null);
      setIsUserInteracting(true);
      return;
    }

    const idleTimer = window.setTimeout(() => setIsUserInteracting(false), 3000);
    return () => window.clearTimeout(idleTimer);
  }, [hovered]);

  useEffect(() => {
    if (isUserInteracting) {
      return;
    }

    const interval = window.setInterval(() => {
      const randomIndex = Math.floor(Math.random() * TOOLS.length);
      setAutoHovered(randomIndex);
      window.setTimeout(() => setAutoHovered(null), 3000);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isUserInteracting]);

  const scroll = (dir: number) => {
    stripRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    let animationId: number;
    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    // Auto-scroll logic
    const step = () => {
      if (!isDown) {
        strip.scrollLeft += 1; // Speed of auto-scroll
        if (strip.scrollLeft >= strip.scrollWidth - strip.clientWidth) {
          strip.scrollLeft = 0; // Reset to beginning when reaching the end
        }
      }
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);

    // Pause on hover
    const handleMouseEnter = () => cancelAnimationFrame(animationId);
    const handleMouseLeave = () => {
      isDown = false;
      animationId = requestAnimationFrame(step);
    };

    // Drag to scroll logic
    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      strip.classList.add('active');
      startX = e.pageX - strip.offsetLeft;
      scrollLeft = strip.scrollLeft;
      cancelAnimationFrame(animationId);
    };

    const handleMouseUp = () => {
      isDown = false;
      strip.classList.remove('active');
      animationId = requestAnimationFrame(step);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - strip.offsetLeft;
      const walk = (x - startX) * 2; // Scroll-fast
      strip.scrollLeft = scrollLeft - walk;
    };

    strip.addEventListener('mouseenter', handleMouseEnter);
    strip.addEventListener('mouseleave', handleMouseLeave);
    strip.addEventListener('mousedown', handleMouseDown);
    strip.addEventListener('mouseup', handleMouseUp);
    strip.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      strip.removeEventListener('mouseenter', handleMouseEnter);
      strip.removeEventListener('mouseleave', handleMouseLeave);
      strip.removeEventListener('mousedown', handleMouseDown);
      strip.removeEventListener('mouseup', handleMouseUp);
      strip.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

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
                animation: activeHover !== null ? "none" : "orbit 20s linear infinite",
              }}
            >
              {inner.map((tool, i) => {
                const globalIdx = TOOLS.indexOf(tool);
                const angle = (i / inner.length) * 360;
                return (
                  <ToolNode key={tool.name} tool={tool} angle={angle} index={globalIdx} hovered={activeHover} onHover={setHovered} ringRadius="50%" ring="inner" />
                );
              })}
            </div>

            {/* Outer ring */}
            <div
              className="absolute inset-0 border border-dashed border-[hsla(245,100%,71%,0.06)] rounded-full"
              style={{
                animation: activeHover !== null ? "none" : "orbit 35s linear infinite reverse",
              }}
            >
              {outer.map((tool, i) => {
                const globalIdx = TOOLS.indexOf(tool);
                const angle = (i / outer.length) * 360;
                return (
                  <ToolNode key={tool.name} tool={tool} angle={angle} index={globalIdx} hovered={activeHover} onHover={setHovered} ringRadius="50%" ring="outer" />
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
            {TOOLS.map((tool, i) => {
              const Icon = TOOL_ICON_SET[i % TOOL_ICON_SET.length];
              return (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                  className="min-w-[220px] p-5 rounded-2xl border border-border bg-surface hover:border-orange/40 transition-all duration-300 snap-start group/card hover:-translate-y-1 hover:shadow-[0_8px_30px_hsla(14,100%,50%,0.12)] cursor-pointer"
                  style={{ perspective: "600px" }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange/10 to-purple/10 border border-white/5 flex items-center justify-center mb-4 group-hover/card:scale-110 group-hover/card:border-orange/30 group-hover/card:bg-orange/20 transition-all duration-300">
                    <Icon className="w-5 h-5 text-soft-gray group-hover/card:text-orange transition-colors duration-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold text-[16px] text-foreground mb-1.5 group-hover/card:text-orange transition-colors">{tool.name}</h3>
                  <p className="text-[13px] text-soft-gray leading-relaxed">{tool.desc}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-block text-[11px] px-2.5 py-1 rounded-full bg-purple/10 text-purple border border-purple/20 font-medium">
                      {tool.model}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center opacity-0 -translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all duration-300">
                      <ChevronRight className="w-3.5 h-3.5 text-orange" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
  const Icon = TOOL_ICON_SET[index % TOOL_ICON_SET.length];

  return (
    <div
      className="absolute top-1/2 left-1/2 w-8 h-8 sm:w-10 sm:h-10 -ml-4 -mt-4 sm:-ml-5 sm:-mt-5 cursor-pointer z-20"
      style={{ transform: `rotate(${angle}deg) translate(calc(${translateDist})) rotate(-${angle}deg)` }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <div className={`w-full h-full rounded-full border flex items-center justify-center transition-all duration-200 ${
        isHovered
          ? "border-orange scale-[1.28] shadow-[0_0_24px_hsla(14,100%,50%,0.3)]"
          : "border-[hsla(0,0%,100%,0.1)] bg-[linear-gradient(135deg,hsla(14,100%,50%,0.14),hsla(245,100%,71%,0.14),hsla(14,100%,50%,0.14))]"
      }`}>
        <div
          className={`w-full h-full rounded-full flex items-center justify-center ${isHovered ? "bg-[linear-gradient(135deg,hsla(14,100%,50%,0.25),hsla(245,100%,71%,0.25))]" : "bg-[length:200%_200%] animate-[shimmer_4s_ease_infinite]"}`}
        >
          <Icon className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-colors ${isHovered ? "text-orange" : "text-soft-gray"}`} strokeWidth={2} />
        </div>
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
