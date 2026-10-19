export const contentTypeLabels = { info: "정보형", viral: "바이럴형", curation: "큐레이션형", breaking: "속보형" } as const;

export const templateMeta = {
  A: { name: "Template A", label: "정보형", description: "큰 제목 + 사진 + 짧은 설명" },
  B: { name: "Template B", label: "바이럴형", description: "사진 중심 + 강한 한 문장" },
  C: { name: "Template C", label: "큐레이션형", description: "번호가 선명한 리스트" },
  D: { name: "Template D", label: "속보형", description: "날짜·출처·행동 요약" },
} as const;
