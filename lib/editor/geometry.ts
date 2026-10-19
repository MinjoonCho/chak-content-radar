import { STAGE_HEIGHT, STAGE_WIDTH, type CanvasElement } from "./scene";

export type SnapGuide = { axis: "x" | "y"; position: number };

function anchors(element: CanvasElement, axis: "x" | "y") {
  const start = axis === "x" ? element.x : element.y;
  const size = axis === "x" ? element.width : element.height;
  return [start, start + size / 2, start + size];
}

export function snapElement<T extends CanvasElement>(element: T, others: CanvasElement[], threshold = 4): { element: T; guides: SnapGuide[] } {
  const guides: SnapGuide[] = [];
  let x = element.x;
  let y = element.y;
  for (const axis of ["x", "y"] as const) {
    const size = axis === "x" ? element.width : element.height;
    const candidates = axis === "x" ? [0, STAGE_WIDTH / 2, STAGE_WIDTH] : [0, STAGE_HEIGHT / 2, STAGE_HEIGHT];
    for (const other of others.filter((item) => item.id !== element.id && item.visible)) candidates.push(...anchors(other, axis));
    const positions = axis === "x" ? [x, x + size / 2, x + size] : [y, y + size / 2, y + size];
    let best: { delta: number; target: number } | null = null;
    for (const position of positions) for (const target of candidates) {
      const delta = target - position;
      if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, target };
    }
    if (best) {
      if (axis === "x") x += best.delta; else y += best.delta;
      guides.push({ axis, position: best.target });
    }
  }
  return { element: { ...element, x, y }, guides };
}

export function stagePointFromClient(clientX: number, clientY: number, origin: { left: number; top: number }, zoom: number) {
  if (!Number.isFinite(zoom) || zoom <= 0) throw new Error("확대 비율은 0보다 커야 합니다.");
  return { x: (clientX - origin.left) / zoom, y: (clientY - origin.top) / zoom };
}
