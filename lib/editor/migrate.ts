import type { Slide, TemplateId } from "@/lib/types";
import { STAGE_HEIGHT, STAGE_WIDTH, validateScene, type CanvasElement, type CanvasScene, type ShapeElement, type TextElement } from "./scene";

const FONT = "Pretendard, Noto Sans KR, sans-serif";
const templateColors: Record<TemplateId, { background: string; ink: string; accent: string }> = {
  A: { background: "#fbf9f5", ink: "#1e1b18", accent: "#d93a1f" },
  B: { background: "#1e1b18", ink: "#fffdf8", accent: "#d93a1f" },
  C: { background: "#ffc21a", ink: "#1e1b18", accent: "#d93a1f" },
  D: { background: "#f2eee7", ink: "#1e1b18", accent: "#2f6bff" },
};

function common(id: string, role: CanvasElement["role"], x: number, y: number, width: number, height: number) {
  return { id, role, x, y, width, height, rotation: 0, opacity: 1, locked: false, visible: true };
}

function text(id: string, role: TextElement["role"], content: string, x: number, y: number, width: number, height: number, fontSize: number, color: string, weight = 700): TextElement {
  return { ...common(id, role, x, y, width, height), type: "text", content, fontFamily: FONT, fontSize, fontWeight: weight, lineHeight: 1.15, letterSpacing: -1, align: "left", color, background: "transparent", padding: 0 };
}

function shape(id: string, role: ShapeElement["role"], x: number, y: number, width: number, height: number, fill: string, locked = true): ShapeElement {
  return { ...common(id, role, x, y, width, height), type: "shape", shape: "rectangle", fill, stroke: "transparent", strokeWidth: 0, cornerRadius: 0, locked, visible: true };
}

export function sceneForSlide(slide: Slide, template: TemplateId): CanvasScene {
  if (slide.canvas) return validateScene(slide.canvas);
  const colors = templateColors[template];
  const prefix = `slide-${slide.index}`;
  const photoTop = slide.layoutVariant === "photo_top";
  const photoBottom = slide.layoutVariant === "photo_bottom";
  const photoRight = slide.layoutVariant === "photo_right";
  const titleY = photoTop ? 720 : photoBottom ? 300 : slide.layoutVariant === "number_large" ? 610 : 360;
  const titleWidth = photoRight ? 520 : 920;
  const elements: CanvasElement[] = [
    shape(`${prefix}-background`, "background", 0, 0, STAGE_WIDTH, STAGE_HEIGHT, colors.background),
    shape(`${prefix}-accent`, "decoration", 80, 132, 110, 8, colors.accent),
    text(`${prefix}-brand`, "brand", "CHAK", 80, 55, 260, 60, 30, colors.ink, 700),
  ];
  if (slide.image) {
    const box = photoRight ? { x: 650, y: 240, width: 430, height: 520 } : photoBottom ? { x: 0, y: 880, width: 1080, height: 470 } : { x: 0, y: 170, width: 1080, height: 410 };
    elements.push({ ...common(`${prefix}-image`, "image", box.x, box.y, box.width, box.height), type: "image", asset: slide.image, fit: "cover", cropScale: 1, cropOffsetX: 0, cropOffsetY: 0, cornerRadius: 0 });
  }
  if (template === "C") elements.push(text(`${prefix}-number`, "decoration", String(slide.index).padStart(2, "0"), 70, 190, 420, 210, 190, colors.accent, 800));
  if (template === "D") {
    elements.push(shape(`${prefix}-label-bg`, "decoration", 80, 190, 290, 58, colors.accent));
    elements.push(text(`${prefix}-label`, "meta", "WHAT CHANGED", 112, 202, 240, 42, 23, "#ffffff", 700));
    elements.push(text(`${prefix}-date`, "meta", `${slide.dateLabel || "날짜 확인 필요"} · ${slide.verificationStatus === "verified" ? slide.sourceLabel || "공식 출처 확인" : "검증 필요"}`, 80, 265, 850, 48, 22, colors.ink, 500));
  }
  elements.push(text(`${prefix}-headline`, "headline", slide.headline, 80, titleY, titleWidth, 310, template === "B" ? 110 : slide.type === "cover" ? 92 : 76, colors.ink, 800));
  if (slide.subtext) elements.push(text(`${prefix}-subtext`, "subtext", slide.subtext, 84, Math.min(titleY + 330, 1020), titleWidth, 120, 38, colors.ink, 500));
  if (slide.body) elements.push(text(`${prefix}-body`, "body", slide.body, 80, photoTop ? 1080 : photoBottom ? 650 : 900, photoRight ? 520 : 880, 220, 42, colors.ink, 500));
  elements.push(text(`${prefix}-footer`, "meta", `${slide.index}`, 80, 1240, 200, 50, 25, colors.ink, 500));
  return validateScene({ version: 1, width: STAGE_WIDTH, height: STAGE_HEIGHT, elements });
}

export function syncLegacyFields(slide: Slide, scene: CanvasScene): Slide {
  const valid = validateScene(scene);
  const content = (role: TextElement["role"]) => valid.elements.find((element): element is TextElement => element.type === "text" && element.role === role)?.content;
  const image = valid.elements.find((element) => element.type === "image" && element.role === "image");
  return {
    ...slide,
    headline: content("headline") ?? slide.headline,
    subtext: content("subtext") ?? slide.subtext,
    body: content("body") ?? slide.body,
    image: image?.type === "image" ? image.asset : slide.image,
    canvas: valid,
  };
}

export function reindexSlide(slide: Slide, index: number): Slide {
  if (!slide.canvas) return { ...slide, index };
  const elements = slide.canvas.elements.map((element) => {
    if (element.type !== "text") return element;
    if (element.id.endsWith("-footer")) return { ...element, content: String(index) };
    if (element.id.endsWith("-number")) return { ...element, content: String(index).padStart(2, "0") };
    return element;
  });
  return { ...slide, index, canvas: { ...slide.canvas, elements } };
}
