import { metricNote } from "@/lib/radar/helpers";
import { scoreRadarSignals, trendFromObservations } from "@/lib/radar/scoring";
import type { RadarItem, RadarSignal, SourceSignal } from "@/lib/types";

export type CaptionPattern = "pov" | "checklist" | "question" | "myth-fact" | "before-after" | "reaction" | "ranking" | "plain";

export function detectCaptionPattern(text: string): CaptionPattern {
  const value = text.toLowerCase();
  if (/\bpov\b|시점/.test(value)) return "pov";
  if (/체크리스트|\d+가지|꼭 챙/.test(value)) return "checklist";
  if (/\?|어떻게|왜 /.test(value)) return "question";
  if (/오해|진실|팩트|myth/.test(value)) return "myth-fact";
  if (/전후|before|after|비포|애프터/.test(value)) return "before-after";
  if (/반응|리액션/.test(value)) return "reaction";
  if (/순위|랭킹|top\s*\d/.test(value)) return "ranking";
  return "plain";
}

const labels: Record<CaptionPattern, string> = { pov: "POV", checklist: "체크리스트", question: "질문형", "myth-fact": "오해와 팩트", "before-after": "비포·애프터", reaction: "리액션", ranking: "랭킹", plain: "일반" };
const formatLabels: Record<"reel" | "video" | "post", string> = { reel: "릴스", video: "영상", post: "게시물" };

function sources(signals: RadarSignal[]): SourceSignal[] {
  const groups = new Map<string, RadarSignal[]>();
  for (const signal of signals) groups.set(signal.providerLabel, [...(groups.get(signal.providerLabel) ?? []), signal]);
  return [...groups.entries()].map(([label, entries]) => ({
    label, value: `${entries.length}개 원문`, official: false, headline: entries[0].title,
    detail: `실제 ${label} 원문에서 같은 포맷이 반복된 근거입니다.`, query: [...new Set(entries.map((entry) => entry.query))].join(", "),
    capturedAt: entries[0].collectedAt, sourceType: entries[0].sourceType,
    evidence: entries.map((entry) => ({ label: entry.title, url: entry.url, kind: entry.evidenceKind, note: metricNote(entry.metrics), publishedAt: entry.publishedAt, author: entry.author, metrics: entry.metrics })),
  }));
}

export function buildFormatPatterns(signals: RadarSignal[], previous: RadarItem[], collectedAt: string): RadarItem[] {
  const groups = new Map<string, RadarSignal[]>();
  for (const signal of signals.filter((entry) => entry.format === "reel" || entry.format === "video" || entry.format === "post")) {
    const pattern = detectCaptionPattern(`${signal.title} ${signal.description ?? ""}`);
    const key = `${signal.provider}:${signal.format}:${pattern}`;
    groups.set(key, [...(groups.get(key) ?? []), signal]);
  }
  return [...groups.entries()].filter(([, entries]) => new Set(entries.map((entry) => entry.url)).size >= 2).map(([key, entries]) => {
    const unique = [...new Map(entries.map((entry) => [entry.url, entry])).values()];
    const pattern = detectCaptionPattern(`${unique[0].title} ${unique[0].description ?? ""}`);
    const score = scoreRadarSignals(unique, new Date(collectedAt).getTime());
    const old = previous.find((item) => item.id === `format-${key}`);
    return {
      id: `format-${key}`, title: `${unique[0].providerLabel} ${formatLabels[unique[0].format as "reel" | "video" | "post"]} · ${labels[pattern]} 반복 포맷`, summary: `서로 다른 실제 원문 ${unique.length}개에서 ${labels[pattern]} 구성이 반복됐습니다.`, generationTopic: unique[0].title,
      coverHook: unique[0].title, cardPlan: ["반복 훅", "실제 사례", "반응 비교", "CHAK 적용", "출처"], keywords: [labels[pattern]], sources: sources(unique),
      detectedAt: unique.map((entry) => entry.publishedAt ?? entry.collectedAt).sort().at(-1)!, firstSeenAt: old?.firstSeenAt ?? collectedAt, lastCollectedAt: collectedAt,
      trendDirection: trendFromObservations(old ? { evidenceCount: old.sources.reduce((n, source) => n + source.evidence.length, 0), engagementScore: old.engagementScore } : undefined, { evidenceCount: unique.length, engagementScore: score.engagementScore }),
      engagementScore: score.engagementScore, evidenceScore: score.evidenceScore, recencyScore: score.recencyScore,
      viralScore: score.engagementScore ?? 0, infoScore: score.evidenceScore, urgencyScore: score.recencyScore,
      officialSourceAvailable: false, recommendedContentType: "viral", kind: "format",
    } satisfies RadarItem;
  });
}
