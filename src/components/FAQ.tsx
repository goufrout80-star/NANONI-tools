import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  { q: "What is NANONI Studio?", a: "NANONI Studio is an AI-powered creative platform with 19 specialized tools for designers, marketers, creators, and brands. From face swapping to ad generation, it's everything you need in one place." },
  { q: "When will it launch?", a: "We're currently in private beta. Join the waitlist to be among the first to get access when we launch publicly in 2026." },
  { q: "What tools are included?", a: "19 tools including Face Swap, Relight, Cloth Swap, AI Upscaler, Style Fusion, Storyboard Generator, Ad Pack Generator, PostFlow, and many more." },
  { q: "How does Brand DNA work?", a: "Brand DNA analyzes your brand assets — logos, colors, fonts, tone — and creates a unified profile that all 19 tools use to keep your output consistent." },
  { q: "Is there a free plan?", a: "We'll offer a free trial so you can experience the platform. Detailed pricing will be announced closer to launch." },
  { q: "How do I join the waitlist?", a: "Click the 'Join Waitlist' button anywhere on the site and fill in your details. You'll be among the first to know when we launch." },
  { q: "What happens after I sign up?", a: "You'll receive early access, exclusive updates, and the opportunity to shape the platform with your feedback during our beta period." },
  { q: "Will my data be safe?", a: "Absolutely. We use enterprise-grade encryption, never share your data with third parties, and comply with GDPR and SOC 2 standards." },
];

export const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-sm uppercase tracking-[0.2em] text-orange font-medium mb-4">FAQ</p>
        <h2 className="text-4xl sm:text-5xl font-bold mb-12">Got Questions?</h2>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border border-border rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-card transition-colors"
              >
                <span className="font-medium text-foreground">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform shrink-0 ${open === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
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
