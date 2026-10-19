import { allRadarQueries, clusterForText, isRelevantToCluster } from "@/lib/radar/config";
import { fetchWithTimeout, signalId, stripHtml, toIso } from "@/lib/radar/helpers";
import type { RadarSignal } from "@/lib/types";
import type { CollectorResult } from "./types";

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return stripHtml(match?.[1]?.replace(/^<!\[CDATA\[|\]\]>$/g, "") ?? "");
}

export async function collectGoogleNews(): Promise<CollectorResult> {
  const collectedAt = new Date().toISOString();
  try {
    const batches = await Promise.all(allRadarQueries.map(async ({ query, clusterKey }) => {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:7d`)}&hl=ko&gl=KR&ceid=KR:ko`;
      const response = await fetchWithTimeout(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xml = await response.text();
      return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 8).map((match): RadarSignal | null => {
        const title = tag(match[1], "title");
        const link = tag(match[1], "link");
        if (!title || !link) return null;
        const author = tag(match[1], "source") || undefined;
        const description = tag(match[1], "description");
        const assignedCluster = clusterForText(`${title} ${description}`, clusterKey);
        if (!isRelevantToCluster(`${title} ${description}`, assignedCluster)) return null;
        return {
          id: signalId("google-news-rss", link), provider: "google-news-rss", providerLabel: "Google News RSS",
          sourceType: "search", evidenceKind: "article", clusterKey: assignedCluster, query,
          title, description, url: link, publishedAt: toIso(tag(match[1], "pubDate")),
          collectedAt, author, official: false, format: "article",
        };
      }).filter((signal): signal is RadarSignal => signal !== null);
    }));
    const signals = batches.flat();
    return { signals, run: { provider: "google-news-rss", label: "Google News RSS", status: "ok", collected: signals.length, message: "최근 7일 기사 원문 항목 수집" } };
  } catch (error) {
    return { signals: [], run: { provider: "google-news-rss", label: "Google News RSS", status: "error", collected: 0, message: error instanceof Error ? error.message : "수집 실패" } };
  }
}
