import assert from "node:assert/strict";
import test from "node:test";
import { addElement, deleteElement, duplicateElement, moveElement, reorderElement, resizeElement, updateElement } from "../lib/editor/operations";
import type { CanvasScene, ShapeElement, TextElement } from "../lib/editor/scene";

const text: TextElement = { id: "title", type: "text", role: "headline", x: 100, y: 100, width: 400, height: 160, rotation: 0, opacity: 1, locked: false, visible: true, content: "제목", fontFamily: "Pretendard, Noto Sans KR, sans-serif", fontSize: 80, fontWeight: 800, lineHeight: 1.1, letterSpacing: 0, align: "left", color: "#111111", background: "transparent", padding: 0 };
const shape: ShapeElement = { id: "box", type: "shape", x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, locked: false, visible: true, shape: "rectangle", fill: "#ffffff", stroke: "transparent", strokeWidth: 0, cornerRadius: 0 };
const scene: CanvasScene = { version: 1, width: 1080, height: 1350, elements: [shape, text] };

test("요소 추가·수정·복제·삭제는 원본 장면을 바꾸지 않는다", () => {
  const added = addElement(scene, { ...shape, id: "new" });
  const updated = updateElement(added, "new", { opacity: 0.4 });
  const duplicated = duplicateElement(updated, "title");
  const removed = deleteElement(duplicated.scene, "box");
  assert.equal(scene.elements.length, 2);
  assert.equal(updated.elements.find((element) => element.id === "new")?.opacity, 0.4);
  assert.equal(duplicated.element?.id, "title-copy");
  assert.deepEqual({ x: duplicated.element?.x, y: duplicated.element?.y }, { x: 124, y: 124 });
  assert.deepEqual(removed.elements.map((element) => element.id), ["title", "new", "title-copy"]);
});

test("레이어 순서를 바꾸고 중복 ID를 만들지 않는다", () => {
  const reordered = reorderElement(scene, "box", 1);
  assert.deepEqual(reordered.elements.map((element) => element.id), ["title", "box"]);
  assert.throws(() => addElement(scene, { ...shape, id: "title" }), /중복/);
});

test("잠긴 요소는 이동·크기 변경·삭제되지 않는다", () => {
  const locked = { ...scene, elements: scene.elements.map((element) => element.id === "title" ? { ...element, locked: true } : element) } as CanvasScene;
  assert.equal(moveElement(locked, "title", 20, 30), locked);
  assert.equal(resizeElement(locked, "title", { x: 0, y: 0, width: 1, height: 1 }), locked);
  assert.equal(deleteElement(locked, "title"), locked);
});

test("이미지 크기 변경은 비파괴 자르기 값을 보존한다", () => {
  const image = { id: "photo", type: "image" as const, x: 0, y: 0, width: 500, height: 400, rotation: 0, opacity: 1, locked: false, visible: true, asset: { url: "data:image/png;base64,AAAA", source: "upload" as const, sourcePage: "업로드", licenseStatus: "safe" as const, usableForPublish: true, query: "학생" }, fit: "cover" as const, cropScale: 2, cropOffsetX: 0.25, cropOffsetY: -0.1, cornerRadius: 20 };
  const withImage: CanvasScene = { ...scene, elements: [...scene.elements, image] };
  const resized = resizeElement(withImage, "photo", { x: 30, y: 40, width: 700, height: 300 });
  const result = resized.elements.find((element) => element.id === "photo");
  assert.ok(result?.type === "image");
  assert.deepEqual({ scale: result.cropScale, x: result.cropOffsetX, y: result.cropOffsetY }, { scale: 2, x: 0.25, y: -0.1 });
});
