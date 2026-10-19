import { expect, test } from "@playwright/test";
import { openGeneratedEditor } from "./helpers";

const tinyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nQAAAABJRU5ErkJggg==", "base64");

test("텍스트·도형·이미지 레이어를 추가하고 스타일·순서·잠금·숨김을 편집한다", async ({ page }) => {
  await openGeneratedEditor(page);
  await page.getByRole("button", { name: "텍스트", exact: true }).click();
  await expect(page.getByLabel("내용")).toHaveValue("새 텍스트");
  await page.getByLabel("글자색").fill("#2f6bff");
  await page.getByRole("toolbar", { name: "캔버스 도구" }).getByRole("button", { name: "사각형", exact: true }).click();
  await expect(page.getByLabel("형태")).toHaveValue("rectangle");
  await page.getByLabel("채우기").fill("#d93a1f");
  await page.getByLabel("이미지 업로드").setInputFiles({ name: "pixel.png", mimeType: "image/png", buffer: tinyPng });
  await expect(page.getByText("팀 업로드")).toBeVisible();
  await page.getByRole("tab", { name: "레이어", exact: true }).click();
  await page.getByRole("button", { name: "레이어 잠금" }).first().click();
  await page.getByRole("button", { name: "레이어 숨기기" }).first().click();
  await page.getByRole("button", { name: "레이어 뒤로" }).first().click();
});

