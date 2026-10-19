import assert from "node:assert/strict";
import test from "node:test";
import { applyEditorAction, createEditorState, pointerDelta, reconcileExternalScene, reviewClassForElement } from "../components/editor/useEditorController";
import type { CanvasScene, TextElement } from "../lib/editor/scene";

const title: TextElement = { id: "title", type: "text", role: "headline", x: 100, y: 100, width: 400, height: 160, rotation: 0, opacity: 1, locked: false, visible: true, content: "제목", fontFamily: "Pretendard, Noto Sans KR, sans-serif", fontSize: 80, fontWeight: 800, lineHeight: 1.1, letterSpacing: 0, align: "left", color: "#111111", background: "transparent", padding: 0 };
const scene: CanvasScene = { version: 1, width: 1080, height: 1350, elements: [title] };

test("선택과 화면 이동은 장면 커밋 없이 편집 상태만 바꾼다", () => {
  const selected = applyEditorAction(createEditorState(scene), { type: "select", id: "title" });
  const panned = applyEditorAction(selected.state, { type: "pan", dx: 20, dy: -10 });
  assert.equal(panned.state.selectedId, "title");
  assert.deepEqual(panned.state.pan, { x: 20, y: -10 });
  assert.equal(panned.committed, false);
});

test("확대 비율에 맞춰 포인터 이동량을 장면 좌표로 바꾼다", () => {
  assert.deepEqual(pointerDelta(30, -15, 0.5), { x: 60, y: -30 });
});

test("키보드 이동은 일반 1px, Shift 입력은 10px을 커밋한다", () => {
  const initial = { ...createEditorState(scene), selectedId: "title" };
  const one = applyEditorAction(initial, { type: "nudge", dx: 1, dy: 0 });
  const ten = applyEditorAction(one.state, { type: "nudge", dx: 0, dy: 10 });
  assert.equal(ten.state.scene.elements[0].x, 101);
  assert.equal(ten.state.scene.elements[0].y, 110);
  assert.equal(ten.committed, true);
});

test("복사·붙여넣기·복제·삭제가 선택과 커밋 상태를 갱신한다", () => {
  const initial = { ...createEditorState(scene), selectedId: "title" };
  const copied = applyEditorAction(initial, { type: "copy" });
  const pasted = applyEditorAction(copied.state, { type: "paste" });
  assert.equal(pasted.state.scene.elements.length, 2);
  assert.equal(pasted.state.selectedId, "title-copy");
  const duplicated = applyEditorAction(pasted.state, { type: "duplicate" });
  assert.equal(duplicated.state.scene.elements.length, 3);
  const deleted = applyEditorAction(duplicated.state, { type: "delete" });
  assert.equal(deleted.state.scene.elements.length, 2);
  assert.equal(deleted.committed, true);
});

test("잠긴 요소는 키보드 이동과 삭제를 커밋하지 않는다", () => {
  const lockedScene = { ...scene, elements: [{ ...title, locked: true }] };
  const state = { ...createEditorState(lockedScene), selectedId: "title" };
  assert.equal(applyEditorAction(state, { type: "nudge", dx: 10, dy: 0 }).committed, false);
  assert.equal(applyEditorAction(state, { type: "delete" }).state.scene.elements.length, 1);
});

test("더블클릭 편집 대상과 검수 무효화 종류를 구분한다", () => {
  const editing = applyEditorAction(createEditorState(scene), { type: "editText", id: "title" });
  assert.equal(editing.state.editingTextId, "title");
  const finished = applyEditorAction(editing.state, { type: "editText", id: null });
  assert.equal(finished.state.editingTextId, null);
  assert.equal(finished.state.selectedId, "title");
  assert.equal(reviewClassForElement(title), "copy");
  assert.equal(reviewClassForElement({ ...title, type: "image" } as never), "images");
});

test("같은 커밋 장면이 부모에서 새 객체로 돌아와도 선택을 보존한다", () => {
  const state = { ...createEditorState(scene), selectedId: "title" };
  const reconciled = reconcileExternalScene(state, structuredClone(scene));
  assert.equal(reconciled.selectedId, "title");
  assert.notEqual(reconciled.scene, state.scene);
});
