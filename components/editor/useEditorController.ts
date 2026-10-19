"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSceneHistory } from "@/lib/editor/history";
import { addElement, deleteElement, duplicateElement, moveElement, reorderElement, updateElement } from "@/lib/editor/operations";
import type { CanvasElement, CanvasScene } from "@/lib/editor/scene";

export type ReviewClass = "copy" | "images";
export type EditorState = {
  scene: CanvasScene;
  selectedId: string | null;
  editingTextId: string | null;
  clipboard: CanvasElement | null;
  zoom: number;
  pan: { x: number; y: number };
};

export type EditorAction =
  | { type: "select"; id: string | null }
  | { type: "pan"; dx: number; dy: number }
  | { type: "zoom"; value: number }
  | { type: "nudge"; dx: number; dy: number }
  | { type: "copy" }
  | { type: "paste" }
  | { type: "duplicate" }
  | { type: "delete" }
  | { type: "editText"; id: string | null };

export function createEditorState(scene: CanvasScene): EditorState {
  return { scene, selectedId: null, editingTextId: null, clipboard: null, zoom: 0.5, pan: { x: 0, y: 0 } };
}

export function pointerDelta(dx: number, dy: number, zoom: number) {
  if (!Number.isFinite(zoom) || zoom <= 0) throw new Error("확대 비율은 0보다 커야 합니다.");
  return { x: dx / zoom, y: dy / zoom };
}

export function reviewClassForElement(element: CanvasElement): ReviewClass {
  return element.type === "image" ? "images" : "copy";
}

export function reconcileExternalScene(state: EditorState, incoming: CanvasScene): EditorState {
  if (JSON.stringify(state.scene) === JSON.stringify(incoming)) return { ...state, scene: incoming };
  return createEditorState(incoming);
}

export function applyEditorAction(state: EditorState, action: EditorAction): { state: EditorState; committed: boolean; reviewClass?: ReviewClass } {
  if (action.type === "select") return { state: { ...state, selectedId: action.id, editingTextId: action.id === state.editingTextId ? state.editingTextId : null }, committed: false };
  if (action.type === "pan") return { state: { ...state, pan: { x: state.pan.x + action.dx, y: state.pan.y + action.dy } }, committed: false };
  if (action.type === "zoom") return { state: { ...state, zoom: Math.min(1.25, Math.max(0.2, action.value)) }, committed: false };
  if (action.type === "editText") return { state: { ...state, selectedId: action.id ?? state.selectedId, editingTextId: action.id }, committed: false };
  const selected = state.scene.elements.find((element) => element.id === state.selectedId);
  if (action.type === "copy") return { state: { ...state, clipboard: selected ? structuredClone(selected) : state.clipboard }, committed: false };
  if (action.type === "paste") {
    if (!state.clipboard) return { state, committed: false };
    const source = state.scene.elements.find((element) => element.id === state.clipboard?.id);
    if (source) {
      const result = duplicateElement(state.scene, source.id);
      return { state: { ...state, scene: result.scene, selectedId: result.element?.id ?? state.selectedId }, committed: Boolean(result.element), reviewClass: result.element ? reviewClassForElement(result.element) : undefined };
    }
    const element = { ...state.clipboard, id: `${state.clipboard.id}-copy`, x: state.clipboard.x + 24, y: state.clipboard.y + 24 } as CanvasElement;
    const scene = addElement(state.scene, element);
    return { state: { ...state, scene, selectedId: element.id }, committed: true, reviewClass: reviewClassForElement(element) };
  }
  if (!selected || selected.locked) return { state, committed: false };
  if (action.type === "nudge") {
    const scene = moveElement(state.scene, selected.id, action.dx, action.dy);
    return { state: { ...state, scene }, committed: scene !== state.scene, reviewClass: reviewClassForElement(selected) };
  }
  if (action.type === "duplicate") {
    const result = duplicateElement(state.scene, selected.id);
    return { state: { ...state, scene: result.scene, selectedId: result.element?.id ?? state.selectedId }, committed: Boolean(result.element), reviewClass: reviewClassForElement(selected) };
  }
  if (action.type === "delete") {
    const scene = deleteElement(state.scene, selected.id);
    return { state: { ...state, scene, selectedId: scene === state.scene ? state.selectedId : null }, committed: scene !== state.scene, reviewClass: reviewClassForElement(selected) };
  }
  return { state, committed: false };
}

export function useEditorController(scene: CanvasScene, onCommit: (scene: CanvasScene, reviewClass: ReviewClass) => void) {
  const [state, setState] = useState(() => createEditorState(scene));
  const stateRef = useRef(state);
  const historyRef = useRef(createSceneHistory(scene));
  const sceneRef = useRef(scene);
  useEffect(() => {
    if (sceneRef.current === scene) return;
    const isEquivalentCommit = JSON.stringify(stateRef.current.scene) === JSON.stringify(scene);
    const next = reconcileExternalScene(stateRef.current, scene);
    sceneRef.current = scene;
    if (!isEquivalentCommit) historyRef.current = createSceneHistory(scene);
    stateRef.current = next;
    setState(next);
  }, [scene]);

  const publish = useCallback((next: EditorState, committed: boolean, reviewClass: ReviewClass = "copy") => {
    stateRef.current = next;
    setState(next);
    if (committed) {
      historyRef.current.commit(next.scene);
      sceneRef.current = next.scene;
      onCommit(next.scene, reviewClass);
    }
  }, [onCommit]);

  const dispatch = useCallback((action: EditorAction) => {
    const result = applyEditorAction(stateRef.current, action);
    publish(result.state, result.committed, result.reviewClass);
  }, [publish]);

  const commitScene = useCallback((nextScene: CanvasScene, reviewClass: ReviewClass = "copy", selectedId = stateRef.current.selectedId) => {
    publish({ ...stateRef.current, scene: nextScene, selectedId }, true, reviewClass);
  }, [publish]);

  const updateSelected = useCallback((patch: Partial<CanvasElement>) => {
    const selected = stateRef.current.scene.elements.find((element) => element.id === stateRef.current.selectedId);
    if (!selected) return;
    commitScene(updateElement(stateRef.current.scene, selected.id, patch), reviewClassForElement(selected));
  }, [commitScene]);

  const add = useCallback((element: CanvasElement) => commitScene(addElement(stateRef.current.scene, element), reviewClassForElement(element), element.id), [commitScene]);
  const reorder = useCallback((id: string, index: number) => commitScene(reorderElement(stateRef.current.scene, id, index), "copy", id), [commitScene]);
  const undo = useCallback(() => { const nextScene = historyRef.current.undo(); publish({ ...stateRef.current, scene: nextScene }, false); sceneRef.current = nextScene; onCommit(nextScene, "copy"); }, [onCommit, publish]);
  const redo = useCallback(() => { const nextScene = historyRef.current.redo(); publish({ ...stateRef.current, scene: nextScene }, false); sceneRef.current = nextScene; onCommit(nextScene, "copy"); }, [onCommit, publish]);
  const selectedElement = useMemo(() => state.scene.elements.find((element) => element.id === state.selectedId) ?? null, [state.scene, state.selectedId]);

  return { state, selectedElement, dispatch, commitScene, updateSelected, add, reorder, undo, redo, canUndo: historyRef.current.canUndo, canRedo: historyRef.current.canRedo };
}
