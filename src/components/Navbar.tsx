import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const padding = useTransform(scrollY, [0, 200], [20, 8]);
  const blur = useTransform(scrollY, [0, 100], [10, 20]);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const handleNav = (href: string) => {
    setMobileOpen(false);
    if (!isHome) return;
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.nav
        style={{ paddingTop: padding, paddingBottom: padding }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] w-[95%] max-w-3xl glass rounded-full px-6 flex items-center justify-between"
      >
        <Link to="/" className="shrink-0">
          <Logo className="w-8 h-8" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) =>
            isHome ? (
              <button key={l.label} onClick={() => handleNav(l.href)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </button>
            ) : (
              <Link key={l.label} to={`/${l.href}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </Link>
            )
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/waitlist" className="px-5 py-2 rounded-full bg-orange text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            Join Waitlist
          </Link>
          <button className="md:hidden p-1" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[79] w-[90%] max-w-sm glass rounded-2xl p-6 flex flex-col gap-4 md:hidden"
        >
          {NAV_LINKS.map((l) => (
            <button key={l.label} onClick={() => handleNav(l.href)} className="text-left text-lg font-medium text-foreground hover:text-orange transition-colors">
              {l.label}
            </button>
          ))}
        </motion.div>
      )}
    </>
  );
};
