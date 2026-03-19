import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isExpanded: boolean;
  toggle: () => void;
  setExpanded: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    if (window.innerWidth < 768) {
      return false;
    }
    const saved = localStorage.getItem("nanoni-sidebar-expanded");
    return saved === null ? true : saved === "1";
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setExpanded(false);
      } else {
        const saved = localStorage.getItem("nanoni-sidebar-expanded");
        setExpanded(saved === null ? true : saved === "1");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      localStorage.setItem("nanoni-sidebar-expanded", isExpanded ? "1" : "0");
    }
  }, [isExpanded]);

  const toggle = () => setExpanded((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isExpanded, toggle, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
