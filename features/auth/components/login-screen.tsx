"use client";

import { FormEvent, useState } from "react";
import { Brand } from "@/shared/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type LoginScreenProps = {
  error: string;
  loading: boolean;
  message: string;
  onGoogleSignIn: () => void;
  onPasswordSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
};

export function LoginScreen({
  error,
  loading,
  message,
  onGoogleSignIn,
  onPasswordSignIn,
  onSignUp,
}: LoginScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "signup") {
      await onSignUp(email.trim(), password);
    } else {
      await onPasswordSignIn(email.trim(), password);
    }
  }

  return (
    <main className="login-page">
      <section className="login-copy">
        <Brand large />
        <p className="eyebrow">Small promises. Visible progress.</p>
        <h1>Make consistency something you can see.</h1>
        <p className="login-description">
          A quiet daily task list with a year of progress built right in. Check
          in, mark it done, and let the days add up.
        </p>
        <Card className="auth-panel" size="sm">
          <CardContent className="auth-panel-content">
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  autoComplete="email"
                  id="auth-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div className="auth-field">
                <Label htmlFor="auth-password">Password</Label>
                <Input
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  id="auth-password"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                  type="password"
                  value={password}
                />
              </div>
              <Button className="auth-submit" disabled={loading} type="submit">
                {loading
                  ? "Please wait…"
                  : mode === "signup"
                    ? "Sign up"
                    : "Sign in"}
              </Button>
            </form>
            <Button
              className="auth-mode-toggle"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              size="sm"
              type="button"
              variant="link"
            >
              {mode === "signin"
                ? "Don’t have an account yet? Sign up"
                : "Already have an account? Sign in"}
            </Button>
            <div className="auth-divider">
              <Separator />
              <span>or continue with</span>
              <Separator />
            </div>
            <Button className="google-button" onClick={onGoogleSignIn} type="button">
              <svg
                aria-hidden="true"
                className="google-icon"
                viewBox="0 0 24 24"
              >
                <path d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z" fill="#4285F4" />
                <path d="M12 22c2.7 0 4.97-.9 6.62-2.38l-3.24-2.53c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.05v2.61A10 10 0 0 0 12 22Z" fill="#34A853" />
                <path d="M6.4 13.92A6.02 6.02 0 0 1 6.09 12c0-.67.12-1.32.31-1.92V7.47H3.05A10 10 0 0 0 2 12c0 1.63.39 3.17 1.05 4.53l3.35-2.61Z" fill="#FBBC05" />
                <path d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.95 5.47l3.35 2.61c.79-2.37 3-4.13 5.6-4.13Z" fill="#EA4335" />
              </svg>
              Google
            </Button>
            {error && <p className="error-message" role="alert">{error}</p>}
            {message && <p className="auth-message" role="status">{message}</p>}
            <p className="privacy-note">
              Your account keeps your habits private and synced across devices.
            </p>
          </CardContent>
        </Card>
      </section>
      <section className="login-visual" aria-hidden="true">
        <div className="visual-card">
          <div className="visual-topline">
            <span>This year</span>
            <span>184 days marked</span>
          </div>
          <div className="visual-grid">
            {Array.from({ length: 140 }, (_, index) => (
              <span
                className={`visual-cell visual-level-${(index * 7 + index * index) % 5}`}
                key={index}
              />
            ))}
          </div>
          <div className="visual-quote">
            “A little, often, becomes a lot.”
          </div>
        </div>
      </section>
    </main>
  );
}
