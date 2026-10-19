"use client";

import { ChevronDown, ChevronUp, Eye, EyeOff, ImageIcon, Lock, Square, Type, Unlock } from "lucide-react";
import type { CanvasElement } from "@/lib/editor/scene";

const nameFor = (element: CanvasElement) => element.role === "headline" ? "헤드라인" : element.role === "subtext" ? "보조 문구" : element.role === "body" ? "본문" : element.role === "image" ? "이미지" : element.role === "background" ? "배경" : element.type === "text" ? element.content.slice(0, 18) || "텍스트" : element.type === "image" ? "이미지" : element.shape === "ellipse" ? "원" : "사각형";

export function LayerPanel({ elements, selectedId, onSelect, onChange, onReorder }: { elements: CanvasElement[]; selectedId: string | null; onSelect(id: string): void; onChange(id: string, patch: Partial<CanvasElement>): void; onReorder(id: string, index: number): void }) {
  return <section className="layer-panel"><div className="panel-title"><b>레이어</b><span>{elements.length}</span></div><div className="layer-list">
    {[...elements].reverse().map((element) => { const originalIndex = elements.findIndex((item) => item.id === element.id); return <div key={element.id} className={selectedId === element.id ? "layer-row selected" : "layer-row"}>
      <button className="layer-name" onClick={() => onSelect(element.id)}>{element.type === "text" ? <Type size={14} /> : element.type === "image" ? <ImageIcon size={14} /> : <Square size={14} />}<span>{nameFor(element)}</span></button>
      <button aria-label={element.visible ? "레이어 숨기기" : "레이어 보이기"} onClick={() => onChange(element.id, { visible: !element.visible })}>{element.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
      <button aria-label={element.locked ? "레이어 잠금 해제" : "레이어 잠금"} onClick={() => onChange(element.id, { locked: !element.locked })}>{element.locked ? <Lock size={14} /> : <Unlock size={14} />}</button>
      <span className="layer-order"><button aria-label="레이어 앞으로" disabled={originalIndex === elements.length - 1} onClick={() => onReorder(element.id, originalIndex + 1)}><ChevronUp size={13} /></button><button aria-label="레이어 뒤로" disabled={originalIndex === 0} onClick={() => onReorder(element.id, originalIndex - 1)}><ChevronDown size={13} /></button></span>
    </div>; })}
  </div></section>;
}
