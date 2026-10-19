import { NextResponse } from "next/server";
import { generatePost } from "@/lib/generation";
import { extractEvidence } from "@/lib/evidence/extract";
import { classifyOfficialUrl } from "@/lib/evidence/official";
import type { GenerateOptions } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as GenerateOptions;
    if (!body.topic?.trim()) return NextResponse.json({ error: "주제를 입력해주세요." }, { status: 400 });
    const sourceLinks = (body.sourceLinks || []).filter((link) => {
      try { return ["https:", "http:"].includes(new URL(link).protocol); } catch { return false; }
    });
    const extraction = await extractEvidence(sourceLinks);
    const officialSourceAvailable = sourceLinks.some((link) => classifyOfficialUrl(link).official);
    const result = await generatePost({ ...body, sourceLinks, officialSourceAvailable }, extraction.items);
    return NextResponse.json({ ...result, evidence: extraction.items, extractionFailures: extraction.failures });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
