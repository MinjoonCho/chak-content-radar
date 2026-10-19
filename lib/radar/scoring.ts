import type { RadarSignal, RadarScores } from "@/lib/types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export type RadarObservation = { evidenceCount: number; engagementScore: number | null };

export function scoreRadarSignals(signals: RadarSignal[], now: number): RadarScores {
  const latest = Math.max(...signals.map((signal) => new Date(signal.publishedAt ?? signal.collectedAt).getTime()));
  const recencyScore = clamp(100 - (Math.max(0, now - latest) / 3_600_000 / 168) * 100);
  const measured = signals.filter((signal) => signal.metrics && Object.values(signal.metrics).some((value) => value !== undefined));
  const engagementScore = measured.length ? clamp(measured.reduce((sum, signal) => {
    const { views = 0, likes = 0, comments = 0 } = signal.metrics ?? {};
    return sum + Math.log10(views + 1) * 8 + Math.log10(likes + 1) * 10 + Math.log10(comments + 1) * 12;
  }, 0) / measured.length) : null;
  const diversity = new Set(signals.map((signal) => signal.provider)).size;
  const official = signals.some((signal) => signal.official);
  const evidenceScore = clamp(Math.min(55, signals.length * 5) + Math.min(25, diversity * 8) + (official ? 20 : 0));
  return { engagementScore, evidenceScore, recencyScore };
}

export function trendFromObservations(previous: RadarObservation | undefined, current: RadarObservation): "new" | "rising" | "steady" | "falling" {
  if (!previous) return "new";
  if (current.evidenceCount > previous.evidenceCount || (current.engagementScore !== null && previous.engagementScore !== null && current.engagementScore > previous.engagementScore + 8)) return "rising";
  if (current.evidenceCount < previous.evidenceCount * .7 || (current.engagementScore !== null && previous.engagementScore !== null && current.engagementScore < previous.engagementScore - 12)) return "falling";
  return "steady";
}
