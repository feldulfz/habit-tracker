"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  supabase,
  supabaseConfigured,
} from "@/shared/lib/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    if (!supabase) return;
    setAuthError("");
    setAuthMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) setAuthError(error.message);
  }

  async function signInWithPassword(email: string, password: string) {
    if (!supabase) return;
    setAuthLoading(true);
    setAuthError("");
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) setAuthError(error.message);
    setAuthLoading(false);
  }

  async function signUp(email: string, password: string) {
    if (!supabase) return;
    setAuthLoading(true);
    setAuthError("");
    setAuthMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });

    if (error) {
      setAuthError(error.message);
    } else if (!data.session) {
      setAuthMessage("Check your email to confirm your account, then sign in.");
    }
    setAuthLoading(false);
  }

  async function signOut() {
    await supabase?.auth.signOut();
  }

  return {
    session,
    authReady,
    authError,
    authMessage,
    authLoading,
    signInWithGoogle,
    signInWithPassword,
    signUp,
    signOut,
  };
}
