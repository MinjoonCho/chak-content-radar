import { NextResponse } from "next/server";
import { renderSlidePng } from "@/lib/render/png";
import type { Slide, TemplateId } from "@/lib/types";
export async function POST(request: Request) { try { const { slide, template, total } = await request.json() as { slide: Slide; template: TemplateId; total: number }; const png = await renderSlidePng(slide, template, total); return new NextResponse(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Content-Disposition": `attachment; filename=CHAK-${String(slide.index).padStart(2, "0")}.png` } }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "렌더링 실패" }, { status: 400 }); } }
