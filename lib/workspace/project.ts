import type { GeneratedPost, SourceEvidence } from "@/lib/types";
import type { WorkspaceProject } from "./types";
import { deriveProjectStatus } from "./status";
import { sceneForSlide, syncLegacyFields } from "@/lib/editor/migrate";

export function migrateProjectScenes(project: WorkspaceProject): { project: WorkspaceProject; notices: string[] } {
  const notices: string[] = [];
  const slides = project.slides.map((slide, index) => {
    try { return syncLegacyFields(slide, sceneForSlide(slide, project.template)); }
    catch {
      notices.push(`${index + 1}번 카드의 편집 정보를 기본 배치로 복구했습니다.`);
      const legacy = { ...slide, canvas: undefined };
      return syncLegacyFields(legacy, sceneForSlide(legacy, project.template));
    }
  });
  return { project: { ...project, slides }, notices };
}

export function postToProject(post: GeneratedPost, evidence: SourceEvidence[] = [], existing?: WorkspaceProject): WorkspaceProject {
  const now = new Date().toISOString();
  const project: WorkspaceProject = { version: 1, ...post, updatedAt: now, evidence, review: existing?.review ?? { copy: false, sources: false, images: false } };
  project.status = deriveProjectStatus(project);
  return migrateProjectScenes(project).project;
}

export function projectToPost(project: WorkspaceProject): GeneratedPost {
  const migrated = migrateProjectScenes(project).project;
  const { version: _version, updatedAt: _updatedAt, evidence: _evidence, review: _review, ...post } = migrated;
  return post;
}
