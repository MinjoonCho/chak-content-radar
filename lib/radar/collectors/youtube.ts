import { allRadarQueries, clusterForText, isRelevantToCluster } from "@/lib/radar/config";
import { fetchWithTimeout, signalId, stripHtml } from "@/lib/radar/helpers";
import type { RadarSignal } from "@/lib/types";
import type { CollectorResult } from "./types";

type SearchItem = { id?: { videoId?: string }; snippet?: { title?: string; description?: string; publishedAt?: string; channelTitle?: string } };
type VideoItem = { id?: string; statistics?: { viewCount?: string; likeCount?: string; commentCount?: string }; contentDetails?: { duration?: string } };

function number(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function collectYouTube(): Promise<CollectorResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { signals: [], run: { provider: "youtube", label: "YouTube", status: "skipped", collected: 0, message: "YOUTUBE_API_KEY 설정 필요" } };
  const collectedAt = new Date().toISOString();
  const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const searchBatches = await Promise.all(allRadarQueries.map(async ({ query, clusterKey }) => {
      const params = new URLSearchParams({ part: "snippet", type: "video", q: query, maxResults: "10", order: "date", regionCode: "KR", relevanceLanguage: "ko", publishedAfter, key: apiKey });
      const response = await fetchWithTimeout(`https://www.googleapis.com/youtube/v3/search?${params}`);
      if (!response.ok) throw new Error(`search HTTP ${response.status}`);
      const data = await response.json() as { items?: SearchItem[] };
      return { clusterKey, query, items: data.items ?? [] };
    }));
    const ids = [...new Set(searchBatches.flatMap((batch) => batch.items.map((item) => item.id?.videoId).filter((id): id is string => Boolean(id))))];
    const stats = new Map<string, VideoItem>();
    for (let index = 0; index < ids.length; index += 50) {
      const params = new URLSearchParams({ part: "statistics,contentDetails", id: ids.slice(index, index + 50).join(","), key: apiKey });
      const response = await fetchWithTimeout(`https://www.googleapis.com/youtube/v3/videos?${params}`);
      if (!response.ok) throw new Error(`videos HTTP ${response.status}`);
      const data = await response.json() as { items?: VideoItem[] };
      for (const item of data.items ?? []) if (item.id) stats.set(item.id, item);
    }
    const signals = searchBatches.flatMap(({ query, clusterKey, items }) => items.map((item): RadarSignal | null => {
      const videoId = item.id?.videoId;
      const title = stripHtml(item.snippet?.title);
      if (!videoId || !title) return null;
      const description = stripHtml(item.snippet?.description);
      const assignedCluster = clusterForText(`${title} ${description}`, clusterKey);
      if (!isRelevantToCluster(`${title} ${description}`, assignedCluster)) return null;
      const detail = stats.get(videoId);
      const metrics = { views: number(detail?.statistics?.viewCount), likes: number(detail?.statistics?.likeCount), comments: number(detail?.statistics?.commentCount) };
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      return {
        id: signalId("youtube", url), provider: "youtube", providerLabel: "YouTube",
        sourceType: "video", evidenceKind: "video", clusterKey: assignedCluster,
        query, title, description, url, publishedAt: item.snippet?.publishedAt,
        collectedAt, author: item.snippet?.channelTitle, official: false, format: "video", metrics,
      };
    }).filter((signal): signal is RadarSignal => signal !== null));
    return { signals, run: { provider: "youtube", label: "YouTube", status: "ok", collected: signals.length, message: "최근 7일 영상과 공개 통계 수집" } };
  } catch (error) {
    return { signals: [], run: { provider: "youtube", label: "YouTube", status: "error", collected: 0, message: error instanceof Error ? error.message : "수집 실패" } };
  }
}
