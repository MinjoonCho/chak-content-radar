import assert from "node:assert/strict";
import test from "node:test";
import { extractEvidence, isSafeEvidenceUrl } from "../lib/evidence/extract";

test("사설망·로컬 주소를 거부한다", () => {
  for (const url of ["http://127.0.0.1/a", "http://localhost/a", "http://10.0.0.2/a", "http://192.168.1.2/a", "ftp://example.com/a"]) assert.equal(isSafeEvidenceUrl(url), false);
  assert.equal(isSafeEvidenceUrl("https://www.moe.go.kr/a"), true);
});
test("일부 추출 실패가 있어도 성공한 원문을 반환한다", async () => {
  const fetcher = async (input: string) => input.includes("bad") ? new Response("x", { status: 500 }) : new Response("<html><title>제목</title><body><article>핵심 일정 안내입니다.</article></body></html>", { headers: { "content-type": "text/html" } });
  const result = await extractEvidence(["https://example.com/good", "https://example.com/bad"], fetcher);
  assert.equal(result.items.length, 1); assert.equal(result.failures.length, 1); assert.match(result.items[0].text, /핵심 일정/);
});
test("응답 본문 크기를 제한한다", async () => {
  const fetcher = async () => new Response("x".repeat(1_100_000), { headers: { "content-type": "text/html", "content-length": "1100000" } });
  const result = await extractEvidence(["https://example.com/large"], fetcher);
  assert.equal(result.items.length, 0); assert.match(result.failures[0].reason, /크기/);
});
