import { Logo } from "./Logo";
import { Link } from "react-router-dom";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms", href: "#" },
];

export const Footer = () => {
  const scrollTo = (href: string) => {
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-border py-16 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <Logo className="w-10 h-10" variant="full" />
          <p className="text-sm text-muted-foreground max-w-xs">
            Design Smarter. Brand Faster. Create Everything.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {LINKS.map((l) => (
            <button
              key={l.label}
              onClick={() => scrollTo(l.href)}
              className="text-sm text-muted-foreground hover:text-orange transition-colors"
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            {["Instagram", "LinkedIn", "X", "TikTok", "Discord"].map((s) => (
              <a key={s} href="#" className="text-xs text-muted-foreground hover:text-orange transition-colors">
                {s}
              </a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">contact@nanoni.studio</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground">© 2026 NANONI Studio. All rights reserved.</p>
      </div>
    </footer>
  );
};
