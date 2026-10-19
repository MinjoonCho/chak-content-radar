import type { ImageAsset } from "@/lib/types";

export const STAGE_WIDTH = 1080 as const;
export const STAGE_HEIGHT = 1350 as const;
export const MAX_SCENE_ELEMENTS = 100;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export type ElementRole = "background" | "brand" | "headline" | "subtext" | "body" | "image" | "meta" | "decoration";
export type CanvasElementBase = {
  id: string;
  type: "text" | "image" | "shape";
  role?: ElementRole;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
};

export type TextElement = CanvasElementBase & {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  align: "left" | "center" | "right";
  color: string;
  background: string;
  padding: number;
};

export type ImageElement = CanvasElementBase & {
  type: "image";
  asset: ImageAsset;
  fit: "cover" | "contain";
  cropScale: number;
  cropOffsetX: number;
  cropOffsetY: number;
  cornerRadius: number;
};

export type ShapeElement = CanvasElementBase & {
  type: "shape";
  shape: "rectangle" | "ellipse";
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
};

export type CanvasElement = TextElement | ImageElement | ShapeElement;
export type CanvasScene = { version: 1; width: 1080; height: 1350; elements: CanvasElement[] };

const SAFE_IMAGE_HOSTS = new Set(["images.pexels.com", "images.unsplash.com", "cdn.pixabay.com", "upload.wikimedia.org"]);
const SAFE_FONTS = new Set([
  "Pretendard, Noto Sans KR, sans-serif",
  "Noto Sans KR, Pretendard, sans-serif",
  "Nanum Gothic, Noto Sans KR, sans-serif",
  "Georgia, Noto Serif KR, serif",
]);

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} 구조가 올바르지 않습니다.`);
  return value as Record<string, unknown>;
}

function finite(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} 좌표는 유한한 숫자여야 합니다.`);
  return value;
}

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function string(value: unknown, label: string) { if (typeof value !== "string") throw new Error(`${label} 값이 올바르지 않습니다.`); return value; }
function boolean(value: unknown, label: string) { if (typeof value !== "boolean") throw new Error(`${label} 값이 올바르지 않습니다.`); return value; }

function validateImageUrl(url: string) {
  if (url.startsWith("data:")) {
    const match = /^data:image\/(png|jpeg|webp);base64,/i.exec(url);
    if (!match) throw new Error("지원하지 않는 이미지 형식입니다.");
    const payload = url.slice(match[0].length);
    const bytes = Math.ceil(payload.length * 0.75);
    if (bytes > MAX_IMAGE_BYTES) throw new Error("이미지는 8MB 이하여야 합니다.");
    return;
  }
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error("이미지 주소가 올바르지 않습니다."); }
  if (parsed.protocol !== "https:" || !SAFE_IMAGE_HOSTS.has(parsed.hostname)) throw new Error("허용되지 않은 이미지 호스트입니다.");
}

function validateAsset(value: unknown): ImageAsset {
  const asset = record(value, "이미지");
  const url = string(asset.url, "이미지 주소");
  validateImageUrl(url);
  const source = string(asset.source, "이미지 출처") as ImageAsset["source"];
  if (!["upload", "pexels", "unsplash", "pixabay", "wikimedia", "naver", "placeholder"].includes(source)) throw new Error("이미지 출처가 올바르지 않습니다.");
  const licenseStatus = string(asset.licenseStatus, "라이선스") as ImageAsset["licenseStatus"];
  if (!["safe", "unknown", "restricted"].includes(licenseStatus)) throw new Error("라이선스 값이 올바르지 않습니다.");
  return { url, source, sourcePage: string(asset.sourcePage, "출처 페이지"), licenseStatus, usableForPublish: boolean(asset.usableForPublish, "게시 가능 여부"), query: string(asset.query, "검색어") };
}

