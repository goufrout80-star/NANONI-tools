interface LogoProps {
  className?: string;
  variant?: 'mark' | 'full';
}

export const Logo = ({ className = "w-12 h-12", variant = "mark" }: LogoProps) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ fill: 'hsl(var(--orange))' }}>
      <path d="M20 80V20L45 55V20H55V80L30 45V80H20Z" />
      <path d="M40 80V20L65 55V20H75V80L50 45V80H40Z" opacity="0.6" />
      <path d="M60 80V20L85 55V20H95V80L70 45V80H60Z" opacity="0.3" />
    </svg>
    {variant === 'full' && (
      <span className="font-inter font-bold text-xl tracking-tighter whitespace-nowrap">
        <span className="text-orange">NANONI</span>
        <span className="text-soft-gray ml-1 font-light">Studio</span>
      </span>
    )}
  </div>
);
