import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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
    setTimeout(() => setStatus("success"), 1500);
  };

  const fieldClass = (field: string) =>
    `w-full bg-card border ${errors[field] ? "border-destructive" : "border-border"} p-4 rounded-2xl outline-none transition-colors focus:border-orange text-foreground`;

  return (
    <div className="min-h-screen mesh-pattern">
      <Navbar />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          {/* Left — Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange flex items-center justify-center"
                  >
                    <Check className="w-10 h-10 text-primary-foreground" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-3">You're on the list!</h2>
                  <p className="text-muted-foreground">We'll be in touch soon 🎉</p>
                </motion.div>
              ) : (
                <motion.div key="form">
                  <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter mb-4">
                    Get Early <span className="italic font-light">Access</span>
                  </h1>
                  <p className="text-muted-foreground mb-10">Be the first to experience NANONI Studio.</p>

                  <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
                    {[
                      { key: "name", label: "Full Name", type: "text" },
                      { key: "email", label: "Email Address", type: "email" },
                    ].map((f, i) => (
                      <motion.div
                        key={f.key}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="space-y-1.5"
                      >
                        <label className="text-xs uppercase tracking-widest text-muted-foreground">{f.label}</label>
                        <input
                          type={f.type}
                          value={form[f.key as keyof typeof form]}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          className={fieldClass(f.key)}
                        />
                        {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key]}</p>}
                      </motion.div>
                    ))}

                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-1.5">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">Role</label>
                      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={fieldClass("role")}>
                        <option value="">Select role...</option>
                        {["Designer", "Marketer", "Creator", "Developer", "Other"].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-1.5">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">How did you hear about us?</label>
                      <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={fieldClass("source")}>
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
                      transition={{ delay: 0.4 }}
                      disabled={status === "loading"}
                      className="w-full py-4 bg-orange text-primary-foreground font-bold rounded-full hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                      {status === "loading" ? "Encrypting..." : "Join the Waitlist"}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right — Decorative */}
          <div className="hidden lg:flex flex-col items-center justify-center relative">
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-6 rounded-full bg-background border border-border shadow-[0_0_50px_rgba(255,61,0,0.15)]">
                  <Logo className="w-14 h-14" />
                </div>
              </div>
              <div className="absolute inset-0 border border-border/40 rounded-full animate-[orbit_20s_linear_infinite]">
                {[0, 120, 240].map((deg) => (
                  <div key={deg} className="absolute w-3 h-3 bg-orange/50 rounded-full top-1/2 left-1/2 -ml-1.5 -mt-1.5" style={{ transform: `rotate(${deg}deg) translateX(144px)` }} />
                ))}
              </div>
            </div>
            <div className="absolute bottom-10 right-10 bg-orange text-primary-foreground p-6 rounded-2xl shadow-2xl">
              <p className="text-4xl font-bold">247</p>
              <p className="text-xs uppercase tracking-widest opacity-80">Creators Waiting</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
