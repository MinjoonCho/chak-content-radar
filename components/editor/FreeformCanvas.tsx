"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { resizeElement, updateElement } from "@/lib/editor/operations";
import { snapElement, type SnapGuide } from "@/lib/editor/geometry";
import { renderSceneSvg } from "@/lib/render/card-svg";
import type { CanvasElement, CanvasScene, TextElement } from "@/lib/editor/scene";
import type { EditorAction, ReviewClass } from "./useEditorController";

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
type Transaction = { kind: "move" | "resize" | "rotate"; startX: number; startY: number; origin: CanvasElement; handle?: Handle };
const handles: { name: Handle; x: number; y: number }[] = [{ name: "nw", x: 0, y: 0 }, { name: "n", x: .5, y: 0 }, { name: "ne", x: 1, y: 0 }, { name: "e", x: 1, y: .5 }, { name: "se", x: 1, y: 1 }, { name: "s", x: .5, y: 1 }, { name: "sw", x: 0, y: 1 }, { name: "w", x: 0, y: .5 }];

function resized(origin: CanvasElement, handle: Handle, dx: number, dy: number) {
  let { x, y, width, height } = origin;
  if (handle.includes("e")) width = Math.max(20, width + dx);
  if (handle.includes("s")) height = Math.max(20, height + dy);
  if (handle.includes("w")) { const next = Math.max(20, width - dx); x += width - next; width = next; }
  if (handle.includes("n")) { const next = Math.max(20, height - dy); y += height - next; height = next; }
  return { x, y, width, height };
}

