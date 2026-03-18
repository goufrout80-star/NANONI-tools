import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

const CYCLE_WORDS = [
  "Face Swap", "Brand DNA", "Ad Pack Generator", "PostFlow",
  "AI Upscaler", "Style Fusion", "Relight", "Cloth Swap", "Storyboard Generator"
];

const wordVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.3 + i * 0.15, duration: 0.6, ease: "easeOut" }
  }),
};

export const Hero = () => {
  const [cycleIdx, setCycleIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCycleIdx((i) => (i + 1) % CYCLE_WORDS.length), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="hero" className="min-h-screen pt-32 pb-20 px-6 flex items-center mesh-pattern">
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div className="space-y-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm uppercase tracking-[0.2em] text-orange font-medium"
          >
            AI Creative Platform
          </motion.p>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.95]">
            {["Design Smarter.", "Brand Faster."].map((word, i) => (
              <motion.span
                key={word}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={wordVariants}
                className={`block ${i === 1 ? "italic font-light" : ""}`}
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              custom={2}
              initial="hidden"
              animate="visible"
              variants={wordVariants}
              className="block font-dancing text-orange"
            >
              Create Everything.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-muted-foreground text-lg max-w-md"
          >
            19 AI-powered creative tools. One unified platform. Built for agencies, creators, and brands.
          </motion.p>

          {/* Typewriter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="h-8 flex items-center gap-2"
          >
            <span className="text-sm text-muted-foreground">Try:</span>
            <motion.span
              key={cycleIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm font-semibold text-orange"
            >
              {CYCLE_WORDS[cycleIdx]}
            </motion.span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              to="/waitlist"
              className="px-8 py-4 rounded-full bg-orange text-primary-foreground font-bold text-lg hover:scale-[1.02] active:scale-95 transition-transform"
            >
              Join the Waitlist
            </Link>
            <button
              onClick={() => document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-4 rounded-full border border-border text-foreground font-medium hover:border-orange hover:text-orange transition-colors"
            >
              See the Tools ↓
            </button>
          </motion.div>
        </div>

        {/* Right — Mini orbital */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="hidden lg:flex items-center justify-center"
        >
          <div className="relative w-80 h-80">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-6 rounded-full bg-background border border-border shadow-[0_0_60px_rgba(255,61,0,0.15)]">
                <Logo className="w-14 h-14" />
              </div>
            </div>
            <div className="absolute inset-0 border border-border/50 rounded-full animate-[orbit_20s_linear_infinite]">
              {[0, 90, 180, 270].map((deg) => (
                <div
                  key={deg}
                  className="absolute w-3 h-3 bg-orange/60 rounded-full top-1/2 left-1/2 -ml-1.5 -mt-1.5"
                  style={{ transform: `rotate(${deg}deg) translateX(160px)` }}
                />
              ))}
            </div>
            <div className="absolute inset-[15%] border border-border/30 rounded-full animate-[orbit_14s_linear_infinite_reverse]">
              {[45, 165, 285].map((deg) => (
                <div
                  key={deg}
                  className="absolute w-2 h-2 bg-orange/40 rounded-full top-1/2 left-1/2 -ml-1 -mt-1"
                  style={{ transform: `rotate(${deg}deg) translateX(100px)` }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
