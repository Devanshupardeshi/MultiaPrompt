"use client";

import { useEffect, useState } from "react";

export function Hero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative pt-32 pb-12 px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Eyebrow */}
        <div
          className={`mb-6 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-xs text-white/40 font-body uppercase tracking-[0.25em]">
            <span className="w-8 h-px bg-white/20" />
            BananaVault Engine
          </span>
        </div>

        {/* Headline */}
        <h1
          className={`font-display text-[clamp(2.5rem,8vw,5.5rem)] leading-[0.95] tracking-tight mb-6 transition-all duration-1000 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="block text-white">Describe your vision.</span>
          <span className="block text-white/40">Get a precise prompt.</span>
        </h1>

        {/* Subtitle */}
        <p
          className={`max-w-xl text-lg text-white/50 font-body leading-relaxed transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          Tell us what you want to create. Our AI generates a professional,
          structured JSON prompt ready for any image generation model.
        </p>
      </div>
    </section>
  );
}
