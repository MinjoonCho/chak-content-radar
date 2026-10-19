import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { classifyOfficialUrl } from "./official";

export type ExtractedEvidence = { id: string; url: string; title: string; text: string; official: boolean };
export type EvidenceExtraction = { items: ExtractedEvidence[]; failures: { url: string; reason: string }[] };
export type EvidenceFetcher = (url: string, init?: RequestInit) => Promise<Response>;
const MAX_BYTES = 1_000_000;

function privateIp(address: string) {
  if (address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return true;
  const parts = address.split(".").map(Number);
  return isIP(address) === 4 && (parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168));
}

export function isSafeEvidenceUrl(value: string) {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && url.hostname !== "localhost" && !(isIP(url.hostname) && privateIp(url.hostname)); } catch { return false; }
}

async function assertPublicHost(url: URL) {
  if (isIP(url.hostname)) { if (privateIp(url.hostname)) throw new Error("사설망 주소는 사용할 수 없습니다."); return; }
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((entry) => privateIp(entry.address))) throw new Error("사설망으로 연결되는 주소는 사용할 수 없습니다.");
}

function cleanHtml(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

export async function extractEvidence(urls: string[], fetcher: EvidenceFetcher = fetch): Promise<EvidenceExtraction> {
  const items: ExtractedEvidence[] = []; const failures: EvidenceExtraction["failures"] = [];
  for (const [index, value] of [...new Set(urls)].slice(0, 12).entries()) {
    try {
      if (!isSafeEvidenceUrl(value)) throw new Error("허용되지 않는 URL입니다.");
      const url = new URL(value);
      if (fetcher === fetch) await assertPublicHost(url);
      const response = await fetcher(value, { redirect: "error", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "CHAK-Evidence/1.0" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const declared = Number(response.headers.get("content-length") || 0); if (declared > MAX_BYTES) throw new Error("응답 크기 제한을 넘었습니다.");
      const buffer = await response.arrayBuffer(); if (buffer.byteLength > MAX_BYTES) throw new Error("응답 크기 제한을 넘었습니다.");
      const html = new TextDecoder().decode(buffer); const title = cleanHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? url.hostname).slice(0, 160);
      const text = cleanHtml(html).slice(0, 6000); if (!text) throw new Error("본문을 찾지 못했습니다.");
      items.push({ id: `E${index + 1}`, url: value, title, text, official: classifyOfficialUrl(value).official });
    } catch (error) { failures.push({ url: value, reason: error instanceof Error ? error.message : "추출 실패" }); }
  }
  return { items, failures };
}
