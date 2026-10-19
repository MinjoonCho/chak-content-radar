import type { RadarProviderRun, RadarSignal } from "@/lib/types";

export type CollectorResult = {
  signals: RadarSignal[];
  run: RadarProviderRun;
};
