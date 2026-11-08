import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import * as api from "../lib/api";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Supabase emits INITIAL_SESSION after restoring the browser's saved session.
    const unsubscribe = api.subscribeToAuthChanges((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setBusy(true);
    setError("");
    try {
      const nextSession = await api.signIn(email.trim(), password);
      setSession(nextSession);
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Не удалось связаться с Supabase. Проверьте подключение.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      await api.signOut();
      setSession(null);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось выйти.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return { session, authReady, busy, error, signIn, signOut };
}