test("캔버스 직접 이동·크기·회전과 실행 취소/다시 실행을 지원한다", async ({ page }) => {
  await openGeneratedEditor(page);
  await page.getByRole("tab", { name: "레이어", exact: true }).click();
  await page.getByRole("button", { name: "헤드라인", exact: true }).click();
  const hit = page.locator(".interaction-layer .element-hit[data-element-id$='-headline']");
  const before = await page.getByLabel("X", { exact: true }).inputValue();
  const box = await hit.boundingBox();
  if (!box) throw new Error("헤드라인 선택 영역을 찾지 못했습니다.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 20); await page.mouse.up();
  await expect(page.getByLabel("X", { exact: true })).not.toHaveValue(before);
  await hit.dblclick();
  await expect(page.locator(".canvas-text-editor")).toBeVisible();
  await page.locator(".canvas-text-editor").fill("캔버스에서 직접 편집");
  await page.locator(".canvas-text-editor").press("Tab");
  await expect(page.getByLabel("내용")).toHaveValue("캔버스에서 직접 편집");
  const resize = page.locator(".handle-se");
  const resizeBox = await resize.boundingBox();
  if (!resizeBox) throw new Error("크기 조절점을 찾지 못했습니다.");
  await page.mouse.move(resizeBox.x + 2, resizeBox.y + 2); await page.mouse.down(); await page.mouse.move(resizeBox.x + 24, resizeBox.y + 18); await page.mouse.up();
  const rotate = page.locator(".rotate-handle");
  const rotateBox = await rotate.boundingBox();
  if (!rotateBox) throw new Error("회전점을 찾지 못했습니다.");
  await page.mouse.move(rotateBox.x + 5, rotateBox.y + 5); await page.mouse.down(); await page.mouse.move(rotateBox.x + 40, rotateBox.y + 10); await page.mouse.up();
  await expect(page.getByLabel("회전")).not.toHaveValue("0");
  await page.getByLabel("실행 취소").click();
  await page.getByLabel("다시 실행").click();
  const elementCount = await page.locator(".element-hit").count();
  await page.locator(".freeform-viewport").focus();
  await page.keyboard.press("Meta+c");
  await page.keyboard.press("Meta+v");
  await expect(page.locator(".element-hit")).toHaveCount(elementCount + 1);
  const viewport = page.locator(".freeform-viewport");
  const viewportBox = await viewport.boundingBox();
  if (!viewportBox) throw new Error("캔버스 뷰포트를 찾지 못했습니다.");
  const transformBeforePan = await page.locator(".freeform-spacer").getAttribute("style");
  await page.mouse.move(viewportBox.x + 16, viewportBox.y + 16);
  await page.keyboard.down("Shift");
  await page.mouse.down(); await page.mouse.move(viewportBox.x + 46, viewportBox.y + 36); await page.mouse.up();
  await page.keyboard.up("Shift");
  await expect(page.locator(".freeform-spacer")).not.toHaveAttribute("style", transformBeforePan ?? "");
  await page.getByLabel("확대").click();
  await expect(page.getByText("60%")).toBeVisible();
});

test("카드 재생성 결과가 기존 자유 편집 캔버스를 교체한다", async ({ page }) => {
  await page.route("**/api/generate/slide", (route) => route.fulfill({ json: { slide: { index: 1, type: "cover", headline: "새로 만든 헤드라인", subtext: "새 보조 문구", body: "", imageQueryKo: "새 검색어", imageQueryEn: "new query", imageRequired: false, layoutVariant: "text_only" }, mode: "demo", evidence: [] } }));
  await openGeneratedEditor(page);
  await page.getByRole("tab", { name: "레이어", exact: true }).click();
  await page.getByRole("button", { name: "헤드라인", exact: true }).click();
  await page.getByLabel("내용").fill("기존 자유 편집 문구");
  await page.getByLabel("이 카드 재생성").click();
  await page.getByRole("tab", { name: "레이어", exact: true }).click();
  await page.getByRole("button", { name: "헤드라인", exact: true }).click();
  await expect(page.getByLabel("내용")).toHaveValue("새로 만든 헤드라인");
});

test("슬라이드 복제·순서 변경과 PNG·ZIP 내보내기를 실행한다", async ({ page }) => {
  await page.route("**/api/render", (route) => route.fulfill({ body: tinyPng, contentType: "image/png" }));
  await page.route("**/api/render/zip", (route) => route.fulfill({ body: Buffer.from("zip"), contentType: "application/zip" }));
  await openGeneratedEditor(page);
  await page.getByLabel("1번 카드 복제").click();
  await expect(page.getByText("3장")).toBeVisible();
  await page.getByLabel("2번 카드 아래로").click();
  await page.getByRole("tab", { name: "게시", exact: true }).click();
  const png = page.waitForEvent("download"); await page.getByRole("button", { name: "현재 PNG" }).click(); expect((await png).suggestedFilename()).toMatch(/\.png$/);
  const zip = page.waitForEvent("download"); await page.getByRole("button", { name: "전체 ZIP" }).click(); expect((await zip).suggestedFilename()).toMatch(/\.zip$/);
});

test("데스크톱 사이드바를 접고 다시 펼치며 상태를 기억한다", async ({ page }) => {
  await openGeneratedEditor(page);
  await page.getByLabel("사이드바 접기").click();
  await expect(page.locator(".app-shell")).toHaveClass(/app-shell--collapsed/);
  await expect(page.getByLabel("사이드바 펼치기")).toBeVisible();
  await page.reload();
  await expect(page.locator(".app-shell")).toHaveClass(/app-shell--collapsed/);
  await page.getByLabel("사이드바 펼치기").click();
  await expect(page.locator(".app-shell")).not.toHaveClass(/app-shell--collapsed/);
});

test("낮은 데스크톱 화면에서도 속성 패널 끝까지 내부 스크롤한다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 520 });
  await openGeneratedEditor(page);
  await page.getByRole("tab", { name: "레이어", exact: true }).click();
  await page.getByRole("button", { name: "헤드라인", exact: true }).click();
  const panel = page.locator(".editor-panel-body");
  const size = await panel.evaluate((element) => ({ clientHeight: element.clientHeight, scrollHeight: element.scrollHeight }));
  expect(size.scrollHeight).toBeGreaterThan(size.clientHeight);
  await panel.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect(page.getByLabel("정렬")).toBeVisible();
  await page.getByLabel("정렬").selectOption("center");
  await expect(page.getByLabel("정렬")).toHaveValue("center");
});
