import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Logo } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TOOLS } from "@/lib/tools";
import { supabase } from "@/lib/supabase";
import { submitWaitlist } from "@/lib/waitlist";
import { VerificationModal } from "@/components/VerificationModal";
import { CustomSelect } from "@/components/ui/CustomSelect";

type Status = "idle" | "loading" | "success";

export default function Waitlist() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", role: "", source: "" });
  const [count, setCount] = useState<number | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count: currentCount } = await supabase
          .from("waitlist_submissions")
          .select("*", { count: "exact", head: true });
        setCount(currentCount || 0);
      } catch {
        // silent
      }
    };
    fetchCount();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2) e.name = "Please enter your full name";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email address";
    if (!form.role) e.role = "Please select your role";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setCaptchaError("");
    
    if (!validate()) return;
    
    if (!captchaToken) {
      setCaptchaError('Please complete the captcha.');
      return;
    }
    
    setStatus("loading");
    
    try {
      await submitWaitlist({
        name: form.name,
        email: form.email,
        role: form.role,
        source: form.source || "",
        captchaToken
      });
      setShowVerification(true);
      setStatus("idle");
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
    } catch (err: any) {
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
      if (err.message === 'This email is already on the waitlist!') {
        setErrors({ ...errors, email: err.message });
      } else {
        setSubmitError(err.message || "Something went wrong. Please try again.");
      }
      setStatus("idle");
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-[hsla(0,0%,100%,0.04)] border ${errors[field] ? "border-destructive" : "border-[hsla(0,0%,100%,0.1)]"} py-4 px-5 rounded-xl outline-none transition-all focus:border-orange focus:shadow-[0_0_0_3px_hsla(14,100%,50%,0.08)] text-foreground placeholder:text-soft-gray/50`;

  return (
    <div className="min-h-screen mesh-pattern">
      <Navbar />
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center min-h-[70vh]">
          {showVerification && (
            <VerificationModal 
              email={form.email} 
              onClose={() => {
                setShowVerification(false);
              }} 
              onVerified={() => {
                setShowVerification(false);
                setStatus("success");
                if (count !== null) setCount(count + 1);
              }}
            />
          )}
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
                  <p className="text-soft-gray text-lg">We'll notify you at launch. See you on the inside.</p>
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
                    {count !== null && count > 0 ? (
                      <>
                        <div className="flex -space-x-2">
                          {["bg-orange", "bg-purple", "bg-soft-gray", "bg-orange/60", "bg-purple/60"].map((bg, i) => (
                            <div key={i} className={`w-6 h-6 rounded-full ${bg} border-2 border-background`} />
                          ))}
                        </div>
                        <span className="text-soft-gray text-sm">Join {count}+ creators already on the list</span>
                      </>
                    ) : (
                      <span className="text-orange font-medium text-sm">Be the first to join!</span>
                    )}
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
                      <CustomSelect
                        options={[
                          { value: 'designer', label: 'Designer' },
                          { value: 'marketer', label: 'Marketer' },
                          { value: 'creator', label: 'Creator' },
                          { value: 'developer', label: 'Developer' },
                          { value: 'founder', label: 'Founder' },
                          { value: 'other', label: 'Other' },
                        ]}
                        value={form.role}
                        onChange={(v) => setForm({ ...form, role: v })}
                        placeholder="Select your role"
                        error={errors.role}
                      />
                      {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="space-y-1.5">
                      <label className="text-xs uppercase tracking-widest text-soft-gray">How did you hear about us?</label>
                      <CustomSelect
                        options={[
                          { value: 'twitter', label: 'Twitter / X' },
                          { value: 'instagram', label: 'Instagram' },
                          { value: 'linkedin', label: 'LinkedIn' },
                          { value: 'tiktok', label: 'TikTok' },
                          { value: 'google', label: 'Google Search' },
                          { value: 'friend', label: 'Friend / Referral' },
                          { value: 'other', label: 'Other' },
                        ]}
                        value={form.source}
                        onChange={(v) => setForm({ ...form, source: v })}
                        placeholder="How did you hear about us?"
                      />
                      {errors.source && <p className="text-xs text-destructive">{errors.source}</p>}
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 15 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.32 }}
                      className="w-full mt-4"
                    >
                      {captchaError && (
                        <p className="text-red-500 text-sm mb-2">
                          {captchaError}
                        </p>
                      )}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        margin: '16px 0',
                        padding: '4px',
                        borderRadius: '12px',
                        border: captchaToken 
                          ? '1px solid rgba(255,61,0,0.3)' 
                          : '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.02)',
                        transition: 'border-color 0.3s ease'
                      }}>
                        <HCaptcha
                          ref={captchaRef}
                          sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY || ''}
                          onVerify={(token) => {
                            setCaptchaToken(token);
                            setCaptchaError('');
                          }}
                          onExpire={() => {
                            setCaptchaToken('');
                            setCaptchaError('Captcha expired. Please verify again.');
                          }}
                          onError={() => {
                            setCaptchaToken('');
                            setCaptchaError('Captcha error. Please try again.');
                          }}
                          theme="dark"
                          size="normal"
                        />
                      </div>
                      {captchaToken && (
                        <p className="text-center text-sm flex items-center justify-center gap-1.5" style={{ color: '#FF3D00' }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="#FF3D00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Verified
                        </p>
                      )}
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      disabled={status === "loading" || !captchaToken}
                      className="w-full py-4 bg-orange text-primary-foreground font-bold rounded-full hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2 hover:shadow-[0_0_25px_hsla(14,100%,50%,0.3)]"
                      title={!captchaToken ? 'Please complete the captcha first' : ''}
                    >
                      {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                      {status === "loading" ? "Joining..." : "Join the Waitlist →"}
                    </motion.button>
                    {submitError && (
                      <p className="text-sm text-destructive text-center mt-2">{submitError}</p>
                    )}
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
            {count !== null && count > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-8 right-8 glass rounded-2xl p-6"
              >
                <p className="text-4xl font-black text-orange">{count}<span className="text-purple">+</span></p>
                <p className="text-xs uppercase tracking-[0.15em] text-soft-gray mt-1">Creators Waiting</p>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
