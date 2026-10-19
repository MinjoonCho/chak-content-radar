import assert from "node:assert/strict";
import test from "node:test";
import { snapElement, stagePointFromClient } from "../lib/editor/geometry";
import type { ShapeElement } from "../lib/editor/scene";

const element: ShapeElement = { id: "box", type: "shape", x: 538, y: 74, width: 100, height: 100, rotation: 0, opacity: 1, locked: false, visible: true, shape: "rectangle", fill: "#fff", stroke: "none", strokeWidth: 0, cornerRadius: 0 };

test("요소 가장자리와 중앙을 4px 안에서 맞추고 안내선을 돌려준다", () => {
  const result = snapElement(element, [], 4);
  assert.equal(result.element.x, 540);
  assert.ok(result.guides.some((guide) => guide.axis === "x" && guide.position === 540));
});

test("확대 비율을 적용해 포인터 좌표를 캔버스 좌표로 변환한다", () => {
  assert.deepEqual(stagePointFromClient(370, 387.5, { left: 100, top: 50 }, 0.5), { x: 540, y: 675 });
});
