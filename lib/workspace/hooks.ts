"use client";
import { useCallback, useEffect, useState } from "react";
import { openWorkspaceRepository } from "./indexed-db";
import type { WorkspaceProject } from "./types";
export function useWorkspaceProjects() {
  const [items, setItems] = useState<WorkspaceProject[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => { try { setItems(await (await openWorkspaceRepository()).listProjects()); setError(null); } catch { setError("로컬 프로젝트를 읽지 못했습니다. 브라우저 저장공간 권한을 확인하세요."); } finally { setLoading(false); } }, []);
  useEffect(() => { void reload(); }, [reload]);
  return { items, setItems, loading, error, reload };
}
export function projectReopenUrl(id: string) { return `/generate?project=${encodeURIComponent(id)}`; }
