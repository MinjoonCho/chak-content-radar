import assert from "node:assert/strict";
import test from "node:test";
import { sceneForSlide } from "../lib/editor/migrate";
import { MemoryWorkspaceRepository } from "../lib/workspace/memory";
import { migrateProjectScenes, postToProject, projectToPost } from "../lib/workspace/project";
import { invalidateReview } from "../lib/workspace/status";
import type { Slide } from "../lib/types";
import type { WorkspaceProject } from "../lib/workspace/types";

const slide: Slide = { index: 1, type: "cover", headline: "제목", body: "본문", imageQueryKo: "학생", imageQueryEn: "student", imageRequired: false, layoutVariant: "text_only" };
const project: WorkspaceProject = { version: 1, id: "scene-one", topic: "주제", title: "제목", contentType: "info", template: "A", createdAt: "2026-10-19T00:00:00Z", updatedAt: "2026-10-19T00:00:00Z", slides: [slide], caption: "캡션", hashtags: { core: [], topic: [], viral: [] }, sourceLinks: [], evidence: [], imageSources: [], officialSourceAvailable: false, review: { copy: true, sources: true, images: true }, status: "ready" };

test("기존 프로젝트를 열면 카드마다 자유 편집 장면을 만든다", () => {
  const post = projectToPost(project);
  assert.ok(post.slides[0].canvas);
  assert.equal(post.slides[0].canvas?.elements.find((element) => element.role === "headline")?.type, "text");
});

test("손상된 저장 장면은 기존 문구로 복구하고 알림을 남긴다", () => {
  const malformed = { ...project, slides: [{ ...slide, canvas: { version: 1, width: 1080, height: 1350, elements: [{ id: "bad" }] } }] } as unknown as WorkspaceProject;
  const result = migrateProjectScenes(malformed);
  assert.ok(result.project.slides[0].canvas);
  assert.equal(result.notices.length, 1);
  assert.match(result.notices[0], /1번 카드/);
});

test("장면이 포함된 프로젝트를 저장하고 정확히 다시 연다", async () => {
  const post = projectToPost(project);
  const stored = postToProject(post);
  const repository = new MemoryWorkspaceRepository();
  await repository.saveProject(stored);
  assert.deepEqual((await repository.getProject(stored.id))?.slides[0].canvas, stored.slides[0].canvas);
});

test("저장 실패는 마지막 저장 장면을 바꾸지 않는다", async () => {
  const stored = postToProject(projectToPost(project));
  const repository = new MemoryWorkspaceRepository([stored]);
  repository.failWrites = true;
  const edited = { ...stored, slides: [{ ...stored.slides[0], canvas: sceneForSlide({ ...slide, headline: "새 제목" }, "A") }] };
  await assert.rejects(repository.saveProject(edited));
  assert.deepEqual((await repository.getProject(stored.id))?.slides[0].canvas, stored.slides[0].canvas);
});

test("문구·이미지·출처 편집은 해당 검수만 무효화한다", () => {
  for (const reason of ["copy", "images", "sources"] as const) {
    const result = invalidateReview(project, reason);
    assert.equal(result.review[reason], false);
    for (const other of ["copy", "images", "sources"] as const) if (other !== reason) assert.equal(result.review[other], true);
  }
});
