import sharp from "sharp";
import { renderSceneSvg } from "./card-svg";
import { normalizeRenderImage } from "./images";
import { sceneForSlide } from "@/lib/editor/migrate";
import type { CanvasElement } from "@/lib/editor/scene";
import type { Slide, TemplateId } from "@/lib/types";
export async function renderSlidePng(slide: Slide, template: TemplateId, total: number) {
  const scene = sceneForSlide(slide, template);
  const elements = await Promise.all(scene.elements.map(async (element): Promise<CanvasElement> => element.type === "image" ? { ...element, asset: { ...element.asset, url: await normalizeRenderImage(element.asset.url) } } : element));
  return sharp(Buffer.from(renderSceneSvg({ ...scene, elements }, { ariaLabel: `${slide.index} / ${total} 카드` }))).png({ quality: 96 }).toBuffer();
}
