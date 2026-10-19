export function radarCollectionCopy(collected: boolean) {
  return collected ? "마지막 수집 시점의 원문과 반응을 정리했습니다." : "첫 수집을 시작하면 기사·게시물·영상 후보가 여기에 쌓입니다.";
}

export function shellConnectionCopy(connected: boolean): [string, string] {
  return connected ? ["문구 생성 연결됨", "주제와 근거를 바탕으로 카드 초안을 만듭니다."] : ["빠른 초안 사용 중", "연결 설정을 추가하면 주제별 문구 생성도 사용할 수 있습니다."];
}

export function generationConnectionCopy(connected: boolean): [string, string] {
  return connected ? ["문구 생성 연결됨", "민감한 정보는 게시 전에 공식 출처를 확인하세요."] : ["빠른 초안", "연결 설정을 추가하면 주제에 맞춘 문구를 만들 수 있습니다."];
}
