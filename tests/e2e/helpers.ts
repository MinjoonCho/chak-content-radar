import { expect, type Page } from "@playwright/test";

export const generated = { id: "e2e-project", topic: "수험생 체크리스트", title: "수험생 체크리스트", contentType: "info", template: "A", createdAt: "2026-10-19T00:00:00Z", status: "draft", officialSourceAvailable: false, sourceLinks: [], imageSources: [], caption: "저장할 캡션", hashtags: { core: ["#수험생"], topic: [], viral: [] }, slides: [
  { index: 1, type: "cover", headline: "첫 카드", subtext: "보조 문구", body: "", imageQueryKo: "한국 고등학생", imageQueryEn: "Korean student", imageRequired: false, layoutVariant: "text_only" },
  { index: 2, type: "summary", headline: "마무리", body: "저장하세요", imageQueryKo: "학생", imageQueryEn: "student", imageRequired: false, layoutVariant: "text_only" },
] };

export async function openGeneratedEditor(page: Page) {
  await page.route("**/api/status", (route) => route.fulfill({ json: { geminiConnected: false } }));
  await page.route("**/api/generate", (route) => route.fulfill({ json: { post: generated, mode: "demo", evidence: [] } }));
  await page.goto("/generate");
  await page.getByLabel("주제").fill("수험생 체크리스트");
  await page.getByRole("button", { name: /카드뉴스 생성/ }).click();
  await expect(page.getByRole("toolbar", { name: "캔버스 도구" })).toBeVisible();
}
