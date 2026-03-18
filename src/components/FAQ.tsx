import { useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef } from "react";

const FAQS = [
  { q: "What is NANONI Studio?", a: "NANONI Studio is an AI-powered creative platform with 19 specialized tools for designers, marketers, creators, and brands. From face swapping to ad generation, it's everything you need in one unified workspace." },
  { q: "When will it launch?", a: "We're currently in private beta. Join the waitlist to be among the first to get access when we launch publicly in 2026." },
  { q: "What tools are included?", a: "19 tools including Face Swap V1 & V2, Relight, Cloth Swap, AI Upscaler, Style Fusion, Storyboard Generator, Ad Pack Generator, PostFlow, Camera Shot Simulator, and many more." },
  { q: "How does Brand DNA work?", a: "Brand DNA analyzes your brand assets — logos, colors, fonts, tone — and creates a unified profile that all 19 tools reference to keep your creative output perfectly consistent." },
  { q: "Is there a free plan?", a: "We'll offer a free trial so you can experience the platform before committing. Detailed pricing tiers will be announced closer to launch." },
  { q: "How do I join the waitlist?", a: "Click the 'Join Waitlist' button anywhere on the site. Fill in your details and you'll be among the first to know when we launch." },
  { q: "What happens after I sign up?", a: "You'll receive priority early access, exclusive platform updates, and the opportunity to shape NANONI Studio with your feedback during our beta period." },
  { q: "Will my data be safe?", a: "Absolutely. We use enterprise-grade encryption, never share your data with third parties, and comply with GDPR and SOC 2 standards. Your creative assets remain yours." },
];

export const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="faq" className="py-32 px-6" ref={ref}>
      <div className="max-w-[800px] mx-auto">
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} className="text-xs uppercase tracking-[0.2em] text-purple font-semibold mb-4">
          FAQ
        </motion.p>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-4xl sm:text-5xl lg:text-6xl font-black mb-16">
          Got Questions?
        </motion.h2>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.04 }}
              className={`border-b border-border overflow-hidden transition-colors ${open === i ? "bg-[hsla(0,0%,100%,0.02)]" : ""}`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-5 px-1 text-left group"
                aria-expanded={open === i}
              >
                <span className={`font-semibold text-[17px] transition-colors ${open === i ? "text-orange" : "text-foreground group-hover:text-foreground"}`}>
                  {faq.q}
                </span>
                <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDown className="w-5 h-5 text-soft-gray shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="px-1 pb-5 text-soft-gray text-[15px] leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
