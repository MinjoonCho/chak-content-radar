import assert from "node:assert/strict";
import test from "node:test";
import { exportProject, importProject, MAX_PROJECT_BYTES } from "../lib/workspace/transfer";
import type { WorkspaceProject } from "../lib/workspace/types";
import { sceneForSlide } from "../lib/editor/migrate";

const item = { version: 1, id: "one", topic: "주제", title: "제목", contentType: "info", template: "A", createdAt: "2026-10-19T00:00:00Z", updatedAt: "2026-10-19T00:00:00Z", slides: [], caption: "캡션", hashtags: { core: [], topic: [], viral: [] }, sourceLinks: [], evidence: [], imageSources: [], officialSourceAvailable: false, review: { copy: false, sources: false, images: false }, status: "draft" } satisfies WorkspaceProject;

test(".chak 왕복은 프로젝트를 보존한다", () => assert.deepEqual(importProject(exportProject(item), []), item));
test("손상 JSON과 다른 스키마 버전을 거부한다", () => {
  assert.throws(() => importProject("{", []), /올바른 .chak/);
  assert.throws(() => importProject(JSON.stringify({ format: "chak", version: 2, project: item }), []), /버전/);
});
test("중복 ID는 원본을 덮지 않고 복사본 ID를 만든다", () => assert.match(importProject(exportProject(item), ["one"]).id, /^one-copy-/));
test("너무 큰 가져오기는 거부한다", () => assert.throws(() => importProject("x".repeat(MAX_PROJECT_BYTES + 1), []), /크기/));
test("자유 편집 장면을 .chak 파일에서 정확히 왕복한다", () => {
  const slide = { index: 1, type: "cover" as const, headline: "제목", body: "본문", imageQueryKo: "학생", imageQueryEn: "student", imageRequired: false, layoutVariant: "text_only" as const };
  const withScene = { ...item, slides: [{ ...slide, canvas: sceneForSlide(slide, "A") }] };
  assert.deepEqual(importProject(exportProject(withScene), []).slides[0].canvas, withScene.slides[0].canvas);
});
test("손상되거나 요소가 너무 많은 장면은 가져오기 전에 거부한다", () => {
  const bad = { ...item, slides: [{ canvas: { version: 1, width: 1080, height: 1350, elements: [{ id: "bad" }] } }] };
  assert.throws(() => importProject(exportProject(bad as unknown as WorkspaceProject), []), /요소|구조/);
});
