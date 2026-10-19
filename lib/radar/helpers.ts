import { createHash } from "node:crypto";
import type { RadarSignal } from "@/lib/types";

export function signalId(provider: string, url: string) {
  return createHash("sha1").update(`${provider}:${url}`).digest("hex").slice(0, 20);
}

export function stripHtml(value = "") {
  const decoded = value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;|&#160;/g, " ");
  return decoded
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function dedupeSignals(signals: RadarSignal[]) {
  return [...new Map(signals.map((signal) => [signal.url, signal])).values()];
}

export function toIso(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function metricNote(metrics?: { views?: number; likes?: number; comments?: number }) {
  if (!metrics) return undefined;
  const values = [
    metrics.views !== undefined ? `조회 ${metrics.views.toLocaleString("ko-KR")}` : "",
    metrics.likes !== undefined ? `좋아요 ${metrics.likes.toLocaleString("ko-KR")}` : "",
    metrics.comments !== undefined ? `댓글 ${metrics.comments.toLocaleString("ko-KR")}` : "",
  ].filter(Boolean);
  return values.join(" · ") || undefined;
}
