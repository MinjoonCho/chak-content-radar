import { runRadarPipeline } from "@/lib/radar/pipeline";
import type { RadarSnapshot } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    let previous: RadarSnapshot | undefined;
    try { previous = (await request.json() as { previous?: RadarSnapshot }).previous; } catch { previous = undefined; }
    return Response.json(await runRadarPipeline(previous), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Radar 수집에 실패했습니다." }, { status: 500 });
  }
}
