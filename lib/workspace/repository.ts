import type { RadarSnapshot } from "@/lib/types";
import type { WorkspacePreferences, WorkspaceProject } from "./types";

export interface WorkspaceRepository {
  listProjects(): Promise<WorkspaceProject[]>;
  getProject(id: string): Promise<WorkspaceProject | null>;
  saveProject(project: WorkspaceProject): Promise<void>;
  deleteProject(id: string): Promise<void>;
  getRadarSnapshot(): Promise<RadarSnapshot | null>;
  saveRadarSnapshot(snapshot: RadarSnapshot): Promise<void>;
  getPreferences(): Promise<WorkspacePreferences>;
  savePreferences(preferences: WorkspacePreferences): Promise<void>;
}

export function cloneValue<T>(value: T): T {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value)) as T;
}
