import { NextResponse } from "next/server";
import JSZip from "jszip";
import { renderSlidePng } from "@/lib/render/png";
import type { Slide, TemplateId } from "@/lib/types";
export async function POST(request: Request) {
  try {
    const { slides, template } = await request.json() as { slides: Slide[]; template: TemplateId };
    if (!Array.isArray(slides) || !slides.length || slides.length > 12) return NextResponse.json({ error: "1~12장의 카드만 내보낼 수 있습니다." }, { status: 400 });
    const zip = new JSZip();
    for (const [index, slide] of slides.entries()) { try { zip.file(`CHAK-${String(index + 1).padStart(2, "0")}.png`, await renderSlidePng({ ...slide, index: index + 1 }, template, slides.length)); } catch (error) { throw new Error(`${index + 1}번 카드 렌더링 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`); } }
    const output = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
    return new NextResponse(output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer, { headers: { "Content-Type": "application/zip", "Content-Disposition": "attachment; filename=CHAK-cards.zip" } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "ZIP 렌더링 실패" }, { status: 400 }); }
}
