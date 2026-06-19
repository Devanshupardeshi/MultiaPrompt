"use client";

import { useState, useEffect } from "react";

interface HeaderProps {
  dailyPromptCount: number | null;
}

export function Header({ dailyPromptCount }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-5"
      }`}
      style={{
        background: scrolled ? "rgba(18, 18, 18, 0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid #222" : "1px solid transparent",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-baseline gap-1 group">
          <span className="font-display text-2xl tracking-tight text-white transition-all duration-300">
            Multia
          </span>
          <span className="text-[10px] text-white/40 font-body tracking-widest uppercase">
            .in
          </span>
        </a>

        {/* Center label */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="w-6 h-px bg-white/20" />
          <span className="text-xs text-white/40 font-body uppercase tracking-[0.2em]">
            Prompt Studio
          </span>
          <span className="w-6 h-px bg-white/20" />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 sm:px-3 py-1.5"
            title="Successful prompts generated today"
          >
            <span className="text-[10px] text-white/35 font-body uppercase tracking-[0.18em]">
              Today
            </span>
            <span className="font-display text-sm text-white tabular-nums">
              {dailyPromptCount ?? "--"}
            </span>
          </div>
          <a
            href="https://multia.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/50 hover:text-white transition-colors font-body uppercase tracking-wider"
          >
            Agency
          </a>
        </div>
      </div>
    </header>
  );
}
