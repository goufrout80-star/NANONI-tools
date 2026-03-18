import { useEffect, useRef } from "react";

export const SpotlightEffect = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      el.style.background = `
        radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, hsla(14,100%,50%,0.03), transparent 40%),
        radial-gradient(400px circle at ${e.clientX}px ${e.clientY}px, hsla(245,100%,71%,0.03), transparent 40%)
      `;
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-0 pointer-events-none z-50 hidden lg:block"
    />
  );
};
