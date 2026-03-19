import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";

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
  const [waitlistCount, setWaitlistCount] = useState<number>(247); // Fallback until fetched

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count: currentCount } = await supabase
          .from("waitlist_submissions")
          .select("*", { count: "exact", head: true });
        if (currentCount !== null && currentCount > 0) {
          setWaitlistCount(currentCount);
        }
      } catch (err) {
        console.error("Count error:", err);
      }
    };
    fetchCount();
  }, []);

  const stats = useMemo(() => [
    { value: 19, label: "TOOLS", color: "text-orange" },
    { value: 1, label: "PLATFORM", color: "text-purple" },
    { value: 24, label: "ACTIVE WORKFLOWS", color: "text-orange" },
    { value: waitlistCount, label: "CREATORS", color: "text-purple" },
  ], [waitlistCount]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      className="border-y border-border py-16 px-6"
      style={{ background: "linear-gradient(90deg, hsla(14,100%,50%,0.06), hsla(245,100%,71%,0.06), hsla(14,100%,50%,0.06))", backgroundSize: "200% 100%", animation: "shimmer 10s linear infinite" }}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1 }}
            className={i < stats.length - 1 ? "md:border-r md:border-border" : ""}
          >
            <p className={`text-5xl font-black ${s.color}`}>
              <Counter target={s.value} inView={inView} />
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-soft-gray mt-2">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
