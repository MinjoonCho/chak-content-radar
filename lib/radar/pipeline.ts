import "server-only";
import { buildRadarTopics } from "@/lib/radar/analyze";
import { collectGoogleNews } from "@/lib/radar/collectors/google-news";
import { collectInstagram } from "@/lib/radar/collectors/instagram";
import { collectNaver, collectNaverWeb } from "@/lib/radar/collectors/naver";
import { collectYouTube } from "@/lib/radar/collectors/youtube";
import { dedupeSignals } from "@/lib/radar/helpers";
import type { RadarSignal, RadarSnapshot } from "@/lib/types";

const emptySnapshot: RadarSnapshot = { version: 1, lastRunAt: null, topics: [], signals: [], providers: [] };

export async function runRadarPipeline(previous: RadarSnapshot = emptySnapshot): Promise<RadarSnapshot> {
  const [googleNews, naverKinds, naverWeb, youtube, instagram] = await Promise.all([
    collectGoogleNews(), collectNaver(), collectNaverWeb(), collectYouTube(), collectInstagram(),
  ]);
  const results = [googleNews, ...naverKinds, naverWeb, youtube, instagram];
  const signals = dedupeSignals(results.flatMap((result) => result.signals))
    .sort((a, b) => new Date(b.publishedAt ?? b.collectedAt).getTime() - new Date(a.publishedAt ?? a.collectedAt).getTime())
    .slice(0, 500) as RadarSignal[];
  const providers = results.map((result) => ({
    ...result.run,
    collected: result.run.status === "ok" ? signals.filter((signal) => signal.provider === result.run.provider).length : 0,
  }));
  if (!signals.length) return { ...previous, providers };
  const lastRunAt = new Date().toISOString();
  const snapshot: RadarSnapshot = {
    version: 1,
    lastRunAt,
    signals,
    topics: buildRadarTopics(signals, previous.topics, lastRunAt),
    providers,
  };
  return snapshot;
}
