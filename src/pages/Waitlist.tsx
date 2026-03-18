import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TOOLS } from "@/lib/tools";

type Status = "idle" | "loading" | "success";

export default function Waitlist() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", email: "", role: "", source: "" });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.role) e.role = "Please select a role";
    if (!form.source) e.source = "Please select an option";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    console.log("Waitlist submission (UI only):", form);
    setTimeout(() => setStatus("success"), 1500);
  };

  const inputClass = (field: string) =>
    `w-full bg-[hsla(0,0%,100%,0.04)] border ${errors[field] ? "border-destructive" : "border-[hsla(0,0%,100%,0.1)]"} py-4 px-5 rounded-xl outline-none transition-all focus:border-orange focus:shadow-[0_0_0_3px_hsla(14,100%,50%,0.08)] text-foreground placeholder:text-soft-gray/50`;

  return (
    <div className="min-h-screen mesh-pattern">
      <Navbar />
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center min-h-[70vh]">
          {/* Left — Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-24 h-24 mx-auto mb-6 relative"
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <motion.circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="hsl(14,100%,50%)"
                        strokeWidth="3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.6 }}
                      />
                      <motion.path
                        d="M30 52L45 67L72 35"
                        fill="none"
                        stroke="hsl(14,100%,50%)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                      />
                    </svg>
                  </motion.div>
                  <h2 className="text-4xl font-black mb-3">You're on the list!</h2>
                  <p className="text-soft-gray text-lg">We'll notify you at launch. 🎉</p>
                </motion.div>
              ) : (
                <motion.div key="form" className="space-y-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-purple font-semibold mb-3">Early Access</p>
                    <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight mb-3">
                      Get Early Access
                    </h1>
                    <p className="text-soft-gray text-lg">Be the first to experience NANONI Studio.</p>
                  </div>

                  {/* Social proof */}
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {["bg-orange", "bg-purple", "bg-soft-gray", "bg-orange/60", "bg-purple/60"].map((bg, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full ${bg} border-2 border-background`} />
                      ))}
                    </div>
                    <span className="text-soft-gray text-sm">Join 247+ creators already on the list</span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                    {[
                      { key: "name", label: "Full Name", type: "text", placeholder: "Your name" },
                      { key: "email", label: "Email Address", type: "email", placeholder: "you@email.com" },
                    ].map((f, i) => (
                      <motion.div
                        key={f.key}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="space-y-1.5"
                      >
                        <label className="text-xs uppercase tracking-widest text-soft-gray">{f.label}</label>
                        <input
                          type={f.type}
                          placeholder={f.placeholder}
                          value={form[f.key as keyof typeof form]}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          className={inputClass(f.key)}
                        />
                        {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key]}</p>}
                      </motion.div>
                    ))}

                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="space-y-1.5">
                      <label className="text-xs uppercase tracking-widest text-soft-gray">Role</label>
                      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass("role")}>
                        <option value="">Select role...</option>
                        {["Designer", "Marketer", "Creator", "Developer", "Other"].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="space-y-1.5">
                      <label className="text-xs uppercase tracking-widest text-soft-gray">How did you hear about us?</label>
                      <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inputClass("source")}>
                        <option value="">Select...</option>
                        {["Twitter/X", "Instagram", "LinkedIn", "TikTok", "Google Search", "Friend/Referral", "Other"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {errors.source && <p className="text-xs text-destructive">{errors.source}</p>}
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.32 }}
                      disabled={status === "loading"}
                      className="w-full py-4 bg-orange text-primary-foreground font-bold rounded-full hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2 hover:shadow-[0_0_25px_hsla(14,100%,50%,0.3)]"
                    >
                      {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                      {status === "loading" ? "Joining..." : "Join the Waitlist →"}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right — Decorative */}
          <div className="hidden lg:flex flex-col items-center justify-center relative">
            <div className="relative w-80 h-80" style={{ animation: "float 6s ease-in-out infinite" }}>
              {/* Center logo */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="relative">
                  <div className="absolute inset-0 blur-[50px] rounded-full bg-orange/20 scale-[2]" />
                  <div className="absolute inset-0 blur-[80px] rounded-full bg-purple/10 scale-[2.5]" />
                  <div className="p-8 rounded-full bg-background border border-[hsla(0,0%,100%,0.08)] relative">
                    <Logo className="w-16 h-16" glow />
                  </div>
                </div>
              </div>
              {/* Ring */}
              <div className="absolute inset-0 border border-dashed border-[hsla(0,0%,100%,0.06)] rounded-full animate-orbit-slow">
                {TOOLS.slice(0, 6).map((_, i) => {
                  const angle = (i / 6) * 360;
                  return (
                    <div key={i} className="absolute w-6 h-6 top-1/2 left-1/2 -ml-3 -mt-3" style={{ transform: `rotate(${angle}deg) translateX(155px) rotate(-${angle}deg)` }}>
                      <div className="w-full h-full rounded-full bg-[hsla(0,0%,100%,0.04)] border border-[hsla(0,0%,100%,0.1)]" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Counter badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute bottom-8 right-8 glass rounded-2xl p-6"
            >
              <p className="text-4xl font-black text-orange">247<span className="text-purple">+</span></p>
              <p className="text-xs uppercase tracking-[0.15em] text-soft-gray mt-1">Creators Waiting</p>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
