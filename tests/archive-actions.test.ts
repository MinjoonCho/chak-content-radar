import assert from "node:assert/strict"; import test from "node:test"; import { projectReopenUrl } from "../lib/workspace/hooks";
test("Archive 재개 링크는 주제가 아닌 정확한 프로젝트 ID를 사용한다", () => assert.equal(projectReopenUrl("a b"), "/generate?project=a%20b"));
