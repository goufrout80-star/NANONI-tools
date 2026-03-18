interface LogoProps {
  className?: string;
  variant?: 'mark' | 'full';
  glow?: boolean;
}

export const Logo = ({ className = "w-12 h-12", variant = "mark", glow = false }: LogoProps) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="relative">
      {glow && (
        <div className="absolute inset-0 blur-2xl opacity-40">
          <div className="w-full h-full rounded-full bg-orange" />
        </div>
      )}
      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
        <defs>
          <linearGradient id="nnn-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(14,100%,50%)" />
            <stop offset="100%" stopColor="hsl(245,100%,71%)" />
          </linearGradient>
        </defs>
        <path d="M15 80V20L42 58V20H50V80L23 42V80H15Z" fill="hsl(14,100%,50%)" />
        <path d="M38 80V20L65 58V20H73V80L46 42V80H38Z" fill="hsl(14,100%,50%)" opacity="0.55" />
        <path d="M61 80V20L88 58V20H96V80L69 42V80H61Z" fill="url(#nnn-grad)" opacity="0.3" />
      </svg>
    </div>
    {variant === 'full' && (
      <span className="font-inter font-bold text-xl tracking-tighter whitespace-nowrap">
        <span className="text-orange">NANONI</span>
        <span className="text-soft-gray ml-1.5 font-normal">Studio</span>
      </span>
    )}
  </div>
);
