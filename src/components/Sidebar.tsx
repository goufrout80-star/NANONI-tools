import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sun, Moon, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useSidebar } from "@/hooks/useSidebar";

export function Sidebar() {
  const { isExpanded, setExpanded, toggle } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [light, setLight] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nanoni-theme") === "light";
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
    localStorage.setItem("nanoni-theme", light ? "light" : "dark");
  }, [light]);

  const sidebarWidth = isMobile ? (isExpanded ? 220 : 0) : (isExpanded ? 240 : 56);

  return (
    <>
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-[45]"
          onClick={() => setExpanded(false)}
        />
      )}
      <motion.aside
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 h-screen z-50 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-hidden"
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-[#FF3D00] via-[#7A6FFF] to-transparent" />
        <div className="flex items-center justify-center h-[76px] px-3 shrink-0">
          <Link to="/" className="group flex items-center justify-center">
            <motion.img
              src="/logo.svg"
              alt="NANONI logo"
              animate={{ width: isExpanded ? 32 : 28, height: isExpanded ? 32 : 28 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="transition-all duration-300 group-hover:drop-shadow-[0_0_6px_rgba(255,61,0,0.5)]"
            />
          </Link>
        </div>
        
        <div className="flex-1 flex flex-col gap-2 px-2 pt-4">
          {/* Navigation Items */}
        </div>

        <div className="px-2 pb-3 flex flex-col gap-2">
          <Link
            to="/login"
            className="w-full h-10 rounded-lg border border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground/80 hover:text-orange hover:border-orange/50 transition-colors flex items-center justify-center gap-2"
            aria-label="Login"
          >
            <LogIn className="w-4 h-4" />
            {isMobile && isExpanded && <span className="text-[12px] font-medium">Login</span>}
          </Link>
          <button
            type="button"
            onClick={() => setLight((v) => !v)}
            className="w-full h-10 rounded-lg border border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground/80 hover:text-purple hover:border-purple/50 transition-colors flex items-center justify-center gap-2"
            aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
          >
            {light ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {isMobile && isExpanded && <span className="text-[12px] font-medium">{light ? "Dark" : "Light"}</span>}
          </button>
        </div>
      </motion.aside>
      {!isMobile && (
        <motion.button
          type="button"
          onClick={toggle}
          initial={false}
          animate={{ left: isExpanded ? 76 : 8, x: isExpanded ? 0 : [0, 4, -2, 5, 0] }}
          transition={{
            left: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
            x: isExpanded ? { duration: 0.2 } : { duration: 0.8, repeat: Infinity, repeatDelay: 10, ease: "easeInOut" }
          }}
          className="fixed top-1/2 -translate-y-1/2 z-[55] w-8 h-14 rounded-xl border border-purple/45 bg-purple/25 backdrop-blur flex items-center justify-center text-purple hover:text-white hover:border-purple hover:bg-purple/45 transition-colors"
          aria-label={isExpanded ? "Hide sidebar" : "Show sidebar"}
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </motion.button>
      )}
    </>
  );
}
