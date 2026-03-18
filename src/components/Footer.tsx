import { Logo } from "./Logo";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms", href: "#" },
];

const SOCIALS = ["Instagram", "LinkedIn", "X", "TikTok", "Discord"];

export const Footer = () => {
  const scrollTo = (href: string) => {
    if (href.startsWith("#") && href.length > 1) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-border py-16 px-6" style={{ background: "hsla(0,0%,100%,0.01)" }}>
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 items-start">
        {/* Left */}
        <div className="space-y-4">
          <Logo className="w-10 h-10" variant="full" />
          <p className="text-sm text-soft-gray max-w-xs leading-relaxed">
            Design Smarter. Brand Faster. Create Everything.
          </p>
          <p className="text-xs text-soft-gray/60">© 2026 NANONI Studio. All rights reserved.</p>
        </div>

        {/* Center */}
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {LINKS.map((l) => (
            <button
              key={l.label}
              onClick={() => scrollTo(l.href)}
              className="text-sm text-soft-gray hover:text-orange transition-colors"
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="space-y-4">
          <div className="flex gap-4">
            {SOCIALS.map((s) => (
              <a
                key={s}
                href="#"
                className="text-xs text-soft-gray hover:text-orange hover:scale-110 transition-all"
              >
                {s}
              </a>
            ))}
          </div>
          <p className="text-xs text-purple">contact@nanoni.studio</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-border text-center">
        <p className="text-[11px] text-soft-gray/40 tracking-wider">Powered by Google Gemini</p>
      </div>
    </footer>
  );
};
