import assert from "node:assert/strict";
import test from "node:test";
import { buildGenerationPrompt } from "../lib/generation/prompt";

test("프롬프트에 근거 ID·제목·본문과 인용 규칙을 포함한다", () => {
  const prompt = buildGenerationPrompt({ topic: "정시", contentType: "breaking", template: "A", slideCount: 4, imageMode: "auto" }, [{ id: "E1", url: "https://www.moe.go.kr/a", title: "공식 발표", text: "접수 일정", official: true }]);
  assert.match(prompt, /E1/); assert.match(prompt, /접수 일정/); assert.match(prompt, /제공된 근거/);
});
