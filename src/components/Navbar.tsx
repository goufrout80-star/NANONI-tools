import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useSidebar } from "@/hooks/useSidebar";

export const Navbar = () => {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 200], [0, 1]);
  const { isExpanded, setExpanded } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const sidebarWidth = isMobile ? 0 : (isExpanded ? 88 : 0);
  const leftOffset = `calc(50% + ${sidebarWidth / 2}px)`;

  return (
    <>
      <motion.nav
        className="fixed top-4 -translate-x-1/2 z-[40] w-[95%] max-w-3xl rounded-full px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between transition-all duration-300"
        style={{
          left: leftOffset,
          backdropFilter: "blur(20px)",
          background: "hsl(var(--background) / 0.72)",
          border: "1px solid hsl(var(--border))",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: useTransform(borderOpacity, (v) => `0 8px 24px hsl(var(--foreground) / 0.08), 0 0 ${v * 18}px hsla(14,100%,50%,${v * 0.08}), inset 0 0 0 1px hsla(14,100%,50%,${v * 0.1})`),
        }}
      >
        <div className="flex items-center gap-3 shrink-0 md:hidden">
          <button className="p-1 text-muted-foreground hover:text-foreground" onClick={() => setExpanded(true)} aria-label="Open Sidebar">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <Link to="/" className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <span className="font-inter font-bold text-[16px] text-[#FF3D00]">NANONI</span>
          <span className="font-inter font-normal text-[16px] text-[#A0A0A0]">Studio</span>
        </Link>

        <div className="hidden md:block flex-1" />

        <div className="flex items-center gap-3">
          <Link
            to="/waitlist"
            className="px-4 py-2 md:px-6 md:py-2.5 rounded-full bg-[#FF3D00] text-white text-[14px] font-semibold hover:scale-[1.04] transition-all hover:shadow-[0_0_20px_rgba(255,61,0,0.35)]"
          >
            Join Waitlist
          </Link>
        </div>
      </motion.nav>
    </>
  );
};
