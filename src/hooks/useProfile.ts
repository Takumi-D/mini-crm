import { useCallback, useEffect, useState } from "react";
import * as api from "../lib/api";
import type { Profile } from "../types";

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [people, setPeople] = useState<Profile[]>([]);
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null);
  const loading = Boolean(userId && loadedForUserId !== userId);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setPeople([]);
      setLoadedForUserId(null);
      return;
    }

    setError("");
    try {
      const nextProfile = await api.getProfile(userId);
      setProfile(nextProfile);
      setPeople(nextProfile.role === "manager" ? await api.getExecutors() : []);
    } catch (cause) {
      setProfile(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "Не удалось загрузить профиль пользователя.",
      );
    } finally {
      setLoadedForUserId(userId);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  return { profile, people, loading, error, refresh };
}
