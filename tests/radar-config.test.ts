import assert from "node:assert/strict";
import test from "node:test";
import { clusterForText, isRelevantToCluster } from "../lib/radar/config";

test("입시 정시와 무관한 정시 발사 기사는 제외한다", () => {
  assert.equal(isRelevantToCluster("정시 발사 위성 15기 배달 성공", "admissions"), false);
});

test("대입 문맥이 확인되는 정시·추가합격 기사는 포함한다", () => {
  assert.equal(isRelevantToCluster("2027 대입 정시 추가합격 일정 대학별 발표", "admissions"), true);
});

test("일반 할인은 제외하고 수험표 할인은 포함한다", () => {
  assert.equal(isRelevantToCluster("가을 숙박료 할인 행사", "benefits"), false);
  assert.equal(isRelevantToCluster("수능 수험표 제시 숙박료 30% 할인", "benefits"), true);
});

test("수능 끝이라는 표현이 있어도 수험생 할인 기사는 혜택으로 분류한다", () => {
  assert.equal(clusterForText("수능 끝, 수험생 대상 숙박요금 30% 할인", "after-exam"), "benefits");
});
