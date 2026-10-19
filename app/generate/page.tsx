import { Suspense } from "react";
import { GeneratorWorkspace } from "@/components/GeneratorWorkspace";

export default function GeneratePage() {
  return <Suspense fallback={<div className="page loading-page">Generate를 준비하고 있어요…</div>}><GeneratorWorkspace /></Suspense>;
}
