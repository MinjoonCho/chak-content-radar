import type { GenerateOptions } from "@/lib/types";
import type { ExtractedEvidence } from "@/lib/evidence/extract";

export function buildGenerationPrompt(options: GenerateOptions, evidence: ExtractedEvidence[]) {
  const count = options.slideCount === "auto" ? 6 : options.slideCount;
  const records = evidence.length ? evidence.map((item) => `[${item.id}] ${item.title}\nURL: ${item.url}\n${item.text}`).join("\n\n") : "제공된 근거 없음";
  return `당신은 CHAK 수험생 콘텐츠 에디터다. 주제 "${options.topic}"를 ${options.contentType} 카드뉴스 정확히 ${count}장으로 작성하라.
한국 고등학생 맥락을 우선하고 사실을 추측하지 말라. 사실·수치·일정은 아래 제공된 근거에서만 사용하고 각 슬라이드 evidenceIds에 사용한 근거 ID를 기록하라. 근거가 없으면 확인이 필요한 일반 조언으로만 작성하라.
headline 28자, subtext 45자, body 80자를 넘기지 말라. 이미지 검색어는 미국식 학교, 서양 교복, 스쿨버스, prom, locker, graduation cap을 피한다.

제공된 근거:
${records}`;
}
