import type { RadarProviderId, RadarSnapshot } from "@/lib/types";
import { buildRadarTopics } from "@/lib/radar/analyze";

export function isRadarRefreshDue(lastRunAt: string | null, intervalMinutes: number, now = Date.now()) {
  if (intervalMinutes <= 0) return false;
  if (!lastRunAt) return true;
  return now - new Date(lastRunAt).getTime() >= intervalMinutes * 60_000;
}

export function mergeRadarSnapshot(previous: RadarSnapshot | null, fresh: RadarSnapshot): RadarSnapshot {
  if (!previous) return fresh;
  const failed = new Set<RadarProviderId>(fresh.providers.filter((run) => run.status !== "ok").map((run) => run.provider));
  const preserved = previous.signals.filter((signal) => failed.has(signal.provider));
  const signals = [...new Map([...fresh.signals, ...preserved].map((signal) => [signal.url, signal])).values()];
  const topics = buildRadarTopics(signals, previous.topics, fresh.lastRunAt ?? new Date().toISOString());
  return { ...fresh, signals, topics };
}
