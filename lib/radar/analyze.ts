import { radarClusters } from "@/lib/radar/config";
import { buildFormatPatterns } from "@/lib/radar/formats";
import { metricNote } from "@/lib/radar/helpers";
import { scoreRadarSignals, trendFromObservations } from "@/lib/radar/scoring";
import type { ContentType, RadarItem, RadarSignal, SourceSignal } from "@/lib/types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function timeValue(signal: RadarSignal) {
  return new Date(signal.publishedAt ?? signal.collectedAt).getTime();
}

function contentType(signals: RadarSignal[], official: boolean, urgency: number): ContentType {
  if (official && urgency >= 65) return "breaking";
  if (signals.some((signal) => signal.provider === "instagram" || signal.provider === "youtube")) return "viral";
  if (signals.some((signal) => signal.clusterKey === "benefits")) return "curation";
  return "info";
}

function planFor(type: ContentType) {
  if (type === "breaking") return ["무슨 발표인가", "핵심 변경점", "대상과 일정", "지금 할 일", "공식 원문"];
  if (type === "viral") return ["주목받은 장면", "공감 포인트", "반복되는 반응", "CHAK 관점", "댓글 질문"];
  if (type === "curation") return ["혜택 한눈에 보기", "대상과 기간", "필요한 증빙", "주의 조건", "공식 링크"];
  return ["왜 주목받나", "핵심 정보", "학생에게 미치는 영향", "확인할 점", "출처"];
}

function groupedSources(signals: RadarSignal[]): SourceSignal[] {
  const groups = new Map<string, RadarSignal[]>();
  for (const signal of signals) groups.set(signal.providerLabel, [...(groups.get(signal.providerLabel) ?? []), signal]);
  return [...groups.entries()].map(([label, entries]) => {
    const sorted = entries.sort((a, b) => timeValue(b) - timeValue(a));
    const official = sorted.some((entry) => entry.official);
    return {
      label,
      value: `${sorted.length}개 원문`,
      official,
      headline: sorted[0].title,
      detail: `${label}에서 실제 수집한 원문 ${sorted.length}개입니다. 각 항목은 해당 기사·게시물·영상으로 직접 이동합니다.`,
      query: [...new Set(sorted.map((entry) => entry.query))].join(", "),
      capturedAt: new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(sorted[0].collectedAt)),
      sourceType: official ? "official" : sorted[0].sourceType,
      evidence: sorted.map((entry) => ({
        label: entry.title,
        url: entry.url,
        kind: entry.evidenceKind,
        note: metricNote(entry.metrics) ?? entry.description?.slice(0, 90),
        publishedAt: entry.publishedAt,
        author: entry.author,
        metrics: entry.metrics,
      })),
    };
  });
}

export function buildRadarTopics(signals: RadarSignal[], previous: RadarItem[], collectedAt: string): RadarItem[] {
  const now = new Date(collectedAt).getTime();
  const grouped = new Map<string, RadarSignal[]>();
  for (const signal of signals) grouped.set(signal.clusterKey, [...(grouped.get(signal.clusterKey) ?? []), signal]);

  const topicItems = [...grouped.entries()].map(([clusterKey, entries]) => {
    const unique = [...new Map(entries.map((entry) => [entry.url, entry])).values()].sort((a, b) => timeValue(b) - timeValue(a));
    const top = unique.slice().sort((a, b) => {
      const engagementA = (a.metrics?.views ?? 0) + (a.metrics?.likes ?? 0) * 20 + (a.metrics?.comments ?? 0) * 50;
      const engagementB = (b.metrics?.views ?? 0) + (b.metrics?.likes ?? 0) * 20 + (b.metrics?.comments ?? 0) * 50;
      return engagementB - engagementA || timeValue(b) - timeValue(a);
    })[0];
    const official = unique.some((signal) => signal.official);
    const scores = scoreRadarSignals(unique, now);
    const recency = scores.recencyScore;
    const engagement = scores.engagementScore ?? 0;
    const diversity = new Set(unique.map((signal) => signal.provider)).size;
    const viralScore = clamp(engagement * .5 + recency * .25 + Math.min(25, diversity * 6));
    const infoScore = clamp((official ? 45 : 0) + Math.min(30, unique.length * 3) + Math.min(15, diversity * 4) + recency * .1);
    const urgencyScore = clamp(recency * .65 + (official ? 25 : 0) + Math.min(10, diversity * 3));
    const recommendedContentType = contentType(unique, official, urgencyScore);
    const cluster = radarClusters.find((candidate) => candidate.key === clusterKey);
    const previousTopic = previous.find((topic) => topic.id === clusterKey);
    const latestAt = new Date(Math.max(...unique.map(timeValue))).toISOString();
    const title = top.title.length > 66 ? `${top.title.slice(0, 64)}…` : top.title;
    return {
      id: clusterKey,
      title,
      summary: `${cluster?.label ?? "수험생 이슈"} 관련 실제 원문 ${unique.length}개를 ${diversity}개 수집 경로에서 확인했습니다.`,
      generationTopic: title,
      coverHook: title,
      cardPlan: planFor(recommendedContentType),
      keywords: [...new Set(unique.map((signal) => signal.query))].slice(0, 6),
      sources: groupedSources(unique),
      detectedAt: latestAt,
      firstSeenAt: previousTopic?.firstSeenAt ?? collectedAt,
      lastCollectedAt: collectedAt,
      trendDirection: trendFromObservations(previousTopic ? { evidenceCount: previousTopic.sources.reduce((sum, source) => sum + source.evidence.length, 0), engagementScore: previousTopic.engagementScore ?? null } : undefined, { evidenceCount: unique.length, engagementScore: scores.engagementScore }),
      engagementScore: scores.engagementScore, evidenceScore: scores.evidenceScore, recencyScore: scores.recencyScore,
      viralScore, infoScore, urgencyScore, officialSourceAvailable: official,
      recommendedContentType, kind: "topic",
    } satisfies RadarItem;
  }).sort((a, b) => {
    const scoreA = a.viralScore * .45 + a.infoScore * .4 + a.urgencyScore * .15;
    const scoreB = b.viralScore * .45 + b.infoScore * .4 + b.urgencyScore * .15;
    return scoreB - scoreA;
  });

  return [...topicItems, ...buildFormatPatterns(signals, previous, collectedAt)];
}
