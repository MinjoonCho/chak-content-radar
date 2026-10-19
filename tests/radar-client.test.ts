import assert from "node:assert/strict";
import test from "node:test";
import { isRadarRefreshDue, mergeRadarSnapshot } from "../lib/radar/client";
import type { RadarSnapshot } from "../lib/types";

const old: RadarSnapshot = { version: 1, lastRunAt: "2026-10-19T00:00:00Z", topics: [], signals: [{ id: "a", provider: "youtube", providerLabel: "YT", sourceType: "video", evidenceKind: "video", clusterKey: "c", query: "q", title: "t", url: "https://youtube.com/a", collectedAt: "2026-10-19T00:00:00Z", official: false }], providers: [{ provider: "youtube", label: "YT", status: "ok", collected: 1, message: "ok" }] };
test("실패한 공급자는 직전 신호를 보존한다", () => {
  const fresh: RadarSnapshot = { version: 1, lastRunAt: "2026-10-19T01:00:00Z", topics: [], signals: [], providers: [{ provider: "youtube", label: "YT", status: "error", collected: 0, message: "fail" }] };
  assert.equal(mergeRadarSnapshot(old, fresh).signals.length, 1);
});
test("자동 새로고침 간격과 꺼짐을 계산한다", () => {
  assert.equal(isRadarRefreshDue("2026-10-19T00:00:00Z", 60, new Date("2026-10-19T01:00:01Z").getTime()), true);
  assert.equal(isRadarRefreshDue("2026-10-19T00:00:00Z", 0, Date.now()), false);
});
