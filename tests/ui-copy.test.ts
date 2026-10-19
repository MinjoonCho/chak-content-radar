import assert from "node:assert/strict";
import test from "node:test";
import { generationConnectionCopy, radarCollectionCopy, shellConnectionCopy } from "../lib/ui-copy";

test("제품 문구는 구현 변명 없이 다음 행동과 현재 상태를 말한다", () => {
  const copy = [radarCollectionCopy(true), radarCollectionCopy(false), shellConnectionCopy(true), shellConnectionCopy(false), generationConnectionCopy(true), generationConnectionCopy(false)].join(" ");
  for (const phrase of ["더미 데이터", "실제 응답", "AI 생성", "데모 모드", "코드가 고정"]) assert.doesNotMatch(copy, new RegExp(phrase));
  assert.match(copy, /수집|연결|초안/);
});
