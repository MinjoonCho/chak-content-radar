import type { GeneratedPost, LayoutVariant, Slide } from "@/lib/types";

const allowed = new Set<LayoutVariant>(["photo_top", "photo_bottom", "photo_right", "text_only", "number_large"]);
const safe = (value: unknown, max: number) => Array.from(String(value ?? "").trim()).slice(0, max).join("");
export type NormalizeContext = { count: number; allowedEvidenceIds: readonly string[]; base: GeneratedPost };

export function normalizeGeneratedPost(raw: unknown, context: NormalizeContext): GeneratedPost {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const incoming = Array.isArray(value.slides) ? value.slides : [];
  const fallback = context.base.slides[0] ?? { index: 1, type: "content", headline: "내용 확인", imageQueryKo: "한국 고등학생", imageQueryEn: "Korean high school student", imageRequired: false, layoutVariant: "text_only" } satisfies Slide;
  const slides = Array.from({ length: context.count }, (_, index) => {
    const candidate = (incoming[index] && typeof incoming[index] === "object" ? incoming[index] : fallback) as Record<string, unknown>;
    const evidenceIds = Array.isArray(candidate.evidenceIds) ? candidate.evidenceIds.map(String) : [];
    const unknown = evidenceIds.find((id) => !context.allowedEvidenceIds.includes(id)); if (unknown) throw new Error(`알 수 없는 근거 ID: ${unknown}`);
    const layout = allowed.has(candidate.layoutVariant as LayoutVariant) ? candidate.layoutVariant as LayoutVariant : "text_only";
    return { ...fallback, index: index + 1, type: (["cover", "content", "summary", "source"].includes(String(candidate.type)) ? candidate.type : index === 0 ? "cover" : index === context.count - 1 ? "summary" : "content") as Slide["type"], headline: safe(candidate.headline || fallback.headline, 28), subtext: safe(candidate.subtext, 45), body: safe(candidate.body, 80), imageQueryKo: safe(candidate.imageQueryKo || fallback.imageQueryKo, 80), imageQueryEn: safe(candidate.imageQueryEn || fallback.imageQueryEn, 100), imageRequired: Boolean(candidate.imageRequired), layoutVariant: layout, evidenceIds };
  });
  const hashtags = value.hashtags && typeof value.hashtags === "object" ? value.hashtags as GeneratedPost["hashtags"] : context.base.hashtags;
  return { ...context.base, title: safe(value.title || context.base.title, 60), slides, caption: safe(value.caption || context.base.caption, 1800), hashtags };
}
