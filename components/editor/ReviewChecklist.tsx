import type { ReviewState } from "@/lib/workspace/types";
export function ReviewChecklist({ review, officialRequired, officialAvailable, onChange }: { review: ReviewState; officialRequired: boolean; officialAvailable: boolean; onChange: (review: Partial<ReviewState>) => void }) {
  const options: [keyof ReviewState, string][] = [["copy", "문구·수치 검수"], ["sources", "출처 원문 검수"], ["images", "이미지·라이선스 검수"]];
  return <section className="editor-section review-checklist"><h3>게시 검수</h3>{officialRequired && !officialAvailable && <p className="review-warning">공식 근거가 없어 게시 준비로 전환할 수 없습니다.</p>}{options.map(([key, label]) => <label key={key}><input type="checkbox" checked={review[key]} onChange={(e) => onChange({ [key]: e.target.checked })} /><span>{label}</span></label>)}</section>;
}
