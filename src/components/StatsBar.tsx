import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
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

const STATS = [
  {
    value: 19,
    suffix: "",
    label: "TOOLS",
    numberStyle: { color: "#FF3D00" },
  },
  {
    value: 1,
    suffix: "",
    label: "PLATFORM",
    numberStyle: { color: "#FF3D00" },
  },
  {
    value: null,
    text: "Gemini",
    label: "POWERED BY",
    numberStyle: { color: "#7A6FFF" },
  },
  {
    value: null,
    text: "Creators",
    label: "BUILT FOR",
    numberStyle: { color: "#F5F0EB" },
  },
];

export const StatsBar = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count: currentCount } = await supabase
          .from("waitlist_submissions")
          .select("*", { count: "exact", head: true });
        if (currentCount !== null) setWaitlistCount(currentCount);
      } catch {
        // silent
      }
    };
    fetchCount();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.02)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 0",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          maxWidth: "1024px",
          margin: "0 auto",
          padding: "0 24px",
        }}
        className="md:grid-cols-4"
      >
        {STATS.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1 }}
            style={{
              textAlign: "center",
              padding: "16px 24px",
              borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              position: "relative",
            }}
          >
            {/* Vertical divider on mobile: remove right border for 2nd item */}
            <p
              style={{
                fontSize: "40px",
                fontWeight: 900,
                lineHeight: 1,
                marginBottom: "8px",
                fontFamily: "Inter, sans-serif",
                ...s.numberStyle,
              }}
            >
              {s.value !== null ? (
                <>
                  <Counter target={s.value} inView={inView} />
                </>
              ) : s.label === "POWERED BY" ? (
                "Gemini"
              ) : s.label === "BUILT FOR" ? (
                "Creators"
              ) : (
                s.text
              )}
              {s.label === "TOOLS" || s.label === "PLATFORM" ? (
                <span style={{ fontSize: "22px", fontWeight: 700, marginLeft: "2px" }}>
                  {s.label === "TOOLS" ? "" : ""}
                </span>
              ) : null}
              {s.label === "CREATORS" && waitlistCount !== null && (
                <span style={{ fontSize: "22px", color: "#7A6FFF" }}>+</span>
              )}
            </p>
            <p
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "#A0A0A0",
                fontFamily: "inherit",
              }}
            >
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
