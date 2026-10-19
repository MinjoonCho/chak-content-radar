import assert from "node:assert/strict";
import test from "node:test";
import { classifyOfficialUrl } from "../lib/evidence/official";

test("교육부와 평가원 URL을 공식 교육 출처로 분류한다", () => {
  assert.deepEqual(classifyOfficialUrl("https://www.moe.go.kr/boardCnts/view.do?boardID=294"), { official: true, host: "www.moe.go.kr", reason: "교육부 공식 도메인" });
  assert.equal(classifyOfficialUrl("https://www.suneung.re.kr/news/1").official, true);
});

test("공식 도메인의 하위 도메인은 허용하되 유사 도메인은 거부한다", () => {
  assert.equal(classifyOfficialUrl("https://notice.adiga.kr/post/1").official, true);
  assert.equal(classifyOfficialUrl("https://adiga.kr.example.com/post/1").official, false);
});
