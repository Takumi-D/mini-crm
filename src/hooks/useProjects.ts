import { useCallback, useEffect, useState } from "react";
import * as api from "../lib/api";
import type { Project } from "../types";

export function useProjects(userId: string | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null);
  const loading = Boolean(userId && loadedForUserId !== userId);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!userId) {
      setProjects([]);
      setLoadedForUserId(null);
      return;
    }

    setError("");
    try {
      setProjects(await api.getProjects());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Не удалось загрузить объекты.",
      );
    } finally {
      setLoadedForUserId(userId);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const create = useCallback(
    async (input: Pick<Project, "name" | "address">) => {
      const id = await api.createProject(input);
      await refresh();
      return id;
    },
    [refresh],
  );

  const update = useCallback(
    async (projectId: string, input: Pick<Project, "name" | "address">) => {
      await api.updateProject(projectId, input);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (projectId: string) => {
      await api.deleteProject(projectId);
      await refresh();
    },
    [refresh],
  );

  return { projects, loading, error, refresh, create, update, remove };
}
