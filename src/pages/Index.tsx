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
import { CookiesBanner } from "@/components/CookiesBanner";

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <LoadingScreen isLoading={loading} />
      <SpotlightEffect />
      <CookiesBanner />
      <Navbar />
      <SidebarNav />
      <main>
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
