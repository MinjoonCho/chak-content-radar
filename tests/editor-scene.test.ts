import assert from "node:assert/strict";
import test from "node:test";
import { validateScene } from "../lib/editor/scene";

const textElement = {
  id: "headline",
  type: "text" as const,
  role: "headline" as const,
  x: 80,
  y: 200,
  width: 920,
  height: 260,
  rotation: 0,
  opacity: 1,
  locked: false,
  visible: true,
  content: "수능 이후 체크리스트",
  fontFamily: "Pretendard, Noto Sans KR, sans-serif",
  fontSize: 92,
  fontWeight: 800,
  lineHeight: 1.15,
  letterSpacing: 0,
  align: "left" as const,
  color: "#1e1b18",
  background: "transparent",
  padding: 0,
};

const scene = { version: 1 as const, width: 1080 as const, height: 1350 as const, elements: [textElement] };

test("유효한 장면을 읽고 넓은 재단 여백 안으로 좌표를 보정한다", () => {
  const result = validateScene({ ...scene, elements: [{ ...textElement, x: -5000, y: 5000 }] });
  assert.equal(result.elements[0].x, -1080);
  assert.equal(result.elements[0].y, 2700);
});

test("숫자가 아닌 좌표와 범위를 벗어난 서체 값을 거부한다", () => {
  assert.throws(() => validateScene({ ...scene, elements: [{ ...textElement, x: Number.NaN }] }), /좌표/);
  assert.throws(() => validateScene({ ...scene, elements: [{ ...textElement, rotation: Number.POSITIVE_INFINITY }] }), /좌표/);
  assert.throws(() => validateScene({ ...scene, elements: [{ ...textElement, fontSize: 241 }] }), /글자 크기/);
});

test("한 장에 100개가 넘는 요소를 거부한다", () => {
  const elements = Array.from({ length: 101 }, (_, index) => ({ ...textElement, id: `text-${index}` }));
  assert.throws(() => validateScene({ ...scene, elements }), /100개/);
});

test("이미지는 지원 형식과 8MB 제한 및 안전한 원격 주소를 지킨다", () => {
  const image = {
    id: "photo",
    type: "image" as const,
    role: "image" as const,
    x: 0,
    y: 0,
    width: 1080,
    height: 500,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    asset: { url: "data:image/png;base64,AAAA", source: "upload" as const, sourcePage: "팀 업로드", licenseStatus: "safe" as const, usableForPublish: true, query: "학생" },
    fit: "cover" as const,
    cropScale: 1,
    cropOffsetX: 0,
    cropOffsetY: 0,
    cornerRadius: 0,
  };
  assert.equal(validateScene({ ...scene, elements: [image] }).elements[0].type, "image");
  assert.throws(() => validateScene({ ...scene, elements: [{ ...image, asset: { ...image.asset, url: "data:image/gif;base64,AAAA" } }] }), /이미지 형식/);
  assert.throws(() => validateScene({ ...scene, elements: [{ ...image, asset: { ...image.asset, url: "https://example.com/photo.jpg" } }] }), /이미지 호스트/);
  const oversized = `data:image/png;base64,${"A".repeat(Math.ceil((8 * 1024 * 1024 + 1) / 0.75))}`;
  assert.throws(() => validateScene({ ...scene, elements: [{ ...image, asset: { ...image.asset, url: oversized } }] }), /8MB/);
});

test("자르기 배율과 투명도를 안전한 범위로 보정한다", () => {
  const result = validateScene({ ...scene, elements: [{ ...textElement, opacity: 4, padding: -10 }] });
  const element = result.elements[0];
  assert.equal(element.opacity, 1);
  assert.equal(element.type, "text");
  if (element.type === "text") assert.equal(element.padding, 0);
});
