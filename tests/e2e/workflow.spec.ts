import { expect, test } from "@playwright/test";
import { openGeneratedEditor } from "./helpers";

test("생성 → 자유 편집 → 자동저장 → Archive 정확한 재개 → 프로젝트 내보내기", async ({ page }) => {
  await openGeneratedEditor(page);
  await page.getByRole("tab", { name: "레이어", exact: true }).click();
  await page.getByRole("button", { name: "헤드라인", exact: true }).click();
  await page.getByLabel("내용").fill("편집된 첫 카드");
  await page.getByLabel("X", { exact: true }).fill("222");
  await expect(page.getByText("자동 저장됨")).toBeVisible({ timeout: 5000 });
  await page.goto("/archive");
  await expect(page.getByRole("heading", { name: "수험생 체크리스트" })).toBeVisible();
  await page.getByLabel("수험생 체크리스트 이어서 편집").click();
  await page.getByRole("tab", { name: "레이어", exact: true }).click();
  await page.getByRole("button", { name: "헤드라인", exact: true }).click();
  await expect(page.getByLabel("내용")).toHaveValue("편집된 첫 카드");
  await expect(page.getByLabel("X", { exact: true })).toHaveValue("222");
  const download = page.waitForEvent("download");
  await page.getByRole("tab", { name: "게시", exact: true }).click();
  await page.getByRole("button", { name: ".chak 프로젝트" }).click();
  await expect((await download).suggestedFilename()).toMatch(/\.chak$/);
});

test("모바일에서도 카드 선택과 속성 편집을 하고 가로 페이지 넘침이 없다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openGeneratedEditor(page);
  await page.getByRole("button", { name: /2번 카드/ }).first().click();
  await page.getByRole("tab", { name: "레이어", exact: true }).click();
  await page.getByRole("button", { name: "헤드라인", exact: true }).click();
  await page.getByLabel("크기").fill("64");
  await expect(page.getByLabel("크기")).toHaveValue("64");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
