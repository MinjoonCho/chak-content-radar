import { readFile } from "node:fs/promises";
import path from "node:path";
import { instagramAccounts, parseWatchAccounts } from "@/lib/config/watch-accounts";
import { clusterForText, isRelevantToCluster } from "@/lib/radar/config";
import { fetchWithTimeout, signalId, stripHtml } from "@/lib/radar/helpers";
import type { RadarSignal } from "@/lib/types";
import type { CollectorResult } from "./types";

type InstagramMedia = { id?: string; caption?: string; media_type?: string; media_product_type?: string; permalink?: string; timestamp?: string; like_count?: number; comments_count?: number };

async function watchAccounts() {
  try {
    const yaml = await readFile(path.join(process.cwd(), "config", "watch_accounts.yaml"), "utf8");
    return instagramAccounts(parseWatchAccounts(yaml));
  } catch {
    return [];
  }
}

export async function collectInstagram(): Promise<CollectorResult> {
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accounts = await watchAccounts();
  if (!accountId || !accessToken) return { signals: [], run: { provider: "instagram", label: "Instagram", status: "skipped", collected: 0, message: "INSTAGRAM_ACCOUNT_ID/ACCESS_TOKEN 설정 필요" } };
  if (!accounts.length) return { signals: [], run: { provider: "instagram", label: "Instagram", status: "skipped", collected: 0, message: "watch_accounts.yaml에 검수 계정 추가 필요" } };
  const version = process.env.META_GRAPH_VERSION || "v22.0";
  const collectedAt = new Date().toISOString();
  try {
    const batches = await Promise.all(accounts.map(async (username) => {
      const fields = `business_discovery.username(${username}){username,media.limit(12){id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count}}`;
      const params = new URLSearchParams({ fields, access_token: accessToken });
      const response = await fetchWithTimeout(`https://graph.facebook.com/${version}/${accountId}?${params}`);
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`@${username} HTTP ${response.status}: ${body.slice(0, 140)}`);
      }
      const data = await response.json() as { business_discovery?: { username?: string; media?: { data?: InstagramMedia[] } } };
      return (data.business_discovery?.media?.data ?? []).map((media): RadarSignal | null => {
        const url = media.permalink;
        const caption = stripHtml(media.caption);
        if (!url || !caption) return null;
        const isReel = media.media_product_type === "REELS";
        const title = caption.slice(0, 100);
        const assignedCluster = clusterForText(caption, "after-exam");
        if (!isRelevantToCluster(caption, assignedCluster)) return null;
        return {
          id: signalId("instagram", url), provider: "instagram", providerLabel: "Instagram",
          sourceType: "social", evidenceKind: isReel ? "reel" : "post", clusterKey: assignedCluster, query: `@${username}`,
          title, description: caption.slice(0, 280), url, publishedAt: media.timestamp, collectedAt,
          author: `@${data.business_discovery?.username ?? username}`, official: false, format: isReel ? "reel" : "post",
          metrics: { likes: media.like_count, comments: media.comments_count },
        };
      }).filter((signal): signal is RadarSignal => signal !== null);
    }));
    const signals = batches.flat();
    return { signals, run: { provider: "instagram", label: "Instagram", status: "ok", collected: signals.length, message: "감시 계정의 게시물·릴스와 공개 반응 수집" } };
  } catch (error) {
    return { signals: [], run: { provider: "instagram", label: "Instagram", status: "error", collected: 0, message: error instanceof Error ? error.message : "수집 실패" } };
  }
}
