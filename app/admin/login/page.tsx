"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login failed");
        setBusy(false);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from");
      router.push(from && from.startsWith("/admin") ? from : "/admin");
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-8"
      >
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight">Multia Admin</h1>
          <p className="mt-1 text-sm text-white/40">Key pool &amp; settings control panel</p>
        </div>

        <label className="block text-xs uppercase tracking-[0.18em] text-white/40 mb-2">
          Admin password
        </label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-white/30"
          placeholder="••••••••"
        />

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy || !password}
          className="mt-5 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Unlocking…" : "Unlock"}
        </button>
      </form>
    </main>
  );
}
