import type { RadarSnapshot } from "@/lib/types";
import type { WorkspaceRepository } from "./repository";
import type { WorkspacePreferences, WorkspaceProject } from "./types";

const DB_NAME = "chak-workspace";
const DB_VERSION = 1;
const PROJECTS = "projects";
const STATE = "state";

function requestValue<T>(request: IDBRequest<T>) { return new Promise<T>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error ?? new Error("IndexedDB 요청 실패")); }); }
function transactionDone(transaction: IDBTransaction) { return new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onabort = transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB 저장 실패")); }); }

async function openDatabase() {
  if (typeof indexedDB === "undefined") throw new Error("이 브라우저에서는 로컬 프로젝트 저장을 사용할 수 없습니다.");
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS, { keyPath: "id" });
    if (!db.objectStoreNames.contains(STATE)) db.createObjectStore(STATE);
  };
  return requestValue(request);
}

export class IndexedDbWorkspaceRepository implements WorkspaceRepository {
  constructor(private db: IDBDatabase) {}
  async listProjects() { const tx = this.db.transaction(PROJECTS, "readonly"); const items = await requestValue(tx.objectStore(PROJECTS).getAll()) as WorkspaceProject[]; return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
  async getProject(id: string) { const tx = this.db.transaction(PROJECTS, "readonly"); return (await requestValue(tx.objectStore(PROJECTS).get(id)) as WorkspaceProject | undefined) ?? null; }
  async saveProject(project: WorkspaceProject) { const tx = this.db.transaction(PROJECTS, "readwrite"); tx.objectStore(PROJECTS).put(project); await transactionDone(tx); }
  async deleteProject(id: string) { const tx = this.db.transaction(PROJECTS, "readwrite"); tx.objectStore(PROJECTS).delete(id); await transactionDone(tx); }
  private async getState<T>(key: string) { const tx = this.db.transaction(STATE, "readonly"); return (await requestValue(tx.objectStore(STATE).get(key)) as T | undefined) ?? null; }
  private async putState<T>(key: string, value: T) { const tx = this.db.transaction(STATE, "readwrite"); tx.objectStore(STATE).put(value, key); await transactionDone(tx); }
  getRadarSnapshot() { return this.getState<RadarSnapshot>("radar"); }
  saveRadarSnapshot(snapshot: RadarSnapshot) { return this.putState("radar", snapshot); }
  async getPreferences() { return (await this.getState<WorkspacePreferences>("preferences")) ?? { radarRefreshMinutes: 60 }; }
  savePreferences(preferences: WorkspacePreferences) { return this.putState("preferences", preferences); }
}

let repositoryPromise: Promise<WorkspaceRepository> | null = null;
export function openWorkspaceRepository(): Promise<WorkspaceRepository> {
  repositoryPromise ??= openDatabase().then((db) => new IndexedDbWorkspaceRepository(db));
  return repositoryPromise;
}
