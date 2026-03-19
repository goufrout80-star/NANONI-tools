import { Sidebar } from "./Sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { useState, useEffect } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  const marginLeft = isMobile ? 0 : (isExpanded ? 240 : 56);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main
        className="flex-1 transition-all duration-300 relative min-w-0"
        style={{ 
          marginLeft,
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        {children}
      </main>
    </div>
  );
}
