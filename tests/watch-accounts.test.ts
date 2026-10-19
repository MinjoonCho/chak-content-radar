import assert from "node:assert/strict";
import test from "node:test";
import { parseWatchAccounts } from "../lib/config/watch-accounts";

test("빈 계정 목록과 실제 계정 목록을 스키마로 읽는다", () => {
  const empty = parseWatchAccounts("instagram:\n  accounts:\n    creators: []\nyoutube:\n  channels: []");
  assert.deepEqual(empty.instagram.accounts.creators, []);
  const full = parseWatchAccounts("instagram:\n  accounts:\n    creators:\n      - chak_official\n      - study.star\nyoutube:\n  channels:\n    - UC123");
  assert.deepEqual(full.instagram.accounts.creators, ["chak_official", "study.star"]);
  assert.deepEqual(full.youtube.channels, ["UC123"]);
});
test("허용되지 않은 계정 문자는 거부한다", () => assert.throws(() => parseWatchAccounts("instagram:\n  accounts:\n    creators:\n      - 'bad account'"), /계정/));
