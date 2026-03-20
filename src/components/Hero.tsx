import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { TOOLS } from "@/lib/tools";
import { supabase } from "@/lib/supabase";

const CYCLE_WORDS = ["Face Swap", "Brand DNA", "PostFlow", "Ad Packs", "Relighting", "Style Fusion"];

const wordReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.4 + i * 0.18, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }
  }),
};

export const Hero = () => {
  const [cycleIdx, setCycleIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count: currentCount } = await supabase
          .from("waitlist_submissions")
          .select("*", { count: "exact", head: true });
        setCount(currentCount || 0);
      } catch (err) {
        console.error("Count error:", err);
      }
    };
    fetchCount();
  }, []);

  useEffect(() => {
    const word = CYCLE_WORDS[cycleIdx];
    const speed = isDeleting ? 40 : 80;

    if (!isDeleting && displayText === word) {
      const pause = setTimeout(() => setIsDeleting(true), 1500);
      return () => clearTimeout(pause);
    }
    if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setCycleIdx((i) => (i + 1) % CYCLE_WORDS.length);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayText(isDeleting ? word.slice(0, displayText.length - 1) : word.slice(0, displayText.length + 1));
    }, speed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, cycleIdx]);

  const inner = TOOLS.filter(t => t.ring === "inner");
  const outer = TOOLS.filter(t => t.ring === "outer");

  return (
    <section id="hero" className="min-h-screen pt-28 pb-24 px-6 flex items-center relative overflow-hidden">
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[55%_45%] gap-12 lg:gap-8 items-center">
        {/* Left */}
        <div className="space-y-8 relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-purple text-xs tracking-[0.15em] uppercase font-semibold"
            style={{
              background: "hsla(245,100%,71%,0.08)",
              border: "1px solid hsla(245,100%,71%,0.25)",
              backgroundSize: "200% auto",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-purple" aria-hidden="true"><path d="M5 0L6.2 3.8L10 5L6.2 6.2L5 10L3.8 6.2L0 5L3.8 3.8Z"/></svg>
            AI Creative Platform
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[96px] font-black leading-[0.92] tracking-tighter">
            <motion.span custom={0} initial="hidden" animate="visible" variants={wordReveal} className="block">
              Design Smarter.
            </motion.span>
            <motion.span custom={1} initial="hidden" animate="visible" variants={wordReveal} className="block italic pl-2 lg:pl-4">
              Brand Faster.
            </motion.span>
            <motion.span custom={2} initial="hidden" animate="visible" variants={wordReveal} className="block font-dancing text-orange text-[1.1em]">
              Create Everything.
            </motion.span>
          </h1>

          {/* Typewriter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="flex items-baseline gap-3"
          >
            <span className="text-soft-gray text-base">Powered for →</span>
            <span className="text-2xl sm:text-3xl font-bold text-orange min-w-[200px]">
              {displayText}
              <span className="inline-block w-[2px] h-[1em] bg-purple ml-0.5 align-baseline" style={{ animation: "blink 1s step-end infinite" }} />
            </span>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="text-soft-gray text-lg max-w-[480px] leading-relaxed"
          >
            19 AI-powered creative tools. One unified platform. Built for agencies, creators, and brands.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              to="/waitlist"
              className="group px-8 py-4 rounded-full bg-orange text-primary-foreground font-semibold text-base hover:scale-[1.04] active:scale-95 transition-all hover:shadow-[0_0_30px_hsla(14,100%,50%,0.3)]"
            >
              Join the Waitlist →
            </Link>
            <button
              onClick={() => document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-4 rounded-full border border-[hsla(0,0%,100%,0.15)] text-foreground font-medium hover:border-purple hover:text-purple transition-colors"
            >
              Explore Tools ↓
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="flex items-center gap-3 pt-2"
          >
            {count !== null && count > 0 ? (
              <>
                <div className="flex -space-x-2">
                  {["bg-orange", "bg-purple", "bg-soft-gray", "bg-orange/60", "bg-purple/60"].map((bg, i) => (
                    <div key={i} className={`w-7 h-7 rounded-full ${bg} border-2 border-background`} />
                  ))}
                </div>
                <span className="text-soft-gray text-sm">{count}+ creators already on the waitlist</span>
              </>
            ) : (
              <span className="text-orange font-medium text-sm">Be the first to join the waitlist!</span>
            )}
          </motion.div>
        </div>

        {/* Right — Mini orbital */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="hidden lg:flex items-center justify-center"
          style={{ animation: "float 6s ease-in-out infinite" }}
        >
          <div className="relative w-[340px] h-[340px]">
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <motion.div
                layoutId="nanoni-logo-handoff-shell"
                transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.9 }}
                className="relative p-7 rounded-full bg-background border border-[hsla(0,0%,100%,0.1)] shadow-[0_0_60px_hsla(14,100%,50%,0.15)]"
                animate={{ y: [0, -7, 0], scale: [1, 1.02, 1] }}
                style={{ willChange: "transform" }}
              >
                <motion.div
                  layoutId="nanoni-logo-handoff-glow"
                  className="absolute inset-0 blur-3xl rounded-full bg-orange/20 scale-150"
                  animate={{ opacity: [0.35, 0.65, 0.35] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-[-24px] rounded-full border border-orange/20"
                  animate={{ scale: [0.8, 1.45], opacity: [0, 0.6, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-[-40px] rounded-full border border-purple/20"
                  animate={{ scale: [0.7, 1.55], opacity: [0, 0.45, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
                />
                <motion.div
                  className="absolute inset-[-12px] rounded-full"
                  style={{ background: "conic-gradient(from 0deg, hsla(14,100%,50%,0.45), hsla(245,100%,71%,0.45), hsla(14,100%,50%,0.45))", filter: "blur(10px)" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <motion.div layoutId="nanoni-logo-handoff-mark" className="relative z-10">
                  <Logo className="w-16 h-16" glow />
                </motion.div>
              </motion.div>
            </div>

            <div
              className="absolute inset-[18%] border border-dashed border-[hsla(0,0%,100%,0.08)] rounded-full animate-orbit-fast"
            >
              {inner.slice(0, 6).map((_, i) => {
                const angle = (i / 6) * 360;
                return (
                  <div
                    key={i}
                    className="absolute w-8 h-8 top-1/2 left-1/2 -ml-4 -mt-4"
                    style={{ transform: `rotate(${angle}deg) translateX(85px) rotate(-${angle}deg)` }}
                  >
                    <motion.div
                      className="w-full h-full rounded-full bg-[hsla(0,0%,100%,0.05)] border border-[hsla(0,0%,100%,0.1)] flex items-center justify-center"
                      animate={{
                        scale: [1, 1.14, 1],
                        borderColor: ["hsla(0,0%,100%,0.1)", "hsla(14,100%,50%,0.45)", "hsla(0,0%,100%,0.1)"],
                        boxShadow: [
                          "0 0 0 hsla(14,100%,50%,0)",
                          "0 0 14px hsla(14,100%,50%,0.32)",
                          "0 0 0 hsla(14,100%,50%,0)"
                        ],
                      }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                    >
                      <motion.div
                        className="w-2 h-2 rounded-full bg-orange/60"
                        animate={{ scale: [1, 1.25, 1], opacity: [0.55, 1, 0.55] }}
                        transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                      />
                    </motion.div>
                  </div>
                );
              })}
            </div>

            <div
              className="absolute inset-0 border border-dashed border-[hsla(245,100%,71%,0.08)] rounded-full animate-orbit-slow"
              style={{ animationDirection: "reverse" }}
            >
              {outer.slice(0, 8).map((_, i) => {
                const angle = (i / 8) * 360;
                return (
                  <div
                    key={i}
                    className="absolute w-7 h-7 top-1/2 left-1/2 -ml-3.5 -mt-3.5"
                    style={{ transform: `rotate(${angle}deg) translateX(165px) rotate(-${angle}deg)` }}
                  >
                    <motion.div
                      className="w-full h-full rounded-full bg-[hsla(0,0%,100%,0.04)] border border-[hsla(245,100%,71%,0.12)] flex items-center justify-center"
                      animate={{
                        scale: [1, 1.16, 1],
                        borderColor: ["hsla(245,100%,71%,0.12)", "hsla(245,100%,71%,0.45)", "hsla(245,100%,71%,0.12)"],
                        boxShadow: [
                          "0 0 0 hsla(245,100%,71%,0)",
                          "0 0 12px hsla(245,100%,71%,0.3)",
                          "0 0 0 hsla(245,100%,71%,0)"
                        ],
                      }}
                      transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.14 }}
                    >
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-purple/50"
                        animate={{ scale: [1, 1.25, 1], opacity: [0.45, 1, 0.45] }}
                        transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.14 }}
                      />
                    </motion.div>
                  </div>
                );
              })}
            </div>

            <div className="absolute inset-0 rounded-full" style={{ boxShadow: "inset 0 0 40px hsla(245,100%,71%,0.05)" }} />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
