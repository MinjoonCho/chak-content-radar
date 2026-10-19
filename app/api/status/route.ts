import { NextResponse } from "next/server";
type Health = { checkedAt: number; geminiVerified: boolean; pexelsVerified: boolean };
let cached: Health | null = null;
async function verify() {
  if (cached && Date.now() - cached.checkedAt < 5 * 60_000) return cached;
  const geminiKey = process.env.GEMINI_API_KEY, pexelsKey = process.env.PEXELS_API_KEY;
  const [geminiVerified, pexelsVerified] = await Promise.all([
    geminiKey ? fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}&pageSize=1`, { signal: AbortSignal.timeout(5000) }).then((r) => r.ok).catch(() => false) : false,
    pexelsKey ? fetch("https://api.pexels.com/v1/curated?per_page=1", { headers: { Authorization: pexelsKey }, signal: AbortSignal.timeout(5000) }).then((r) => r.ok).catch(() => false) : false,
  ]);
  return cached = { checkedAt: Date.now(), geminiVerified, pexelsVerified };
}
export async function GET() {
  const health = await verify(); const geminiConfigured = Boolean(process.env.GEMINI_API_KEY); const imageSearchConfigured = Boolean(process.env.PEXELS_API_KEY);
  return NextResponse.json({ geminiConfigured, geminiConnected: health.geminiVerified, imageSearchConfigured, imageSearchConnected: health.pexelsVerified, model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite", checkedAt: new Date(health.checkedAt).toISOString() });
}
