import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export const CookiesBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("nanoni-cookies");
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("nanoni-cookies", "accepted");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[90%] max-w-lg glass rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4"
        >
          <p className="text-sm text-soft-gray flex-1">
            We use cookies to enhance your experience. By continuing, you agree to our use of cookies.
          </p>
          <div className="flex gap-2 shrink-0">
            <button onClick={accept} className="px-4 py-2 text-sm rounded-full bg-orange text-primary-foreground font-medium hover:scale-[1.03] transition-transform">
              Accept All
            </button>
            <button onClick={accept} className="px-4 py-2 text-sm rounded-full border border-purple/30 text-purple hover:bg-purple/5 transition-colors">
              Manage
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
