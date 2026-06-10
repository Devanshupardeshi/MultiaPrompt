"use client";

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-white/5">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-lg text-white/60">Multia</span>
          <span className="text-[9px] text-white/30 uppercase tracking-widest">.in</span>
        </div>
        
        <p className="text-xs text-white/25 font-body">
          © {new Date().getFullYear()} Multia. Prompt Studio powered by BananaVault.
        </p>

        <a
          href="https://multia.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white/30 hover:text-white/60 transition-colors font-body uppercase tracking-wider"
        >
          multia.in
        </a>
      </div>
    </footer>
  );
}
