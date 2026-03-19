import { Logo } from "./Logo";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms", href: "#" },
];

const SOCIALS = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "X", href: "#" },
  { label: "TikTok", href: "#" },
  { label: "Discord", href: "#" },
];

const SocialIcon = ({ label }: { label: string }) => {
  if (label === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (label === "LinkedIn") {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
        <path d="M6.94 8.5A1.44 1.44 0 1 1 6.94 5.62 1.44 1.44 0 0 1 6.94 8.5ZM5.75 9.75h2.38V18H5.75V9.75Zm3.8 0h2.28v1.13h.03c.32-.6 1.1-1.23 2.25-1.23 2.4 0 2.84 1.58 2.84 3.64V18h-2.38v-3.86c0-.92-.02-2.1-1.28-2.1-1.28 0-1.48 1-1.48 2.03V18H9.55V9.75Z" />
      </svg>
    );
  }
  if (label === "X") {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
        <path d="M18.9 3H21l-4.59 5.24L21.8 21h-4.23l-3.3-4.87L10.03 21H7.9l4.9-5.6L3 3h4.34l2.98 4.43L14.1 3h4.8Zm-1.49 15.37h1.17L6.7 5.53H5.45l11.96 12.84Z" />
      </svg>
    );
  }
  if (label === "TikTok") {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
        <path d="M14.5 3c.42 1.9 1.54 3.1 3.5 3.5v2.5c-1.24-.03-2.36-.36-3.5-1.03V14a5 5 0 1 1-5-5c.33 0 .66.04 1 .11v2.61A2.5 2.5 0 1 0 12 14V3h2.5Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path d="M20.32 4.37A19.8 19.8 0 0 0 15.59 3c-.22.4-.47.94-.64 1.37a18.33 18.33 0 0 0-5.9 0c-.18-.43-.43-.98-.66-1.37a19.92 19.92 0 0 0-4.74 1.38C.67 9 0 13.52.33 17.98A20.22 20.22 0 0 0 6.2 21c.47-.64.9-1.31 1.27-2.03-.7-.26-1.36-.58-1.98-.95.16-.12.31-.24.46-.36 3.81 1.8 7.95 1.8 11.71 0 .15.12.3.24.46.36-.62.37-1.29.69-1.99.95.37.72.8 1.4 1.28 2.04a20.11 20.11 0 0 0 5.88-3.04c.42-5.17-.72-9.66-2.97-13.6ZM8.76 15.25c-1.15 0-2.09-1.06-2.09-2.36 0-1.3.93-2.36 2.09-2.36 1.17 0 2.11 1.07 2.1 2.36 0 1.3-.93 2.36-2.1 2.36Zm6.47 0c-1.15 0-2.09-1.06-2.09-2.36 0-1.3.93-2.36 2.09-2.36 1.17 0 2.11 1.07 2.1 2.36 0 1.3-.93 2.36-2.1 2.36Z" />
    </svg>
  );
};

export const Footer = () => {
  const scrollTo = (href: string) => {
    if (href.startsWith("#") && href.length > 1) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-border py-16 px-6" style={{ background: "hsla(0,0%,100%,0.01)" }}>
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 items-start">
        <div className="space-y-4">
          <Logo className="w-10 h-10" variant="full" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-purple font-semibold">Creative AI Platform</p>
          <p className="text-sm text-soft-gray max-w-xs leading-relaxed">
            Design Smarter. Brand Faster. Create Everything.
          </p>
          <p className="text-xs text-soft-gray/60">© 2026 NANONI Studio. All rights reserved.</p>
        </div>

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

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-soft-gray/70">Social</p>
          <div className="flex gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="w-9 h-9 rounded-lg border border-border bg-card/50 text-soft-gray hover:text-orange hover:border-orange/40 hover:bg-orange/5 transition-all flex items-center justify-center"
                aria-label={s.label}
              >
                <SocialIcon label={s.label} />
              </a>
            ))}
          </div>
          <p className="text-xs text-purple">contact@nanoni.studio</p>
        </div>
      </div>
    </footer>
  );
};
