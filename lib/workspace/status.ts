import type { WorkspaceProject, ProjectStatus, ReviewState } from "./types";

export type ReviewReason = keyof ReviewState;

export function isSensitiveProject(project: Pick<WorkspaceProject, "topic" | "contentType">) {
  return project.contentType === "breaking" || /입시|정시|수시|논술|규정|일정|준비물|합격|수능/.test(project.topic);
}

export function deriveProjectStatus(project: WorkspaceProject): ProjectStatus {
  const checks = Object.values(project.review).every(Boolean);
  if (checks && (!isSensitiveProject(project) || project.officialSourceAvailable)) return "ready";
  if (isSensitiveProject(project) || Object.values(project.review).some(Boolean)) return "needs_review";
  return "draft";
}

export function invalidateReview(project: WorkspaceProject, reason: ReviewReason): WorkspaceProject {
  const next = { ...project, updatedAt: new Date().toISOString(), review: { ...project.review, [reason]: false } };
  return { ...next, status: deriveProjectStatus(next) };
}

export function updateReview(project: WorkspaceProject, review: Partial<ReviewState>): WorkspaceProject {
  const next = { ...project, updatedAt: new Date().toISOString(), review: { ...project.review, ...review } };
  return { ...next, status: deriveProjectStatus(next) };
}
