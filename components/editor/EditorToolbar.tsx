"use client";

import { Circle, ImagePlus, MousePointer2, Redo2, Square, Type, Undo2, ZoomIn, ZoomOut } from "lucide-react";

export function EditorToolbar({ zoom, canUndo, canRedo, onAddText, onAddImage, onAddShape, onUndo, onRedo, onZoom }: { zoom: number; canUndo: boolean; canRedo: boolean; onAddText(): void; onAddImage(file: File): void; onAddShape(shape: "rectangle" | "ellipse"): void; onUndo(): void; onRedo(): void; onZoom(value: number): void }) {
  return <div className="editor-toolbar" role="toolbar" aria-label="캔버스 도구">
    <button className="active" aria-label="선택 도구"><MousePointer2 size={17} /><span>선택</span></button>
    <button onClick={onAddText}><Type size={17} /><span>텍스트</span></button>
    <label className="toolbar-file"><ImagePlus size={17} /><span>이미지</span><input aria-label="이미지 업로드" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) onAddImage(file); event.currentTarget.value = ""; }} /></label>
    <button onClick={() => onAddShape("rectangle")}><Square size={17} /><span>사각형</span></button>
    <button onClick={() => onAddShape("ellipse")}><Circle size={17} /><span>원</span></button>
    <i />
    <button aria-label="실행 취소" disabled={!canUndo} onClick={onUndo}><Undo2 size={17} /></button>
    <button aria-label="다시 실행" disabled={!canRedo} onClick={onRedo}><Redo2 size={17} /></button>
    <div className="zoom-control"><button aria-label="축소" onClick={() => onZoom(zoom - 0.1)}><ZoomOut size={16} /></button><span>{Math.round(zoom * 100)}%</span><button aria-label="확대" onClick={() => onZoom(zoom + 0.1)}><ZoomIn size={16} /></button></div>
  </div>;
}
