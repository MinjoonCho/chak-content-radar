"use client";
import { Upload } from "lucide-react";
import { openWorkspaceRepository } from "@/lib/workspace/indexed-db";
import { importProject } from "@/lib/workspace/transfer";
export function ProjectImport({ onImported, onError }: { onImported: () => void; onError: (message: string) => void }) {
  async function load(file?: File) { if (!file) return; try { const repo = await openWorkspaceRepository(); const ids = (await repo.listProjects()).map((item) => item.id); const project = importProject(await file.text(), ids); await repo.saveProject(project); onImported(); } catch (error) { onError(error instanceof Error ? error.message : "가져오기에 실패했습니다."); } }
  return <label className="secondary-button upload-button"><Upload size={15} /> .chak 가져오기<input type="file" accept=".chak,application/json" onChange={(event) => void load(event.target.files?.[0])} /></label>;
}