function baseElement(value: Record<string, unknown>) {
  const id = string(value.id, "요소 ID").trim();
  if (!id) throw new Error("요소 ID가 비어 있습니다.");
  const role = value.role === undefined ? undefined : string(value.role, "요소 역할") as ElementRole;
  return {
    id,
    role,
    x: clamp(finite(value.x, "요소"), -STAGE_WIDTH, STAGE_WIDTH * 2),
    y: clamp(finite(value.y, "요소"), -STAGE_HEIGHT, STAGE_HEIGHT * 2),
    width: clamp(finite(value.width, "요소"), 1, STAGE_WIDTH * 3),
    height: clamp(finite(value.height, "요소"), 1, STAGE_HEIGHT * 3),
    rotation: clamp(finite(value.rotation, "요소"), -360, 360),
    opacity: clamp(finite(value.opacity, "요소"), 0, 1),
    locked: boolean(value.locked, "잠금"),
    visible: boolean(value.visible, "표시"),
  };
}

function validateElement(value: unknown): CanvasElement {
  const item = record(value, "요소");
  const type = string(item.type, "요소 종류");
  const base = baseElement(item);
  if (type === "text") {
    const fontSize = finite(item.fontSize, "글자 크기");
    if (fontSize < 8 || fontSize > 240) throw new Error("글자 크기는 8–240 사이여야 합니다.");
    const fontFamily = string(item.fontFamily, "글꼴");
    if (!SAFE_FONTS.has(fontFamily)) throw new Error("지원하지 않는 글꼴입니다.");
    const align = string(item.align, "정렬") as TextElement["align"];
    if (!["left", "center", "right"].includes(align)) throw new Error("텍스트 정렬이 올바르지 않습니다.");
    return { ...base, type, content: string(item.content, "텍스트"), fontFamily, fontSize, fontWeight: clamp(finite(item.fontWeight, "글자 굵기"), 100, 900), lineHeight: clamp(finite(item.lineHeight, "줄 높이"), 0.8, 3), letterSpacing: clamp(finite(item.letterSpacing, "자간"), -20, 100), align, color: string(item.color, "글자색"), background: string(item.background, "배경색"), padding: clamp(finite(item.padding, "안쪽 여백"), 0, 200) };
  }
  if (type === "image") {
    const fit = string(item.fit, "이미지 맞춤") as ImageElement["fit"];
    if (!["cover", "contain"].includes(fit)) throw new Error("이미지 맞춤 값이 올바르지 않습니다.");
    return { ...base, type, asset: validateAsset(item.asset), fit, cropScale: clamp(finite(item.cropScale, "자르기 배율"), 0.1, 10), cropOffsetX: clamp(finite(item.cropOffsetX, "자르기 위치"), -2, 2), cropOffsetY: clamp(finite(item.cropOffsetY, "자르기 위치"), -2, 2), cornerRadius: clamp(finite(item.cornerRadius, "모서리"), 0, 540) };
  }
  if (type === "shape") {
    const shape = string(item.shape, "도형 종류") as ShapeElement["shape"];
    if (!["rectangle", "ellipse"].includes(shape)) throw new Error("도형 종류가 올바르지 않습니다.");
    return { ...base, type, shape, fill: string(item.fill, "채우기"), stroke: string(item.stroke, "테두리"), strokeWidth: clamp(finite(item.strokeWidth, "테두리 굵기"), 0, 100), cornerRadius: clamp(finite(item.cornerRadius, "모서리"), 0, 540) };
  }
  throw new Error("지원하지 않는 요소 종류입니다.");
}

export function validateScene(value: unknown): CanvasScene {
  const scene = record(value, "장면");
  if (scene.version !== 1 || scene.width !== STAGE_WIDTH || scene.height !== STAGE_HEIGHT || !Array.isArray(scene.elements)) throw new Error("지원하지 않는 장면 구조입니다.");
  if (scene.elements.length > MAX_SCENE_ELEMENTS) throw new Error("한 카드에는 요소를 100개까지 둘 수 있습니다.");
  const elements = scene.elements.map(validateElement);
  if (new Set(elements.map((element) => element.id)).size !== elements.length) throw new Error("요소 ID가 중복되었습니다.");
  return { version: 1, width: STAGE_WIDTH, height: STAGE_HEIGHT, elements };
}