export function FreeformCanvas({ scene, selectedId, editingTextId, zoom, pan, dispatch, onCommit }: { scene: CanvasScene; selectedId: string | null; editingTextId: string | null; zoom: number; pan: { x: number; y: number }; dispatch(action: EditorAction): void; onCommit(scene: CanvasScene, reviewClass: ReviewClass, selectedId?: string | null): void }) {
  const [draft, setDraft] = useState(scene);
  const draftRef = useRef(scene);
  const [guides, setGuides] = useState<SnapGuide[]>([]);
  const transaction = useRef<Transaction | null>(null);
  const panTransaction = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    draftRef.current = scene;
    setDraft(scene);
  }, [scene]);
  const selected = useMemo(() => draft.elements.find((element) => element.id === selectedId) ?? null, [draft, selectedId]);

  function begin(event: React.PointerEvent, element: CanvasElement, kind: Transaction["kind"], handle?: Handle) {
    if (element.locked) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    transaction.current = { kind, startX: event.clientX, startY: event.clientY, origin: element, handle };
    dispatch({ type: "select", id: element.id });
  }

  function move(event: React.PointerEvent) {
    const active = transaction.current;
    if (!active) return;
    const dx = (event.clientX - active.startX) / zoom;
    const dy = (event.clientY - active.startY) / zoom;
    let nextElement: CanvasElement = active.origin;
    if (active.kind === "move") {
      const positioned = { ...active.origin, x: active.origin.x + dx, y: active.origin.y + dy } as CanvasElement;
      const snapped = snapElement(positioned, draft.elements.filter((element) => element.id !== active.origin.id));
      nextElement = snapped.element;
      setGuides(snapped.guides);
    } else if (active.kind === "resize" && active.handle) nextElement = { ...active.origin, ...resized(active.origin, active.handle, dx, dy) } as CanvasElement;
    else if (active.kind === "rotate") {
      const cx = active.origin.x + active.origin.width / 2;
      const cy = active.origin.y + active.origin.height / 2;
      const stageX = (event.clientX - active.startX) / zoom + cx;
      const stageY = (event.clientY - active.startY) / zoom + active.origin.y - 70;
      nextElement = { ...active.origin, rotation: Math.round(Math.atan2(stageY - cy, stageX - cx) * 180 / Math.PI + 90) } as CanvasElement;
    }
    setDraft((current) => {
      const next = { ...current, elements: current.elements.map((element) => element.id === nextElement.id ? nextElement : element) };
      draftRef.current = next;
      return next;
    });
  }

  function finish() {
    const active = transaction.current;
    transaction.current = null;
    setGuides([]);
    const currentDraft = draftRef.current;
    if (!active || currentDraft === scene) return;
    onCommit(currentDraft, active.origin.type === "image" ? "images" : "copy", active.origin.id);
  }

  function keyDown(event: React.KeyboardEvent) {
    const modifier = event.metaKey || event.ctrlKey;
    if (modifier && event.key.toLowerCase() === "c") { event.preventDefault(); dispatch({ type: "copy" }); return; }
    if (modifier && event.key.toLowerCase() === "v") { event.preventDefault(); dispatch({ type: "paste" }); return; }
    if (modifier && event.key.toLowerCase() === "d") { event.preventDefault(); dispatch({ type: "duplicate" }); return; }
    if (["Backspace", "Delete"].includes(event.key)) { event.preventDefault(); dispatch({ type: "delete" }); return; }
    const amount = event.shiftKey ? 10 : 1;
    const delta = event.key === "ArrowLeft" ? [-amount, 0] : event.key === "ArrowRight" ? [amount, 0] : event.key === "ArrowUp" ? [0, -amount] : event.key === "ArrowDown" ? [0, amount] : null;
    if (delta) { event.preventDefault(); dispatch({ type: "nudge", dx: delta[0], dy: delta[1] }); }
  }

  const selectedTransform = selected?.rotation ? `rotate(${selected.rotation} ${selected.x + selected.width / 2} ${selected.y + selected.height / 2})` : undefined;
  return <div className="freeform-viewport" tabIndex={0} onKeyDown={keyDown} onPointerDown={(event) => { if (event.shiftKey) panTransaction.current = { x: event.clientX, y: event.clientY }; else dispatch({ type: "select", id: null }); }} onPointerMove={(event) => { if (panTransaction.current) { dispatch({ type: "pan", dx: event.clientX - panTransaction.current.x, dy: event.clientY - panTransaction.current.y }); panTransaction.current = { x: event.clientX, y: event.clientY }; } }} onPointerUp={() => { panTransaction.current = null; }}>
    <div className="freeform-spacer" style={{ width: 1080 * zoom, height: 1350 * zoom, transform: `translate(${pan.x}px, ${pan.y}px)` }}>
      <div className="freeform-artboard" style={{ transform: `scale(${zoom})` }}>
        <div className="scene-svg" dangerouslySetInnerHTML={{ __html: renderSceneSvg(draft) }} />
        <svg className="interaction-layer" width="1080" height="1350" viewBox="0 0 1080 1350" onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}>
          {draft.elements.filter((element) => element.visible && element.role !== "background").map((element) => <rect key={element.id} data-element-id={element.id} className="element-hit" x={element.x} y={element.y} width={element.width} height={element.height} transform={element.rotation ? `rotate(${element.rotation} ${element.x + element.width / 2} ${element.y + element.height / 2})` : undefined} onPointerDown={(event) => begin(event, element, "move")} onDoubleClick={() => element.type === "text" && dispatch({ type: "editText", id: element.id })} />)}
          {guides.map((guide, index) => guide.axis === "x" ? <line key={`${guide.axis}-${index}`} className="snap-guide" x1={guide.position} x2={guide.position} y1="0" y2="1350" /> : <line key={`${guide.axis}-${index}`} className="snap-guide" x1="0" x2="1080" y1={guide.position} y2={guide.position} />)}
          {selected && <g className="selection-box" transform={selectedTransform}><rect x={selected.x} y={selected.y} width={selected.width} height={selected.height} />{!selected.locked && <>{handles.map((handle) => <rect key={handle.name} className={`resize-handle handle-${handle.name}`} x={selected.x + selected.width * handle.x - 8} y={selected.y + selected.height * handle.y - 8} width="16" height="16" rx="3" onPointerDown={(event) => begin(event, selected, "resize", handle.name)} />)}<line x1={selected.x + selected.width / 2} x2={selected.x + selected.width / 2} y1={selected.y - 48} y2={selected.y} /><circle className="rotate-handle" cx={selected.x + selected.width / 2} cy={selected.y - 58} r="10" onPointerDown={(event) => begin(event, selected, "rotate")} /></>}</g>}
        </svg>
        {selected?.type === "text" && editingTextId === selected.id && <textarea className="canvas-text-editor" autoFocus value={selected.content} style={{ left: selected.x, top: selected.y, width: selected.width, height: selected.height, fontFamily: selected.fontFamily, fontSize: selected.fontSize, fontWeight: selected.fontWeight, lineHeight: selected.lineHeight, letterSpacing: selected.letterSpacing, color: selected.color, textAlign: selected.align, transform: `rotate(${selected.rotation}deg)` }} onChange={(event) => { const next = updateElement(draftRef.current, selected.id, { content: event.target.value } as Partial<TextElement>); draftRef.current = next; setDraft(next); }} onBlur={() => { onCommit(draftRef.current, "copy", selected.id); dispatch({ type: "editText", id: null }); }} />}
      </div>
    </div>
    <span className="pan-hint">Shift + 드래그로 화면 이동</span>
  </div>;
}
