import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRenderImage } from "../lib/render/images";
test("허용되지 않은 원격 이미지 호스트를 거부한다", async () => await assert.rejects(normalizeRenderImage("https://evil.example/a.jpg", async () => new Response("x")), /허용/));
test("너무 큰 data 이미지를 거부한다", async () => await assert.rejects(normalizeRenderImage(`data:image/png;base64,${"A".repeat(12_000_000)}`, fetch), /크기/));
test("허용 호스트 이미지는 data URL로 정규화한다", async () => {
  const value = await normalizeRenderImage("https://images.pexels.com/a.jpg", async () => new Response(new Uint8Array([1,2,3]), { headers: { "content-type": "image/jpeg" } }));
  assert.match(value, /^data:image\/jpeg;base64,/);
});
