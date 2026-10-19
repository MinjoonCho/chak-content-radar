import assert from "node:assert/strict";
import test from "node:test";
import { scoreRadarSignals, trendFromObservations } from "../lib/radar/scoring";
import type { RadarSignal } from "../lib/types";

const base: RadarSignal = { id: "a", provider: "google-news-rss", providerLabel: "Google News RSS", sourceType: "search", evidenceKind: "article", clusterKey: "admissions", query: "대입", title: "대입 기사", url: "https://example.com/a", publishedAt: "2026-10-19T00:00:00.000Z", collectedAt: "2026-10-19T01:00:00.000Z", official: false, format: "article" };

test("공개 반응 지표가 없으면 반응 점수를 만들지 않는다", () => {
  const score = scoreRadarSignals([base], new Date("2026-10-19T02:00:00.000Z").getTime());
  assert.equal(score.engagementScore, null);
  assert.ok(score.recencyScore > 0);
  assert.ok(score.evidenceScore > 0);
});

test("실제 조회 좋아요 댓글이 있을 때만 반응 점수를 계산한다", () => {
  const score = scoreRadarSignals([{ ...base, metrics: { views: 10000, likes: 500, comments: 20 } }], new Date("2026-10-19T02:00:00.000Z").getTime());
  assert.ok(score.engagementScore !== null && score.engagementScore > 0);
});

test("추세는 이전과 현재의 근거 수와 반응 점수를 같은 단위로 비교한다", () => {
  assert.equal(trendFromObservations({ evidenceCount: 3, engagementScore: 20 }, { evidenceCount: 5, engagementScore: 20 }), "rising");
  assert.equal(trendFromObservations({ evidenceCount: 5, engagementScore: 20 }, { evidenceCount: 3, engagementScore: 20 }), "falling");
  assert.equal(trendFromObservations({ evidenceCount: 5, engagementScore: null }, { evidenceCount: 5, engagementScore: null }), "steady");
});
