"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/language-context";

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const { text } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <button className="btn btn-secondary btn-sm">Theme</button>;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={text.navbar.toggleTheme}
      title={isDark ? text.navbar.themeLight : text.navbar.themeDark}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
      <span>{isDark ? text.navbar.themeLight : text.navbar.themeDark}</span>
    </button>
  );
}
