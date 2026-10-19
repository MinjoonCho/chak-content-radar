import type { GenerateOptions, GeneratedPost, LayoutVariant, Slide, TemplateId } from "./types";
import type { ExtractedEvidence } from "./evidence/extract";
import { buildGenerationPrompt } from "./generation/prompt";
import { normalizeGeneratedPost } from "./generation/normalize";
import { generatedPostSchema } from "./generation/schema";

const safe = (value: string, max: number) => Array.from(value.trim()).slice(0, max).join("");
const variants: Record<TemplateId, LayoutVariant[]> = {
  A: ["photo_top", "photo_right", "photo_bottom", "text_only"],
  B: ["photo_top", "photo_bottom", "text_only"],
  C: ["number_large", "photo_right", "number_large", "text_only"],
  D: ["text_only", "photo_right", "text_only", "photo_bottom"],
};

const topicIdeas = [
  ["운전면허, 지금 시작할까?", "방학 성수기 전에 등록하면 일정 잡기가 한결 쉬워요."],
  ["미뤄둔 헤어 변신", "시험 규정 때문에 참았던 스타일을 사진과 함께 기록해보세요."],
  ["친구들과 짧은 여행", "멀리 가지 않아도 좋아요. 함께 쉬는 하루를 먼저 잡아보세요."],
  ["생활 리듬 천천히 되찾기", "갑자기 계획을 꽉 채우기보다 수면과 식사부터 회복해요."],
  ["입시 일정은 한 번 더", "해방감은 충분히 즐기되 남은 전형 일정은 캘린더에 저장해요."],
  ["나만의 다음 챕터", "하고 싶었던 일 세 가지를 적고 가장 작은 것부터 시작해보세요."],
];

function fallbackPost(options: GenerateOptions): GeneratedPost {
  const count = options.slideCount === "auto" ? 6 : options.slideCount;
  const bodySlides = Math.max(2, count - 2);
  const topic = safe(options.topic || "수능 끝나고 바로 할 것 5가지", 60);
  const verificationStatus = options.officialSourceAvailable ? "verified" as const : "needs_review" as const;
  const sourceLabel = options.sourceLinks?.[0] ? new URL(options.sourceLinks[0]).hostname : "출처 검수 중";
  const dateLabel = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const slides: Slide[] = [
    {
      index: 1, type: "cover", headline: safe(topic, 28), subtext: "지금 저장해두면 바로 써먹는 체크리스트", body: "",
      imageQueryKo: `한국 고등학생 ${topic}`, imageQueryEn: `Korean high school students ${topic}`,
      imageRequired: options.imageMode !== "minimal", layoutVariant: variants[options.template][0], dateLabel, sourceLabel, verificationStatus,
    },
    ...Array.from({ length: bodySlides }, (_, index) => {
      const idea = topicIdeas[index % topicIdeas.length];
      return {
        index: index + 2, type: "content" as const, headline: safe(`${index + 1}. ${idea[0]}`, 28), body: safe(idea[1], 80),
        imageQueryKo: `한국 ${idea[0].replace(/[?,]/g, "")} 고등학생`, imageQueryEn: `Korean student ${idea[0].replace(/[?,]/g, "")}`,
        imageRequired: options.imageMode === "photo" || index % 2 === 0,
        layoutVariant: variants[options.template][(index + 1) % variants[options.template].length], dateLabel, sourceLabel, verificationStatus,
      };
    }),
    {
      index: count, type: "summary", headline: "오늘부터 하나씩", subtext: "친구에게 공유하고 같이 시작해요", body: "저장해두고 필요한 순간 다시 확인하세요.",
      imageQueryKo: "한국 고등학생 친구들 서울 거리", imageQueryEn: "Korean high school friends Seoul street",
      imageRequired: false, layoutVariant: "text_only", dateLabel, sourceLabel, verificationStatus,
    },
  ];

  const highRisk = options.contentType === "breaking" || /입시|정시|논술|규정|일정|준비물|합격/.test(topic);
  const verified = Boolean(options.officialSourceAvailable);
  return {
    id: `post-${Date.now()}`,
    topic,
    title: topic,
    contentType: options.contentType,
    template: options.template,
    createdAt: new Date().toISOString(),
    slides,
    caption: `${topic} 👀\n\n시험이 끝난 뒤, 무엇부터 할지 막막하다면 이 리스트부터 저장해두세요. 친구와 함께하고 싶은 항목은 공유해도 좋아요.`,
    hashtags: { core: ["#수능", "#수험생"], topic: ["#수능끝", "#고3일상"], viral: ["#수험생꿀팁", "#저장각"] },
    sourceLinks: options.sourceLinks ?? [],
    imageSources: [],
    status: highRisk && !verified ? "needs_review" : "draft",
    officialSourceAvailable: verified,
  };
}

export async function generatePost(options: GenerateOptions, evidence: ExtractedEvidence[] = []): Promise<{ post: GeneratedPost; mode: "gemini" | "demo" }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { post: fallbackPost(options), mode: "demo" };
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const base = fallbackPost(options);
  const prompt = buildGenerationPrompt(options, evidence);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseJsonSchema: generatedPostSchema, temperature: 0.45 } }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Gemini 요청 실패 (${response.status})`);
  const payload = await response.json();
  const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Gemini 응답에 콘텐츠가 없습니다.");
  const parsed = JSON.parse(raw);
  return { post: normalizeGeneratedPost(parsed, { count: base.slides.length, allowedEvidenceIds: evidence.map((item) => item.id), base }), mode: "gemini" };
}
