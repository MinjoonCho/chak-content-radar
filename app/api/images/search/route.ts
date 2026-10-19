import { NextResponse } from "next/server";
import type { ImageAsset } from "@/lib/types";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ error: "검색어가 필요합니다." }, { status: 400 });
  const key = process.env.PEXELS_API_KEY;
  if (!key) return NextResponse.json({ error: ".env.local에 PEXELS_API_KEY를 추가하면 후보 검색을 사용할 수 있어요." }, { status: 503 });
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=portrait`, { headers: { Authorization: key }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`Pexels 요청 실패 (${response.status})`);
    const payload = await response.json();
    const images: ImageAsset[] = (payload.photos || []).map((photo: { src: { large2x: string }; url: string }) => ({ url: photo.src.large2x, source: "pexels", sourcePage: photo.url, licenseStatus: "safe", usableForPublish: true, query }));
    if (!images.length) return NextResponse.json({ error: "검색 결과가 없습니다. 영어 검색어로 다시 시도해보세요." }, { status: 404 });
    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "이미지 검색 실패" }, { status: 502 });
  }
}
