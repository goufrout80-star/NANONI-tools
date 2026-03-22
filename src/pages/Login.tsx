import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, CheckCircle2, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Logo } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";
import { sendLoginCode, verifyLoginCode, setSession } from "@/lib/auth";

type LoginStep = "email" | "code" | "not_found" | "pending" | "success";

export default function Login() {
  const navigate = useNavigate();
  const captchaRef = useRef<HCaptcha>(null);

  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Code step state
  const [expiryCountdown, setExpiryCountdown] = useState(600);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);

  // Timers for code step
  useEffect(() => {
    if (step !== "code") return;
    const timer = setInterval(() => {
      setExpiryCountdown((c) => Math.max(0, c - 1));
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Redirect on success
  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => navigate("/"), 2000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  // ═══ EMAIL SUBMIT → trigger captcha ═══
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError(null);
    captchaRef.current?.execute();
  };

  // ═══ CAPTCHA VERIFIED → send code ═══
  const handleCaptchaVerify = async (token: string) => {
    try {
      const result = await sendLoginCode(email, token);

      if (result.status === "not_found") {
        setStep("not_found");
      } else if (result.status === "pending") {
        setStep("pending");
      } else {
        setStep("code");
        setExpiryCountdown(600);
        setResendCooldown(60);
        setAttempts(0);
        setCode("");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      captchaRef.current?.resetCaptcha();
    }
  };

  const handleCaptchaError = () => {
    setLoading(false);
    setError("Captcha failed. Please try again.");
  };

  // ═══ CODE INPUT — auto-format NNN XXXX XXXX ═══
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    val = val.replace(/[^N0-9 ]/g, "");
    const digits = val.replace(/\D/g, "");

    let formatted = "NNN ";
    if (digits.length > 0) {
      formatted += digits.slice(0, 4);
    }
    if (digits.length > 4) {
      formatted += " " + digits.slice(4, 8);
    }

    if (val === "" || val === "N" || val === "NN" || val === "NNN") {
      setCode(val);
    } else {
      setCode(formatted);
    }
  };

  // ═══ VERIFY CODE ═══
  const handleVerify = async () => {
    if (attempts >= 5 || expiryCountdown === 0 || loading) return;

    setLoading(true);
    setError(null);

    try {
      await verifyLoginCode(email, code);
      setSession(email, rememberMe);
      setStep("success");
    } catch (err: any) {
      if (err.message === "WRONG_CODE") {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        const remaining = 5 - newAttempts;
        if (remaining > 0) {
          setError(`Incorrect code. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`);
        } else {
          setError("Too many wrong attempts. Please request a new code.");
        }
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setCode("");
      } else if (err.message === "CODE_EXPIRED") {
        setExpiryCountdown(0);
        setError("Code has expired.");
      } else if (err.message === "TOO_MANY_ATTEMPTS") {
        setAttempts(5);
        setError("Too many attempts. Please request a new code.");
      } else {
        setError(err.message || "Verification failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ═══ RESEND ═══
  const handleResend = () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    captchaRef.current?.execute();
  };

  const isExpired = expiryCountdown === 0;
  const isBlocked = attempts >= 5;

  return (
    <div className="min-h-screen mesh-pattern flex flex-col">
      <Navbar />

      {/* Invisible hCaptcha */}
      <HCaptcha
        ref={captchaRef}
        sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY || ""}
        size="invisible"
        onVerify={handleCaptchaVerify}
        onError={handleCaptchaError}
        onExpire={() => {
          setLoading(false);
          setError("Captcha expired. Please try again.");
        }}
      />

      <main className="flex-1 flex items-center justify-center p-6 pt-32">
        <div className="w-full max-w-[420px]">

          {/* Back button — flows naturally within content area */}
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-xs text-soft-gray hover:text-white transition-colors mb-8 group"
          >
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to home
          </button>

          <div className="mb-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 blur-[40px] rounded-full bg-orange/20 scale-[2]" />
                <div className="p-5 rounded-2xl bg-background border border-[hsla(0,0%,100%,0.08)] relative shadow-xl">
                  <Logo className="w-10 h-10" glow />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-soft-gray text-sm">Sign in to your NANONI Studio account</p>
          </div>

          <div className="bg-[#111116] border border-[hsla(0,0%,100%,0.06)] rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Top gradient highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange to-transparent opacity-50" />
            
            <AnimatePresence mode="wait">
              {/* ═══ EMAIL STEP ═══ */}
              {step === "email" && (
                <motion.form 
                  key="email-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleEmailSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-soft-gray font-semibold">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder="you@example.com"
                      autoFocus
                      className={`w-full bg-[#0B0B0F] border ${error ? "border-red-500/50" : "border-[hsla(0,0%,100%,0.1)]"} py-4 px-5 rounded-xl outline-none transition-all focus:border-orange focus:shadow-[0_0_0_3px_hsla(14,100%,50%,0.08)] text-foreground placeholder:text-soft-gray/30`}
                    />
                    {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
                  </div>

                  {/* Remember me */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-4 h-4 rounded border border-[hsla(0,0%,100%,0.15)] bg-[#0B0B0F] peer-checked:bg-orange peer-checked:border-orange transition-all flex items-center justify-center flex-shrink-0">
                      {rememberMe && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-soft-gray">Remember me</span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-4 bg-foreground text-background font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 group"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Continue with Email
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  
                </motion.form>
              )}

              {/* ═══ NOT FOUND STEP ═══ */}
              {step === "not_found" && (
                <motion.div
                  key="not-found-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center py-6 space-y-6"
                >
                  <div className="w-14 h-14 bg-orange/10 rounded-full flex items-center justify-center mx-auto border border-orange/20">
                    <svg className="w-6 h-6 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Email not found</h2>
                    <p className="text-sm text-soft-gray">
                      This email isn't on our waitlist yet.<br />
                      Join the waitlist first to get access.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate("/waitlist")}
                      className="w-full py-3.5 bg-orange text-white font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Join the Waitlist
                    </button>
                    <button
                      onClick={() => { setStep("email"); setError(null); }}
                      className="text-xs text-soft-gray hover:text-white transition-colors"
                    >
                      Try a different email
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══ PENDING STEP ═══ */}
              {step === "pending" && (
                <motion.div
                  key="pending-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center py-6 space-y-6"
                >
                  <div className="w-14 h-14 bg-purple/10 rounded-full flex items-center justify-center mx-auto border border-purple/20">
                    <svg className="w-6 h-6 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">You're on the waitlist</h2>
                    <p className="text-sm text-soft-gray">
                      Please verify your email first.<br />
                      Check your inbox for the verification code.
                    </p>
                  </div>
                  <button
                    onClick={() => { setStep("email"); setError(null); }}
                    className="text-xs text-soft-gray hover:text-white transition-colors"
                  >
                    Try a different email
                  </button>
                </motion.div>
              )}

              {/* ═══ CODE STEP ═══ */}
              {step === "code" && (
                <motion.div 
                  key="code-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange/20">
                      <svg className="w-5 h-5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Check your email</h2>
                    <p className="text-sm text-soft-gray">
                      We sent a login code to<br/>
                      <span className="text-white font-medium">{email}</span>
                    </p>
                  </div>

                  {isExpired || isBlocked ? (
                    <div className="text-center py-4 space-y-4">
                      <p className="text-sm text-red-400">
                        {isExpired ? "Your code has expired." : "Too many wrong attempts."}
                      </p>
                      <button
                        onClick={handleResend}
                        disabled={resendCooldown > 0 || loading}
                        className="py-2.5 px-6 bg-[#2a2a30] text-white text-sm font-medium rounded-lg hover:bg-[#3a3a40] disabled:opacity-50 transition-colors inline-flex items-center gap-2"
                      >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Request new code"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <motion.div animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}>
                          <input
                            type="text"
                            value={code}
                            onChange={handleCodeChange}
                            placeholder="NNN 0000 0000"
                            autoFocus
                            maxLength={13}
                            className={`w-full bg-[#0B0B0F] border ${error ? "border-red-500/50" : "border-orange/30"} text-center text-2xl font-bold tracking-[0.2em] py-4 rounded-xl outline-none text-foreground focus:border-orange focus:shadow-[0_0_0_3px_hsla(14,100%,50%,0.08)] transition-all font-mono`}
                          />
                        </motion.div>
                        {error && <p className="text-xs text-red-400 mt-2 text-center">{error}</p>}
                      </div>

                      <button
                        onClick={handleVerify}
                        disabled={loading || code.length < 13}
                        className="w-full py-3.5 bg-foreground text-background font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "Verify Code"
                        )}
                      </button>
                    </>
                  )}

                  {/* Timer + resend + back */}
                  <div className="pt-2 space-y-3">
                    {!isExpired && !isBlocked && (
                      <div className="flex justify-between items-center text-xs text-soft-gray">
                        <span>
                          Expires in {Math.floor(expiryCountdown / 60)}:{(expiryCountdown % 60).toString().padStart(2, "0")}
                        </span>
                        <button
                          onClick={handleResend}
                          disabled={resendCooldown > 0 || loading}
                          className="text-orange hover:text-orange/80 disabled:text-soft-gray/50 transition-colors"
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                        </button>
                      </div>
                    )}
                    <div className="text-center">
                      <button
                        onClick={() => { setStep("email"); setError(null); setCode(""); setAttempts(0); }}
                        className="text-xs text-soft-gray hover:text-white transition-colors"
                      >
                        Use a different email
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ SUCCESS STEP ═══ */}
              {step === "success" && (
                <motion.div 
                  key="success-step"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Login Successful!</h2>
                  <p className="text-sm text-soft-gray">
                    Redirecting to dashboard...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <p className="text-center text-xs text-soft-gray/60 mt-8">
            By continuing, you agree to our <a href="/terms" className="hover:text-white transition-colors underline decoration-white/20 underline-offset-2">Terms of Service</a> and <a href="/privacy" className="hover:text-white transition-colors underline decoration-white/20 underline-offset-2">Privacy Policy</a>.
          </p>
        </div>
      </main>
    </div>
  );
}