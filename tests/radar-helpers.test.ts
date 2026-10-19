import assert from "node:assert/strict";
import test from "node:test";
import { dedupeSignals, stripHtml } from "../lib/radar/helpers";
import type { RadarSignal } from "../lib/types";

function signal(id: string, url: string): RadarSignal {
  return {
    id,
    provider: "google-news-rss",
    providerLabel: "Google News RSS",
    sourceType: "search",
    evidenceKind: "article",
    clusterKey: "admissions",
    query: "추가합격",
    title: id,
    url,
    collectedAt: "2026-10-13T07:00:00.000Z",
    official: false,
    format: "article",
  };
}

test("HTML로 인코딩된 RSS 설명도 태그 없이 정리한다", () => {
  assert.equal(stripHtml("&lt;a href=&quot;https://example.com&quot;&gt;기사 제목&lt;/a&gt;&amp;nbsp; 언론사"), "기사 제목 언론사");
});

test("공급자 표시 건수와 직접 링크 수에 쓰는 신호를 URL 기준으로 동일하게 중복 제거한다", () => {
  const signals = dedupeSignals([signal("one", "https://example.com/1"), signal("duplicate", "https://example.com/1"), signal("two", "https://example.com/2")]);
  assert.equal(signals.length, 2);
});
