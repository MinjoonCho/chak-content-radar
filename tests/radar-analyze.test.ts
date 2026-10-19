import assert from "node:assert/strict";
import test from "node:test";
import { buildRadarTopics } from "../lib/radar/analyze";
import type { RadarSignal } from "../lib/types";

function signal(index: number): RadarSignal {
  return {
    id: `signal-${index}`,
    provider: "google-news-rss",
    providerLabel: "Google News RSS",
    sourceType: "search",
    evidenceKind: "article",
    clusterKey: "admissions",
    query: "추가합격",
    title: `실제 기사 ${index}`,
    description: `기사 설명 ${index}`,
    url: `https://example.com/article-${index}`,
    publishedAt: new Date(Date.UTC(2026, 9, 13, 3, index)).toISOString(),
    collectedAt: "2026-10-13T07:00:00.000Z",
    author: "테스트 언론사",
    official: false,
    format: "article",
  };
}

test("수집된 고유 원문을 상세 근거 목록에서 임의로 잘라내지 않는다", () => {
  const topics = buildRadarTopics(Array.from({ length: 13 }, (_, index) => signal(index)), [], "2026-10-13T07:00:00.000Z");
  assert.equal(topics.length, 1);
  assert.equal(topics[0].sources[0].evidence.length, 13);
  assert.match(topics[0].summary, /실제 원문 13개/);
});

test("동일 URL은 한 개의 근거로만 계산한다", () => {
  const duplicated = [signal(1), { ...signal(2), url: signal(1).url }];
  const topics = buildRadarTopics(duplicated, [], "2026-10-13T07:00:00.000Z");
  assert.equal(topics[0].sources[0].evidence.length, 1);
});

test("공식 원문이 없으면 공식 확인 상태를 만들지 않는다", () => {
  const topics = buildRadarTopics([signal(1)], [], "2026-10-13T07:00:00.000Z");
  assert.equal(topics[0].officialSourceAvailable, false);
});

test("Instagram 릴스가 수집되면 실제 원문 기반 Format Radar 항목을 만든다", () => {
  const reel = (index: number): RadarSignal => ({
    ...signal(index),
    id: `instagram-${index}`,
    provider: "instagram",
    providerLabel: "Instagram",
    sourceType: "social",
    evidenceKind: "reel",
    format: "reel",
    title: `POV 수능 끝난 날 ${index}`,
    description: "POV 형식의 짧은 릴스",
    url: `https://www.instagram.com/reel/example-${index}/`,
    metrics: { likes: 1000 + index, comments: 20 },
  });
  const topics = buildRadarTopics([reel(1), reel(2)], [], "2026-10-13T07:00:00.000Z");
  const formatTopic = topics.find((topic) => topic.kind === "format");
  assert.ok(formatTopic);
  assert.equal(formatTopic.sources[0].evidence.length, 2);
  assert.match(formatTopic.title, /릴스/);
});
