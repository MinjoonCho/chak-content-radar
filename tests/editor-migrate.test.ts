import assert from "node:assert/strict";
import test from "node:test";
import { reindexSlide, sceneForSlide, syncLegacyFields } from "../lib/editor/migrate";
import type { TextElement } from "../lib/editor/scene";
import type { Slide, TemplateId } from "../lib/types";

const slide: Slide = {
  index: 2,
  type: "content",
  headline: "원서 접수 전 확인",
  subtext: "세부 일정은 대학별로 달라요",
  body: "모집 요강과 공식 공지를 함께 확인하세요.",
  imageQueryKo: "수험생 노트북",
  imageQueryEn: "Korean student laptop",
  imageRequired: true,
  layoutVariant: "photo_right",
  image: { url: "https://images.unsplash.com/photo.jpg", source: "unsplash", sourcePage: "https://unsplash.com/photos/one", licenseStatus: "safe", usableForPublish: true, query: "학생" },
};

test("같은 기존 카드는 템플릿별로 안정적인 ID의 장면을 만든다", () => {
  for (const template of ["A", "B", "C", "D"] satisfies TemplateId[]) {
    const first = sceneForSlide(slide, template);
    const second = sceneForSlide(slide, template);
    assert.deepEqual(first, second);
    assert.equal(first.width, 1080);
    assert.equal(first.height, 1350);
    assert.ok(first.elements.some((element) => element.role === "headline"));
    assert.ok(first.elements.some((element) => element.role === "image"));
    assert.equal(new Set(first.elements.map((element) => element.id)).size, first.elements.length);
  }
});

test("이미 저장된 장면이 있으면 새 템플릿 배치로 덮어쓰지 않는다", () => {
  const canvas = sceneForSlide(slide, "A");
  const edited = { ...canvas, elements: canvas.elements.map((element) => element.role === "headline" ? { ...element, x: 333 } : element) };
  assert.deepEqual(sceneForSlide({ ...slide, canvas: edited }, "D"), edited);
});

test("의미 역할이 있는 레이어 문구와 이미지를 기존 생성 필드로 동기화한다", () => {
  const canvas = sceneForSlide(slide, "B");
  const edited = {
    ...canvas,
    elements: canvas.elements.map((element) => {
      if (element.type === "text" && element.role === "headline") return { ...element, content: "바뀐 제목" };
      if (element.type === "image" && element.role === "image") return { ...element, asset: { ...element.asset, query: "교실" } };
      return element;
    }),
  };
  const synced = syncLegacyFields(slide, edited);
  assert.equal(synced.headline, "바뀐 제목");
  assert.equal(synced.image?.query, "교실");
  assert.deepEqual(synced.canvas, edited);
});

test("카드 순서를 바꾸면 자유 편집 장면의 페이지 번호도 맞춘다", () => {
  const canvas = sceneForSlide(slide, "C");
  const moved = reindexSlide({ ...slide, canvas }, 4);
  assert.equal(moved.index, 4);
  assert.equal(moved.canvas?.elements.find((element): element is TextElement => element.id.endsWith("-footer") && element.type === "text")?.content, "4");
  assert.equal(moved.canvas?.elements.find((element): element is TextElement => element.id.endsWith("-number") && element.type === "text")?.content, "04");
});
