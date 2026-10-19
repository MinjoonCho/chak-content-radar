const allowedHosts = new Set(["images.pexels.com", "images.unsplash.com", "cdn.pixabay.com", "upload.wikimedia.org"]);
const MAX = 8 * 1024 * 1024;
export async function normalizeRenderImage(value: string, fetcher: typeof fetch = fetch) {
  if (value.startsWith("data:")) { const comma = value.indexOf(","); if (comma < 0 || Math.ceil((value.length - comma - 1) * .75) > MAX) throw new Error("이미지 크기는 8MB 이하여야 합니다."); if (!/^data:image\/(png|jpeg|webp);base64,/i.test(value)) throw new Error("지원하지 않는 이미지 형식입니다."); return value; }
  const url = new URL(value); if (url.protocol !== "https:" || !allowedHosts.has(url.hostname)) throw new Error("허용되지 않은 이미지 호스트입니다.");
  const response = await fetcher(value, { signal: AbortSignal.timeout(10_000) }); if (!response.ok) throw new Error(`이미지 요청 실패 (${response.status})`);
  const declared = Number(response.headers.get("content-length") || 0); if (declared > MAX) throw new Error("이미지 크기는 8MB 이하여야 합니다."); const buffer = await response.arrayBuffer(); if (buffer.byteLength > MAX) throw new Error("이미지 크기는 8MB 이하여야 합니다.");
  const type = response.headers.get("content-type") || "image/jpeg"; if (!/^image\/(png|jpeg|webp)/.test(type)) throw new Error("지원하지 않는 이미지 형식입니다."); return `data:${type};base64,${Buffer.from(buffer).toString("base64")}`;
}
