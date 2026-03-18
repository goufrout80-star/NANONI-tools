import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    monthly: 19,
    features: ["5 AI tools", "100 generations/mo", "720p exports", "Email support", "1 brand profile"],
    popular: false,
  },
  {
    name: "Pro",
    monthly: 49,
    features: ["All 19 AI tools", "1,000 generations/mo", "4K exports", "Priority support", "5 brand profiles", "API access", "Custom presets"],
    popular: true,
  },
  {
    name: "Agency",
    monthly: 149,
    features: ["All 19 AI tools", "Unlimited generations", "4K+ exports", "Dedicated support", "Unlimited brands", "Full API access", "Team collaboration", "White-label exports"],
    popular: false,
  },
];

export const Pricing = () => {
  const [annual, setAnnual] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" className="py-24 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <p className="text-sm uppercase tracking-[0.2em] text-orange font-medium mb-4">Pricing</p>
        <h2 className="text-4xl sm:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>

        <div className="flex items-center gap-3 mb-12">
          <span className={`text-sm ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? "bg-orange" : "bg-muted"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground transition-transform ${annual ? "left-[26px]" : "left-0.5"}`} />
          </button>
          <span className={`text-sm ${annual ? "text-foreground" : "text-muted-foreground"}`}>
            Annual <span className="text-orange text-xs">Save 20%</span>
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6 overflow-x-auto scrollbar-hide">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-3xl border ${
                plan.popular ? "border-orange shadow-[0_0_30px_rgba(255,61,0,0.1)]" : "border-border"
              } bg-card min-w-[280px]`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-orange text-primary-foreground text-xs font-bold">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold text-foreground">
                  ${annual ? Math.round(plan.monthly * 0.8) : plan.monthly}
                </span>
                <span className="text-muted-foreground text-sm">/mo</span>
                <div className="mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange/10 text-orange font-medium">Coming Soon</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-orange shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/waitlist"
                className={`block text-center py-3 rounded-full font-semibold transition-all ${
                  plan.popular
                    ? "bg-orange text-primary-foreground hover:opacity-90"
                    : "border border-border text-foreground hover:border-orange hover:text-orange"
                }`}
              >
                Join Waitlist
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
