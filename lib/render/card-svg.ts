import { sceneForSlide } from "@/lib/editor/migrate";
import { validateScene, type CanvasElement, type CanvasScene, type ImageElement, type ShapeElement, type TextElement } from "@/lib/editor/scene";
import type { Slide, TemplateId } from "@/lib/types";

const esc = (text = "") => text.replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[character]!);
const cleanId = (id: string) => id.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "element";
const number = (value: number) => Number(value.toFixed(3)).toString();

function transform(element: CanvasElement) {
  if (!element.rotation) return "";
  return ` transform="rotate(${number(element.rotation)} ${number(element.x + element.width / 2)} ${number(element.y + element.height / 2)})"`;
}

function wrapText(element: TextElement) {
  const usableWidth = Math.max(1, element.width - element.padding * 2);
  const capacity = Math.max(1, Math.floor(usableWidth / (element.fontSize * 0.62)));
  const lines: string[] = [];
  for (const paragraph of element.content.split("\n")) {
    const characters = Array.from(paragraph);
    if (!characters.length) lines.push("");
    while (characters.length) lines.push(characters.splice(0, capacity).join(""));
  }
  return lines.slice(0, Math.max(1, Math.floor((element.height - element.padding * 2) / (element.fontSize * element.lineHeight))));
}

function renderText(element: TextElement) {
  const anchor = element.align === "center" ? "middle" : element.align === "right" ? "end" : "start";
  const x = element.align === "center" ? element.x + element.width / 2 : element.align === "right" ? element.x + element.width - element.padding : element.x + element.padding;
  const y = element.y + element.padding + element.fontSize;
  const lineHeight = element.fontSize * element.lineHeight;
  const background = element.background !== "transparent" ? `<rect x="${number(element.x)}" y="${number(element.y)}" width="${number(element.width)}" height="${number(element.height)}" rx="8" fill="${esc(element.background)}"/>` : "";
  const lines = wrapText(element).map((line, index) => `<tspan x="${number(x)}" dy="${index === 0 ? "0" : number(lineHeight)}">${esc(line)}</tspan>`).join("");
  return `<g data-element-id="${esc(element.id)}" opacity="${number(element.opacity)}"${transform(element)}>${background}<text x="${number(x)}" y="${number(y)}" text-anchor="${anchor}" font-family="${esc(element.fontFamily)}" font-size="${number(element.fontSize)}" font-weight="${number(element.fontWeight)}" letter-spacing="${number(element.letterSpacing)}" fill="${esc(element.color)}" aria-label="${esc(element.content)}">${lines}</text></g>`;
}

function renderShape(element: ShapeElement) {
  const style = `fill="${esc(element.fill)}" stroke="${esc(element.stroke)}" stroke-width="${number(element.strokeWidth)}"`;
  const shape = element.shape === "ellipse"
    ? `<ellipse cx="${number(element.x + element.width / 2)}" cy="${number(element.y + element.height / 2)}" rx="${number(element.width / 2)}" ry="${number(element.height / 2)}" ${style}/>`
    : `<rect x="${number(element.x)}" y="${number(element.y)}" width="${number(element.width)}" height="${number(element.height)}" rx="${number(element.cornerRadius)}" ${style}/>`;
  return `<g data-element-id="${esc(element.id)}" opacity="${number(element.opacity)}"${transform(element)}>${shape}</g>`;
}

function imageClip(element: ImageElement) {
  const id = `clip-${cleanId(element.id)}`;
  return `<clipPath id="${id}"><rect x="${number(element.x)}" y="${number(element.y)}" width="${number(element.width)}" height="${number(element.height)}" rx="${number(element.cornerRadius)}"/></clipPath>`;
}

function renderImage(element: ImageElement) {
  const id = `clip-${cleanId(element.id)}`;
  const width = element.width * element.cropScale;
  const height = element.height * element.cropScale;
  const x = element.x - (width - element.width) / 2 + element.cropOffsetX * element.width;
  const y = element.y - (height - element.height) / 2 + element.cropOffsetY * element.height;
  const aspect = element.fit === "cover" ? "xMidYMid slice" : "xMidYMid meet";
  return `<g data-element-id="${esc(element.id)}" opacity="${number(element.opacity)}"${transform(element)}><image href="${esc(element.asset.url)}" x="${number(x)}" y="${number(y)}" width="${number(width)}" height="${number(height)}" preserveAspectRatio="${aspect}" clip-path="url(#${id})"/></g>`;
}

export function renderSceneSvg(sceneValue: CanvasScene, options: { ariaLabel?: string } = {}) {
  const scene = validateScene(sceneValue);
  const visible = scene.elements.filter((element) => element.visible);
  const clips = visible.filter((element): element is ImageElement => element.type === "image").map(imageClip).join("");
  const body = visible.map((element) => element.type === "text" ? renderText(element) : element.type === "image" ? renderImage(element) : renderShape(element)).join("");
  const label = options.ariaLabel ? ` aria-label="${esc(options.ariaLabel)}"` : "";
  return `<svg width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" xmlns="http://www.w3.org/2000/svg" role="img"${label}><defs>${clips}</defs>${body}</svg>`;
}

export function renderCardSvg(slide: Slide, template: TemplateId, total: number) {
  return renderSceneSvg(sceneForSlide(slide, template), { ariaLabel: `${slide.index} / ${total} 카드` });
}
