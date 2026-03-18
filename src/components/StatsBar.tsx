import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const STATS = [
  { value: 19, label: "Tools" },
  { value: 1, label: "Platform" },
  { value: 0, label: "Powered by Gemini", isText: true },
  { value: 0, label: "Built for Creators", isText: true },
];

const Counter = ({ target, inView }: { target: number; inView: boolean }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const step = (timestamp: number) => {
      start = start || timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);
  return <span>{count}</span>;
};

export const StatsBar = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      className="border-y border-border py-12 px-6"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {STATS.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1 }}
          >
            {s.isText ? (
              <p className="text-lg font-bold text-foreground">{s.label}</p>
            ) : (
              <>
                <p className="text-4xl font-bold text-orange">
                  <Counter target={s.value} inView={inView} />
                </p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
