import type { RadarSnapshot } from "@/lib/types";
import type { WorkspaceRepository } from "./repository";
import { cloneValue } from "./repository";
import type { WorkspacePreferences, WorkspaceProject } from "./types";

export class MemoryWorkspaceRepository implements WorkspaceRepository {
  private projects = new Map<string, WorkspaceProject>();
  private radar: RadarSnapshot | null = null;
  private preferences: WorkspacePreferences = { radarRefreshMinutes: 60 };
  failWrites = false;

  constructor(seed: WorkspaceProject[] = []) { for (const item of seed) this.projects.set(item.id, cloneValue(item)); }
  async listProjects() { return [...this.projects.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(cloneValue); }
  async getProject(id: string) { const item = this.projects.get(id); return item ? cloneValue(item) : null; }
  async saveProject(project: WorkspaceProject) { if (this.failWrites) throw new Error("로컬 저장소 쓰기에 실패했습니다. 기존 데이터는 보존되었습니다."); this.projects.set(project.id, cloneValue(project)); }
  async deleteProject(id: string) { if (this.failWrites) throw new Error("로컬 저장소 쓰기에 실패했습니다. 기존 데이터는 보존되었습니다."); this.projects.delete(id); }
  async getRadarSnapshot() { return this.radar ? cloneValue(this.radar) : null; }
  async saveRadarSnapshot(snapshot: RadarSnapshot) { if (this.failWrites) throw new Error("로컬 저장소 쓰기에 실패했습니다. 기존 데이터는 보존되었습니다."); this.radar = cloneValue(snapshot); }
  async getPreferences() { return cloneValue(this.preferences); }
  async savePreferences(preferences: WorkspacePreferences) { if (this.failWrites) throw new Error("로컬 저장소 쓰기에 실패했습니다. 기존 데이터는 보존되었습니다."); this.preferences = cloneValue(preferences); }
}
