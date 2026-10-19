import assert from "node:assert/strict";
import test from "node:test";
import { MemoryWorkspaceRepository } from "../lib/workspace/memory";
import type { WorkspaceProject } from "../lib/workspace/types";

const item = { version: 1, id: "one", topic: "주제", title: "제목", contentType: "info", template: "A", createdAt: "2026-10-19T00:00:00Z", updatedAt: "2026-10-19T00:00:00Z", slides: [], caption: "캡션", hashtags: { core: [], topic: [], viral: [] }, sourceLinks: [], evidence: [], imageSources: [], officialSourceAvailable: false, review: { copy: false, sources: false, images: false }, status: "draft" } satisfies WorkspaceProject;

test("프로젝트를 정확히 저장하고 다시 연다", async () => {
  const repo = new MemoryWorkspaceRepository();
  await repo.saveProject(item);
  assert.deepEqual(await repo.getProject("one"), item);
  assert.deepEqual(await repo.listProjects(), [item]);
});

test("실패한 쓰기는 기존 프로젝트를 보존한다", async () => {
  const repo = new MemoryWorkspaceRepository([item]);
  repo.failWrites = true;
  await assert.rejects(repo.saveProject({ ...item, title: "덮어쓰기" }));
  assert.equal((await repo.getProject("one"))?.title, "제목");
});
