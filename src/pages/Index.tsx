import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { MarqueeStrip } from "@/components/MarqueeStrip";
import { OrbitalTools } from "@/components/OrbitalTools";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { SidebarNav } from "@/components/SidebarNav";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import { ParticlesCanvas } from "@/components/ParticlesCanvas";
import { CookiesBanner } from "@/components/CookiesBanner";

export default function Index() {
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("nanoni-loaded");
    }
    return true;
  });

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      sessionStorage.setItem("nanoni-loaded", "1");
    }, 1800);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <>
      <LoadingScreen isLoading={loading} />
      <SpotlightEffect />
      <ParticlesCanvas />
      <div className="fixed inset-0 dot-grid pointer-events-none z-0" aria-hidden="true" />
      <CookiesBanner />
      <Navbar />
      <SidebarNav />
      <main className="relative z-10">
        <Hero />
        <StatsBar />
        <MarqueeStrip />
        <OrbitalTools />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
