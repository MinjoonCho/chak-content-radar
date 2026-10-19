import assert from "node:assert/strict";
import test from "node:test";
import { renderCardSvg } from "../lib/render/card-svg";
import type { Slide } from "../lib/types";
const slide: Slide = { index: 1, type: "cover", headline: "<script>alert(1)</script>", body: "A & B", imageQueryKo: "학생", imageQueryEn: "student", imageRequired: false, layoutVariant: "text_only" };
test("같은 입력은 같은 SVG를 만들고 텍스트를 이스케이프한다", () => {
  const a = renderCardSvg(slide, "A", 4); const b = renderCardSvg(slide, "A", 4);
  assert.equal(a, b); assert.doesNotMatch(a, /<script>/); assert.match(a, /&lt;script&gt;/); assert.match(a, /A &amp; B/);
});

test("저장된 자유 편집 장면을 기존 템플릿보다 우선한다", () => {
  const canvas = { version: 1 as const, width: 1080 as const, height: 1350 as const, elements: [{ id: "custom", type: "text" as const, x: 10, y: 20, width: 500, height: 100, rotation: 0, opacity: 1, locked: false, visible: true, content: "직접 배치한 문구", fontFamily: "Pretendard, Noto Sans KR, sans-serif", fontSize: 50, fontWeight: 700, lineHeight: 1.2, letterSpacing: 0, align: "left" as const, color: "#000000", background: "transparent", padding: 0 }] };
  const svg = renderCardSvg({ ...slide, canvas }, "D", 4);
  assert.match(svg, /직접 배치한 문구/);
  assert.doesNotMatch(svg, /WHAT CHANGED/);
});
