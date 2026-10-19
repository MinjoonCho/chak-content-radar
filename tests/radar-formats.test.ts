import assert from "node:assert/strict";
import test from "node:test";
import { buildFormatPatterns, detectCaptionPattern } from "../lib/radar/formats";
import type { RadarSignal } from "../lib/types";

function reel(id: string, title: string): RadarSignal {
  return { id, provider: "instagram", providerLabel: "Instagram", sourceType: "social", evidenceKind: "reel", clusterKey: "after-exam", query: "@student", title, description: title, url: `https://instagram.com/reel/${id}/`, publishedAt: "2026-10-19T00:00:00.000Z", collectedAt: "2026-10-19T01:00:00.000Z", author: `@${id}`, official: false, format: "reel", metrics: { likes: 100, comments: 10 } };
}

test("캡션에서 설명 가능한 포맷 패턴을 추출한다", () => {
  assert.equal(detectCaptionPattern("POV: 수능 끝난 날의 나"), "pov");
  assert.equal(detectCaptionPattern("수험생이 꼭 챙길 5가지 체크리스트"), "checklist");
});

test("한 개뿐인 포맷은 Radar 패턴으로 만들지 않는다", () => {
  assert.equal(buildFormatPatterns([reel("one", "POV: 수능 끝난 날")], [], "2026-10-19T02:00:00.000Z").length, 0);
});

test("같은 실제 포맷 근거가 두 개면 링크를 모두 포함한 패턴을 만든다", () => {
  const items = buildFormatPatterns([reel("one", "POV: 수능 끝난 날"), reel("two", "POV: 고3 마지막 등교")], [], "2026-10-19T02:00:00.000Z");
  assert.equal(items.length, 1);
  assert.equal(items[0].kind, "format");
  assert.equal(items[0].sources[0].evidence.length, 2);
  assert.match(items[0].title, /POV/);
});
