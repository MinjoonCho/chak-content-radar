import { validateScene, type CanvasElement, type CanvasScene } from "./scene";

function indexOf(scene: CanvasScene, id: string) { return scene.elements.findIndex((element) => element.id === id); }
function nextCopyId(scene: CanvasScene, id: string) {
  let candidate = `${id}-copy`;
  let index = 2;
  while (scene.elements.some((element) => element.id === candidate)) candidate = `${id}-copy-${index++}`;
  return candidate;
}

export function addElement(scene: CanvasScene, element: CanvasElement) {
  if (scene.elements.some((candidate) => candidate.id === element.id)) throw new Error("요소 ID가 중복되었습니다.");
  return validateScene({ ...scene, elements: [...scene.elements, element] });
}

export function updateElement(scene: CanvasScene, id: string, patch: Partial<CanvasElement>) {
  const index = indexOf(scene, id);
  if (index < 0) return scene;
  const elements = scene.elements.map((element, current) => current === index ? { ...element, ...patch, id: element.id, type: element.type } as CanvasElement : element);
  return validateScene({ ...scene, elements });
}

export function duplicateElement(scene: CanvasScene, id: string): { scene: CanvasScene; element: CanvasElement | null } {
  const source = scene.elements.find((element) => element.id === id);
  if (!source) return { scene, element: null };
  const element = { ...source, id: nextCopyId(scene, source.id), x: source.x + 24, y: source.y + 24, locked: false } as CanvasElement;
  return { scene: addElement(scene, element), element };
}

export function deleteElement(scene: CanvasScene, id: string) {
  const source = scene.elements.find((element) => element.id === id);
  if (!source || source.locked) return scene;
  return { ...scene, elements: scene.elements.filter((element) => element.id !== id) };
}

export function reorderElement(scene: CanvasScene, id: string, targetIndex: number) {
  const current = indexOf(scene, id);
  if (current < 0) return scene;
  const elements = [...scene.elements];
  const [element] = elements.splice(current, 1);
  elements.splice(Math.max(0, Math.min(elements.length, targetIndex)), 0, element);
  return { ...scene, elements };
}

export function moveElement(scene: CanvasScene, id: string, deltaX: number, deltaY: number) {
  const element = scene.elements.find((candidate) => candidate.id === id);
  if (!element || element.locked) return scene;
  return updateElement(scene, id, { x: element.x + deltaX, y: element.y + deltaY });
}

export function resizeElement(scene: CanvasScene, id: string, bounds: Pick<CanvasElement, "x" | "y" | "width" | "height">) {
  const element = scene.elements.find((candidate) => candidate.id === id);
  if (!element || element.locked) return scene;
  return updateElement(scene, id, bounds);
}
