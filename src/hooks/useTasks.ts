import { useCallback, useEffect, useState } from "react";
import * as api from "../lib/api";
import type { History, Status, Task, TaskAction } from "../types";

function statusAfterAction(action: TaskAction): Status {
  switch (action) {
    case "start":
    case "return_to_work":
      return "В работе";
    case "submit":
      return "На проверке";
    case "accept":
      return "Принята";
    case "request_revision":
      return "На доработке";
  }
}

export function useTasks(userId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null);
  const loading = Boolean(userId && loadedForUserId !== userId);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      setHistory([]);
      setLoadedForUserId(null);
      return;
    }

    setError("");
    try {
      setTasks(await api.getTasks());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не удалось загрузить задачи.",
      );
    } finally {
      setLoadedForUserId(userId);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const loadHistory = useCallback(async (taskId: string) => {
    setHistory(await api.getTaskHistory(taskId));
  }, []);

  const create = useCallback(
    async (input: {
      title: string;
      description: string;
      projectId: string;
      assigneeId: string;
    }) => {
      const id = await api.createTask(input);
      await refresh();
      return id;
    },
    [refresh],
  );

  const update = useCallback(
    async (
      taskId: string,
      input: {
        title: string;
        description: string;
        assigneeId: string;
      },
    ) => {
      await api.updateTask(taskId, input);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (taskId: string) => {
      await api.deleteTask(taskId);
      await refresh();
    },
    [refresh],
  );

  const transition = useCallback(
    async (
      taskId: string,
      action: TaskAction,
      comment?: string,
    ): Promise<Status> => {
      await api.transitionTask(taskId, action, comment);
      await refresh();
      await loadHistory(taskId);
      return statusAfterAction(action);
    },
    [loadHistory, refresh],
  );

  return {
    tasks,
    history,
    loading,
    error,
    refresh,
    loadHistory,
    create,
    update,
    remove,
    transition,
  };
}
