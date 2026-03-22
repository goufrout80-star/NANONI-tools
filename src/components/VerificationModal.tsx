import { useState, useEffect } from "react"; 
import { motion } from "framer-motion"; 
import { Loader2 } from "lucide-react"; 
import { verifyCode, resendCode } from "@/lib/waitlist"; 
 
interface Props { 
  email: string; 
  onClose: () => void;
  onVerified: () => void;
} 
 
export function VerificationModal({ email, onClose, onVerified }: Props) { 
  const [code, setCode] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null); 
  const [attempts, setAttempts] = useState(0); 
  const [resendCooldown, setResendCooldown] = useState(60); 
  const [expiryCountdown, setExpiryCountdown] = useState(600); 
  const [success, setSuccess] = useState(false); 
  const [shake, setShake] = useState(false); 
 
  // Timers 
  useEffect(() => { 
    const timer = setInterval(() => { 
      setResendCooldown((c) => Math.max(0, c - 1)); 
      setExpiryCountdown((c) => Math.max(0, c - 1)); 
    }, 1000); 
    return () => clearInterval(timer); 
  }, []); 
 
  // Auto-format code 
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    let val = e.target.value.toUpperCase(); 
    // Strip everything but digits if we only want NNN 000 000 format 
    // Actually the user wants: "Always prefix with 'NNN ', Auto-insert space after 3rd digit, Max 11 chars: 'NNN 000 000'" 
    val = val.replace(/[^N0-9 ]/g, ""); 
     
    // Remove all non-digits to start fresh for formatting 
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
 
  const handleVerify = async () => { 
    if (attempts >= 3 || expiryCountdown === 0) return; 
     
    setLoading(true); 
    setError(null); 
    try { 
      await verifyCode(email, code); 
      setSuccess(true); 
    } catch (err: any) { 
      if (err.message === 'WRONG_CODE') { 
        setAttempts(a => a + 1); 
        setError("Incorrect code. Try again."); 
        setShake(true); 
        setTimeout(() => setShake(false), 500); 
      } else if (err.message === 'CODE_EXPIRED') { 
        setExpiryCountdown(0); 
        setError("Code has expired."); 
      } else { 
        setError(err.message || "Verification failed"); 
      } 
    } finally { 
      setLoading(false); 
    } 
  }; 
 
  const handleResend = async () => { 
    if (resendCooldown > 0) return; 
    try { 
      await resendCode(email); 
      setExpiryCountdown(600); 
      setResendCooldown(60); 
      setAttempts(0); 
      setCode(""); 
      setError(null); 
      setError(null); 
    } catch (err: any) { 
      setError(err.message || "Failed to resend code"); 
    } 
  }; 
 
  if (success) { 
    return ( 
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"> 
        <motion.div  
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="bg-[#111116] border border-[hsla(0,0%,100%,0.06)] p-8 rounded-2xl max-w-md w-full text-center" 
        > 
          <div className="w-20 h-20 mx-auto mb-6 relative"> 
            <svg viewBox="0 0 100 100" className="w-full h-full"> 
              <circle cx="50" cy="50" r="45" fill="none" stroke="#FF3D00" strokeWidth="3" /> 
              <path d="M30 52L45 67L72 35" fill="none" stroke="#FF3D00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> 
            </svg> 
          </div> 
          <h2 className="text-3xl font-bold mb-3 text-[#F5F0EB]">Verified!</h2> 
          <p className="text-[#A0A0A0] mb-8">You're on the list. We'll notify you at launch.</p> 
          <button  
            onClick={onVerified} 
            className="w-full py-3 bg-[#FF3D00] text-white font-bold rounded-xl" 
          > 
            Done 
          </button> 
        </motion.div> 
      </div> 
    ); 
  } 
 
  const isExpired = expiryCountdown === 0; 
 
  return ( 
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"> 
      <motion.div  
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-[#111116] border border-[hsla(0,0%,100%,0.06)] p-8 rounded-2xl max-w-md w-full relative" 
      > 
        <button onClick={onClose} className="absolute top-4 right-4 text-[#A0A0A0] hover:text-white" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button> 
         
        <h2 className="text-2xl font-bold mb-2 text-[#F5F0EB]">Check your email</h2> 
        <p className="text-[#A0A0A0] mb-6 text-sm"> 
          We sent a code to <span className="text-white">{email}</span> 
        </p> 
 
        {isExpired ? ( 
          <div className="text-center py-6"> 
            <p className="text-red-500 mb-4">Your code has expired.</p> 
            <button  
              onClick={handleResend} 
              className="py-2 px-6 bg-[#2a2a30] text-white rounded-lg hover:bg-[#3a3a40]" 
            > 
              Request new code 
            </button> 
          </div> 
        ) : ( 
          <div className="space-y-6"> 
            <motion.div animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}> 
              <input 
                type="text" 
                value={code} 
                onChange={handleCodeChange} 
                placeholder="NNN 0000 0000" 
                maxLength={13} 
                className="w-full bg-[#0B0B0F] border border-[hsla(255,61,0,0.2)] text-center text-3xl font-bold tracking-[0.2em] py-4 rounded-xl outline-none text-[#F5F0EB] focus:border-[#FF3D00]" 
              /> 
            </motion.div> 
             
            {error && <p className="text-red-500 text-sm text-center">{error}</p>} 
 
            <button 
              onClick={handleVerify} 
              disabled={loading || attempts >= 3 || code.length < 13} 
              className="w-full py-3 bg-[#FF3D00] text-white font-bold rounded-xl disabled:opacity-50 flex justify-center items-center gap-2" 
            > 
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} 
              Verify Code 
            </button> 
 
            <div className="flex justify-between items-center text-xs text-[#A0A0A0]"> 
              <span>Expires in {Math.floor(expiryCountdown / 60)}:{(expiryCountdown % 60).toString().padStart(2, '0')}</span> 
              <button  
                onClick={handleResend}  
                disabled={resendCooldown > 0} 
                className="hover:text-white disabled:opacity-50" 
              > 
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"} 
              </button> 
            </div> 
          </div> 
        )} 
      </motion.div> 
    </div> 
  ); 
}