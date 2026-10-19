import { allRadarQueries, clusterForText, isRelevantToCluster } from "@/lib/radar/config";
import { classifyOfficialUrl } from "@/lib/evidence/official";
import { fetchWithTimeout, signalId, stripHtml, toIso } from "@/lib/radar/helpers";
import type { RadarProviderId, RadarSignal } from "@/lib/types";
import type { CollectorResult } from "./types";

type NaverItem = { title?: string; description?: string; link?: string; originallink?: string; pubDate?: string; postdate?: string; bloggername?: string; cafename?: string };
type NaverKind = { endpoint: "news" | "blog" | "cafearticle"; provider: RadarProviderId; label: string };

const kinds: NaverKind[] = [
  { endpoint: "news", provider: "naver-news", label: "Naver News" },
  { endpoint: "blog", provider: "naver-blog", label: "Naver Blog" },
  { endpoint: "cafearticle", provider: "naver-cafe", label: "Naver Cafe" },
];

function naverDate(item: NaverItem) {
  if (item.pubDate) return toIso(item.pubDate);
  if (item.postdate && /^\d{8}$/.test(item.postdate)) return toIso(`${item.postdate.slice(0, 4)}-${item.postdate.slice(4, 6)}-${item.postdate.slice(6, 8)}T00:00:00+09:00`);
  return undefined;
}

export async function collectNaver(): Promise<CollectorResult[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return kinds.map((kind) => ({ signals: [], run: { provider: kind.provider, label: kind.label, status: "skipped", collected: 0, message: "NAVER_CLIENT_ID/SECRET 설정 필요" } }));
  const collectedAt = new Date().toISOString();
  return Promise.all(kinds.map(async (kind): Promise<CollectorResult> => {
    try {
      const batches = await Promise.all(allRadarQueries.map(async ({ query, clusterKey }) => {
        const params = new URLSearchParams({ query, display: "10", start: "1", sort: "date" });
        const response = await fetchWithTimeout(`https://openapi.naver.com/v1/search/${kind.endpoint}.json?${params}`, { headers: { "X-Naver-Client-Id": clientId, "X-Naver-Client-Secret": clientSecret } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json() as { items?: NaverItem[] };
        return (data.items ?? []).map((item): RadarSignal | null => {
          const title = stripHtml(item.title);
          const url = item.originallink || item.link;
          if (!title || !url) return null;
          const description = stripHtml(item.description);
          const assignedCluster = clusterForText(`${title} ${description}`, clusterKey);
          if (!isRelevantToCluster(`${title} ${description}`, assignedCluster)) return null;
          return {
            id: signalId(kind.provider, url), provider: kind.provider, providerLabel: kind.label,
            sourceType: kind.endpoint === "cafearticle" ? "community" : "search",
            evidenceKind: kind.endpoint === "cafearticle" ? "community" : kind.endpoint === "news" ? "article" : "post",
            clusterKey: assignedCluster, query, title,
            description, url, publishedAt: naverDate(item), collectedAt,
            author: stripHtml(item.bloggername || item.cafename) || undefined, official: false,
            format: kind.endpoint === "news" ? "article" : "post",
          };
        }).filter((signal): signal is RadarSignal => signal !== null);
      }));
      const signals = batches.flat();
      return { signals, run: { provider: kind.provider, label: kind.label, status: "ok", collected: signals.length, message: "네이버 공식 검색 API 수집" } };
    } catch (error) {
      return { signals: [], run: { provider: kind.provider, label: kind.label, status: "error", collected: 0, message: error instanceof Error ? error.message : "수집 실패" } };
    }
  }));
}

const webTargets = [
  { query: "site:orbi.kr 수능 OR 입시", clusterKey: "admissions", label: "오르비", official: false, sourceType: "community" as const, evidenceKind: "community" as const },
  { query: "site:moe.go.kr 수능 OR 입시", clusterKey: "exam-day", label: "교육부", official: true, sourceType: "official" as const, evidenceKind: "official" as const },
  { query: "site:suneung.re.kr 수능", clusterKey: "exam-day", label: "한국교육과정평가원", official: true, sourceType: "official" as const, evidenceKind: "official" as const },
  { query: "site:ebsi.co.kr 수능", clusterKey: "exam-day", label: "EBSi", official: true, sourceType: "official" as const, evidenceKind: "official" as const },
];

export async function collectNaverWeb(): Promise<CollectorResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { signals: [], run: { provider: "naver-web", label: "공식 사이트·오르비", status: "skipped", collected: 0, message: "NAVER_CLIENT_ID/SECRET 설정 필요" } };
  const collectedAt = new Date().toISOString();
  try {
    const batches = await Promise.all(webTargets.map(async (target) => {
      const params = new URLSearchParams({ query: target.query, display: "10", start: "1" });
      const response = await fetchWithTimeout(`https://openapi.naver.com/v1/search/webkr.json?${params}`, { headers: { "X-Naver-Client-Id": clientId, "X-Naver-Client-Secret": clientSecret } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as { items?: NaverItem[] };
      return (data.items ?? []).map((item): RadarSignal | null => {
        const title = stripHtml(item.title);
        if (!title || !item.link) return null;
        const description = stripHtml(item.description);
        const assignedCluster = clusterForText(`${title} ${description}`, target.clusterKey);
        if (!isRelevantToCluster(`${title} ${description}`, assignedCluster)) return null;
        return {
          id: signalId("naver-web", item.link), provider: "naver-web", providerLabel: target.label,
          sourceType: target.sourceType, evidenceKind: target.evidenceKind, clusterKey: assignedCluster,
          query: target.query, title, description, url: item.link, collectedAt,
          official: classifyOfficialUrl(item.link).official, format: "article",
        };
      }).filter((signal): signal is RadarSignal => signal !== null);
    }));
    const signals = batches.flat();
    return { signals, run: { provider: "naver-web", label: "공식 사이트·오르비", status: "ok", collected: signals.length, message: "네이버 웹문서 API로 도메인 한정 수집" } };
  } catch (error) {
    return { signals: [], run: { provider: "naver-web", label: "공식 사이트·오르비", status: "error", collected: 0, message: error instanceof Error ? error.message : "수집 실패" } };
  }
}
