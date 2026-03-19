import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";

type LoginStep = "email" | "code" | "success";

export default function Login() {
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Only for frontend simulation
  const [countdown, setCountdown] = useState(60);
  
  useEffect(() => {
    let timer: number;
    if (step === "code" && countdown > 0) {
      timer = window.setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => window.clearInterval(timer);
  }, [step, countdown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep("code");
      setCountdown(60);
    }, 1200);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and max 6 chars
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(val);
    
    if (val.length === 6) {
      submitCode(val);
    }
  };

  const submitCode = async (codeToSubmit: string) => {
    setLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (codeToSubmit === "123456") { // Example magic code for testing
        setStep("success");
      } else {
        setError("Invalid code. Please try 123456 for testing.");
        setCode("");
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen mesh-pattern flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6 pt-32">
        <div className="w-full max-w-[420px]">
          
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
                  
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-[hsla(0,0%,100%,0.06)]"></div>
                    <span className="flex-shrink-0 mx-4 text-xs text-soft-gray/50 uppercase">Or</span>
                    <div className="flex-grow border-t border-[hsla(0,0%,100%,0.06)]"></div>
                  </div>
                  
                  <button
                    type="button"
                    className="w-full py-3.5 bg-transparent border border-[hsla(0,0%,100%,0.1)] text-foreground font-medium rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-3"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    Continue with Google
                  </button>
                </motion.form>
              )}

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
                      We sent a 6-digit code to <br/>
                      <span className="text-white font-medium">{email}</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={code}
                      onChange={handleCodeChange}
                      placeholder="000000"
                      autoFocus
                      maxLength={6}
                      className={`w-full bg-[#0B0B0F] border ${error ? "border-red-500/50" : "border-orange/30"} text-center text-3xl font-bold tracking-[0.5em] py-4 rounded-xl outline-none text-foreground focus:border-orange focus:shadow-[0_0_0_3px_hsla(14,100%,50%,0.08)] transition-all`}
                    />
                    {error && <p className="text-xs text-red-400 mt-2 text-center">{error}</p>}
                  </div>

                  <div className="pt-2 flex flex-col items-center gap-4">
                    <button 
                      onClick={() => setStep("email")}
                      className="text-xs text-soft-gray hover:text-white transition-colors"
                    >
                      Use a different email
                    </button>
                    
                    <button 
                      disabled={countdown > 0}
                      className="text-xs text-orange hover:text-orange/80 disabled:text-soft-gray/50 transition-colors"
                    >
                      {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
                    </button>
                  </div>
                </motion.div>
              )}

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