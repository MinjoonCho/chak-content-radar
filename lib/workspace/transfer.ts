import { z } from "zod";
import { validateScene } from "@/lib/editor/scene";
import type { WorkspaceProject } from "./types";
import type { Slide } from "@/lib/types";

export const MAX_PROJECT_BYTES = 25 * 1024 * 1024;
const envelopeSchema = z.object({
  format: z.literal("chak"), version: z.literal(1), exportedAt: z.string(),
  project: z.object({ version: z.literal(1), id: z.string().min(1), topic: z.string(), title: z.string(), contentType: z.enum(["info", "viral", "curation", "breaking"]), template: z.enum(["A", "B", "C", "D"]), createdAt: z.string(), updatedAt: z.string(), slides: z.array(z.unknown()), caption: z.string(), hashtags: z.object({ core: z.array(z.string()), topic: z.array(z.string()), viral: z.array(z.string()) }), sourceLinks: z.array(z.string().url()), evidence: z.array(z.unknown()), imageSources: z.array(z.unknown()), officialSourceAvailable: z.boolean(), review: z.object({ copy: z.boolean(), sources: z.boolean(), images: z.boolean() }), status: z.enum(["draft", "needs_review", "ready"]) }).passthrough(),
});

export function exportProject(project: WorkspaceProject) {
  return JSON.stringify({ format: "chak", version: 1, exportedAt: new Date().toISOString(), project });
}

export function importProject(text: string, existingIds: string[]): WorkspaceProject {
  if (new TextEncoder().encode(text).byteLength > MAX_PROJECT_BYTES) throw new Error(".chak 파일 크기는 25MB 이하여야 합니다.");
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error("올바른 .chak JSON 파일이 아닙니다."); }
  if (value && typeof value === "object" && "version" in value && (value as { version?: unknown }).version !== 1) throw new Error("지원하지 않는 .chak 버전입니다.");
  const result = envelopeSchema.safeParse(value);
  if (!result.success) throw new Error("올바른 .chak 프로젝트 구조가 아닙니다.");
  const parsed = result.data.project as WorkspaceProject;
  const project = { ...parsed, slides: parsed.slides.map((slide) => {
    const candidate = slide as Slide;
    return candidate.canvas ? { ...candidate, canvas: validateScene(candidate.canvas) } : candidate;
  }) };
  if (!existingIds.includes(project.id)) return project;
  const now = new Date().toISOString();
  return { ...project, id: `${project.id}-copy-${Date.now()}`, title: `${project.title} (복사본)`, createdAt: now, updatedAt: now };
}
