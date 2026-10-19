import assert from "node:assert/strict";
import test from "node:test";
import { renderSceneSvg } from "../lib/render/card-svg";
import type { CanvasScene, ShapeElement, TextElement } from "../lib/editor/scene";

const scene: CanvasScene = {
  version: 1,
  width: 1080,
  height: 1350,
  elements: [
    { id: "back", type: "shape", x: 0, y: 0, width: 1080, height: 1350, rotation: 0, opacity: 1, locked: true, visible: true, shape: "rectangle", fill: "#ffeeaa", stroke: "#111111", strokeWidth: 4, cornerRadius: 20 },
    { id: "photo 1", type: "image", x: 100, y: 100, width: 400, height: 300, rotation: -3, opacity: 0.8, locked: false, visible: true, asset: { url: "data:image/png;base64,AAAA", source: "upload", sourcePage: "업로드", licenseStatus: "safe", usableForPublish: true, query: "학생" }, fit: "cover", cropScale: 1.5, cropOffsetX: 0.1, cropOffsetY: -0.2, cornerRadius: 24 },
    { id: "title", type: "text", x: 80, y: 500, width: 920, height: 260, rotation: 2, opacity: 0.65, locked: false, visible: true, content: "한국어 😀 <입시> & 체크\n둘째 줄", fontFamily: "Pretendard, Noto Sans KR, sans-serif", fontSize: 80, fontWeight: 800, lineHeight: 1.25, letterSpacing: -1, align: "center", color: "#101010", background: "transparent", padding: 10 },
  ],
};

test("장면 순서대로 도형·이미지·텍스트를 결정적으로 렌더링한다", () => {
  const first = renderSceneSvg(scene);
  const second = renderSceneSvg(scene);
  assert.equal(first, second);
  assert.ok(first.indexOf('data-element-id="back"') < first.indexOf('data-element-id="photo 1"'));
  assert.ok(first.indexOf('data-element-id="photo 1"') < first.indexOf('data-element-id="title"'));
  assert.match(first, /fill="#ffeeaa"/);
  assert.match(first, /stroke="#111111"/);
  assert.match(first, /opacity="0.65"/);
  assert.match(first, /rotate\(2 540 630\)/);
  assert.match(first, /text-anchor="middle"/);
  assert.match(first, /한국어 😀 &lt;입시&gt; &amp; 체크/);
  assert.match(first, /dy="100"/);
});

test("이미지는 안정적인 클립 ID와 비파괴 자르기 변환을 사용한다", () => {
  const svg = renderSceneSvg(scene);
  assert.match(svg, /clip-photo-1/);
  assert.match(svg, /clip-path="url\(#clip-photo-1\)"/);
  assert.match(svg, /preserveAspectRatio="xMidYMid slice"/);
  assert.match(svg, /width="600"/);
  assert.match(svg, /rx="24"/);
});

test("숨긴 요소는 출력하지 않고 타원 도형을 지원한다", () => {
  const ellipse = { ...(scene.elements[0] as ShapeElement), id: "circle", shape: "ellipse" as const, visible: true };
  const hidden = { ...(scene.elements[2] as TextElement), id: "hidden", visible: false };
  const svg = renderSceneSvg({ ...scene, elements: [ellipse, hidden] });
  assert.match(svg, /<ellipse/);
  assert.doesNotMatch(svg, /data-element-id="hidden"/);
});
