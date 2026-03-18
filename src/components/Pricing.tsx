import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    features: ["5 AI tools", "100 generations/mo", "720p exports", "Email support", "1 brand profile"],
    accent: "gray" as const,
  },
  {
    name: "Pro",
    features: ["All 19 AI tools", "1,000 generations/mo", "4K exports", "Priority support", "5 brand profiles", "API access", "Custom presets"],
    accent: "orange" as const,
    popular: true,
  },
  {
    name: "Agency",
    features: ["All 19 AI tools", "Unlimited generations", "4K+ exports", "Dedicated support", "Unlimited brands", "Full API access", "Team collaboration", "White-label exports"],
    accent: "purple" as const,
  },
];

export const Pricing = () => {
  const [annual, setAnnual] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" className="py-32 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} className="text-xs uppercase tracking-[0.2em] text-purple font-semibold mb-4">
          Pricing
        </motion.p>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
          Simple, Transparent Pricing
        </motion.h2>

        {/* Toggle */}
        <div className="flex items-center gap-3 mb-16">
          <span className={`text-sm ${!annual ? "text-foreground" : "text-soft-gray"}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? "bg-orange" : "bg-muted"}`}
            aria-label="Toggle billing period"
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground transition-transform ${annual ? "left-[26px]" : "left-0.5"}`} />
          </button>
          <span className={`text-sm ${annual ? "text-foreground" : "text-soft-gray"}`}>
            Annual
          </span>
          {annual && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-purple/10 text-purple border border-purple/20 font-semibold">
              Save 20%
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => {
            const isOrange = plan.accent === "orange";
            const isPurple = plan.accent === "purple";
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                className={`relative p-8 rounded-3xl border min-w-[280px] transition-all hover:shadow-lg ${
                  isOrange
                    ? "border-orange bg-[hsla(14,100%,50%,0.04)] shadow-[0_0_40px_hsla(14,100%,50%,0.08)] scale-[1.02] md:scale-105"
                    : isPurple
                    ? "border-[hsla(245,100%,71%,0.25)] bg-[hsla(245,100%,71%,0.04)]"
                    : "border-border bg-surface"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-orange text-primary-foreground text-xs font-bold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-4">{plan.name}</h3>
                <div className="mb-6">
                  <span className={`inline-block text-sm px-3 py-1.5 rounded-full font-semibold ${
                    isOrange ? "bg-orange/10 text-orange" : "bg-purple/10 text-purple"
                  }`}>
                    Coming Soon
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-soft-gray">
                      <Check className={`w-4 h-4 shrink-0 ${isOrange ? "text-orange" : isPurple ? "text-purple" : "text-soft-gray"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/waitlist"
                  className={`block text-center py-3.5 rounded-full font-semibold transition-all ${
                    isOrange
                      ? "bg-orange text-primary-foreground hover:scale-[1.02] hover:shadow-[0_0_20px_hsla(14,100%,50%,0.3)]"
                      : "border border-border text-foreground hover:border-purple hover:text-purple"
                  }`}
                >
                  Join Waitlist
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
