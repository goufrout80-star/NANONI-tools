interface LogoProps {
  className?: string;
  variant?: 'mark' | 'full';
  glow?: boolean;
}

export const Logo = ({ className = "w-12 h-12", variant = "mark", glow = false }: LogoProps) => (
  <div className="flex items-center gap-3">
    <div className={`relative shrink-0 ${className}`}>
      {glow && (
        <div className="absolute inset-0 blur-2xl opacity-40">
          <div className="w-full h-full rounded-full bg-orange" />
        </div>
      )}
      <img src="/logo.svg" alt="NANONI logo" className="w-full h-full relative z-10" />
    </div>
    {variant === 'full' && (
      <span className="font-inter font-bold text-xl tracking-tighter whitespace-nowrap">
        <span className="text-orange">NANONI</span>
        <span className="text-soft-gray ml-1.5 font-normal">Studio</span>
      </span>
    )}
  </div>
);
