import { NextResponse } from "next/server";
import { generatePost } from "@/lib/generation";
import { extractEvidence } from "@/lib/evidence/extract";
import type { GenerateOptions, Slide } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { options: GenerateOptions; index: number; current: Slide; sourceLinks?: string[] };
    if (!Number.isInteger(body.index) || body.index < 0) return NextResponse.json({ error: "올바른 카드 번호가 아닙니다." }, { status: 400 });
    const extraction = await extractEvidence(body.sourceLinks ?? []);
    const result = await generatePost({ ...body.options, slideCount: 4, sourceLinks: body.sourceLinks }, extraction.items);
    const slide = result.post.slides[Math.min(body.index, result.post.slides.length - 1)];
    return NextResponse.json({ slide: { ...slide, index: body.current.index, image: body.current.image }, mode: result.mode, evidence: extraction.items });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "카드 재생성 실패" }, { status: 500 }); }
}
