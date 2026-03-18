import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const [light, setLight] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nanoni-theme') === 'light';
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', light);
    localStorage.setItem('nanoni-theme', light ? 'light' : 'dark');
  }, [light]);

  return (
    <button
      onClick={() => setLight(!light)}
      className="p-2 rounded-full glass hover:scale-110 transition-transform"
      aria-label="Toggle theme"
    >
      {light ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
};
