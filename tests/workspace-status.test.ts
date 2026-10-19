import assert from "node:assert/strict";
import test from "node:test";
import { deriveProjectStatus, invalidateReview } from "../lib/workspace/status";
import type { WorkspaceProject } from "../lib/workspace/types";

const project = (patch: Partial<WorkspaceProject> = {}): WorkspaceProject => ({
  version: 1, id: "p1", topic: "정시 일정", title: "정시 일정", contentType: "breaking", template: "A",
  createdAt: "2026-10-19T00:00:00Z", updatedAt: "2026-10-19T00:00:00Z", slides: [], caption: "", hashtags: { core: [], topic: [], viral: [] },
  sourceLinks: ["https://www.moe.go.kr/a"], evidence: [], imageSources: [], officialSourceAvailable: true,
  review: { copy: true, sources: true, images: true }, status: "ready", ...patch,
});

test("민감 콘텐츠는 공식 근거와 모든 검수가 있어야 ready다", () => {
  assert.equal(deriveProjectStatus(project()), "ready");
  assert.equal(deriveProjectStatus(project({ officialSourceAvailable: false })), "needs_review");
  assert.equal(deriveProjectStatus(project({ review: { copy: true, sources: false, images: true } })), "needs_review");
});

test("문구 편집은 문구 검수를 무효화하고 ready를 해제한다", () => {
  const next = invalidateReview(project(), "copy");
  assert.equal(next.review.copy, false);
  assert.equal(next.status, "needs_review");
});

test("이미지 편집은 이미지 검수만 무효화한다", () => {
  const next = invalidateReview(project(), "images");
  assert.deepEqual(next.review, { copy: true, sources: true, images: false });
});
