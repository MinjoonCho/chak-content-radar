"use client";

import { Copy, Lock, Trash2, Unlock } from "lucide-react";
import type { CanvasElement } from "@/lib/editor/scene";
import { ImageInspector } from "./ImageInspector";
import { ShapeInspector } from "./ShapeInspector";
import { TextInspector } from "./TextInspector";

export function ElementInspector({ element, onChange, onDuplicate, onDelete, onUpload }: { element: CanvasElement | null; onChange(patch: Partial<CanvasElement>): void; onDuplicate(): void; onDelete(): void; onUpload(file: File): void }) {
  if (!element) return <section className="element-inspector empty"><div><b>요소를 선택하세요</b><p>캔버스나 레이어 목록에서 편집할 요소를 고르세요.</p></div></section>;
  return <section className="element-inspector"><div className="panel-title"><b>속성</b><span>{element.type === "text" ? "텍스트" : element.type === "image" ? "이미지" : "도형"}</span></div><div className="inspector-actions"><button onClick={() => onChange({ locked: !element.locked })}>{element.locked ? <Unlock size={15} /> : <Lock size={15} />}{element.locked ? "잠금 해제" : "잠금"}</button><button onClick={onDuplicate}><Copy size={15} />복제</button><button className="danger" onClick={onDelete}><Trash2 size={15} />삭제</button></div><div className="inspector-section"><h3>위치와 크기</h3><div className="property-grid">{(["x","y","width","height","rotation"] as const).map((key) => <label key={key}><span>{key === "width" ? "너비" : key === "height" ? "높이" : key === "rotation" ? "회전" : key.toUpperCase()}</span><input type="number" value={Math.round(element[key] * 100) / 100} onChange={(event) => onChange({ [key]: Number(event.target.value) })} /></label>)}<label><span>투명도</span><input type="number" min="0" max="1" step="0.05" value={element.opacity} onChange={(event) => onChange({ opacity: Number(event.target.value) })} /></label></div></div>{element.type === "text" ? <TextInspector element={element} onChange={onChange} /> : element.type === "image" ? <ImageInspector element={element} onChange={onChange} onUpload={onUpload} /> : <ShapeInspector element={element} onChange={onChange} />}</section>;
}
