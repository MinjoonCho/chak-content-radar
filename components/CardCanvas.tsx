import { renderCardSvg } from "@/lib/render/card-svg";
import type { Slide, TemplateId } from "@/lib/types";
export function CardCanvas({ slide, template, compact = false, total = 1 }: { slide: Slide; template: TemplateId; compact?: boolean; total?: number }) { return <div className={`card-canvas canonical-svg ${compact ? "compact" : ""}`} aria-label={`${slide.index}번 카드 미리보기`} dangerouslySetInnerHTML={{ __html: renderCardSvg(slide, template, total) }} />; }
