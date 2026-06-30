"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { STORAGE_KEYS, writeJSON } from "@/lib/storage";
import type { StoredUser } from "@/types/chat";

type Mode = "login" | "register";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: StoredUser;
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? "Something went wrong. Please try again.");
      }

      const data: AuthResponse = await response.json();
      window.localStorage.setItem(STORAGE_KEYS.accessToken, data.access_token);
      writeJSON(STORAGE_KEYS.user, data.user);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="animated-gradient-bg flex h-screen w-screen items-center justify-center bg-gradient-app px-4">
      <div className="glass-panel w-full max-w-sm rounded-2xl p-8 shadow-glow">
        <div className="mb-6 text-center">
          <h1 className="bg-gradient-ai bg-clip-text text-xl font-semibold text-transparent">Strive.ai</h1>
          <p className="mt-1 text-xs text-ink-muted">Strive by Ibrahim</p>
        </div>

        <div className="mb-6 flex rounded-lg border border-white/10 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md py-1.5 transition ${
              mode === "login" ? "bg-gradient-primary text-white" : "text-ink-muted hover:text-ink-secondary"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-md py-1.5 transition ${
              mode === "register" ? "bg-gradient-primary text-white" : "text-ink-muted hover:text-ink-secondary"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-ink-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-deep-space/60 px-3 py-2 text-sm text-ink-primary focus:border-neural-cyan/50 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-ink-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-deep-space/60 px-3 py-2 text-sm text-ink-primary focus:border-neural-cyan/50 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-white transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
