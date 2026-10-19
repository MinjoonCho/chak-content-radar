import assert from "node:assert/strict";
import test from "node:test";
import { createSceneHistory } from "../lib/editor/history";
import type { CanvasScene } from "../lib/editor/scene";

const scene = (x: number): CanvasScene => ({ version: 1, width: 1080, height: 1350, elements: [{ id: "box", type: "shape", x, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, locked: false, visible: true, shape: "rectangle", fill: "#fff", stroke: "none", strokeWidth: 0, cornerRadius: 0 }] });

test("커밋 단위로 실행 취소와 다시 실행을 한다", () => {
  const history = createSceneHistory(scene(0));
  history.commit(scene(10));
  history.commit(scene(20));
  assert.equal(history.undo().elements[0].x, 10);
  assert.equal(history.undo().elements[0].x, 0);
  assert.equal(history.redo().elements[0].x, 10);
  assert.equal(history.canUndo, true);
  assert.equal(history.canRedo, true);
});

test("실행 취소 뒤 새 편집을 하면 다시 실행 기록을 비운다", () => {
  const history = createSceneHistory(scene(0));
  history.commit(scene(10));
  history.undo();
  history.commit(scene(30));
  assert.equal(history.canRedo, false);
  assert.equal(history.present.elements[0].x, 30);
});

test("기록은 지정한 개수를 넘기지 않는다", () => {
  const history = createSceneHistory(scene(0), 3);
  for (let index = 1; index <= 6; index += 1) history.commit(scene(index));
  assert.equal(history.undo().elements[0].x, 5);
  assert.equal(history.undo().elements[0].x, 4);
  assert.equal(history.undo().elements[0].x, 3);
  assert.equal(history.canUndo, false);
});
