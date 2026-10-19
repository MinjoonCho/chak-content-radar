import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGeneratedPost } from "../lib/generation/normalize";
import type { NormalizeContext } from "../lib/generation/normalize";

const context: NormalizeContext = { count: 4, allowedEvidenceIds: ["E1"], base: { id: "p", topic: "t", title: "t", contentType: "info", template: "A", createdAt: "2026-01-01", slides: [], caption: "", hashtags: { core: [], topic: [], viral: [] }, sourceLinks: [], imageSources: [], status: "draft", officialSourceAvailable: false } };
test("정확한 장수로 보정하고 허용되지 않은 레이아웃을 교체한다", () => {
  const post = normalizeGeneratedPost({ title: "x", slides: [{ headline: "1", layoutVariant: "evil" }], caption: "c", hashtags: { core: [], topic: [], viral: [] } }, context);
  assert.equal(post.slides.length, 4); assert.equal(post.slides[0].layoutVariant, "text_only");
});
test("알 수 없는 근거 ID를 거부한다", () => assert.throws(() => normalizeGeneratedPost({ title: "x", slides: [{ headline: "1", evidenceIds: ["BAD"] }], caption: "c", hashtags: { core: [], topic: [], viral: [] } }, context), /근거 ID/));
