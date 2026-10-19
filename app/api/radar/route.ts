export const runtime = "nodejs";

export async function GET() {
  return Response.json({ version: 1, lastRunAt: null, topics: [], signals: [], providers: [] }, { headers: { "Cache-Control": "no-store" } });
}
