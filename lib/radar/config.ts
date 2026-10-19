export type RadarCluster = {
  key: string;
  label: string;
  queries: string[];
  keywords: string[];
};

const academicYear = new Date().getFullYear() + 1;

export const radarClusters: RadarCluster[] = [
  { key: "admissions", label: "입시 일정·합격 발표", queries: [`${academicYear}학년도 대입 추가합격`, `${academicYear}학년도 대학 정시 입시`, "대학 논술 수험생"], keywords: ["추가합격", "합격 발표", "정시", "논술", "입시", "대입", "등록 마감"] },
  { key: "exam-day", label: "수능 당일 준비", queries: [`${academicYear}학년도 수능 준비물 반입금지`, `${academicYear}학년도 수능 시간표 수험생`], keywords: ["수능 준비물", "수능 시간표", "수능 샤프", "시험장", "반입 금지"] },
  { key: "lunch", label: "수능 도시락", queries: [`${academicYear}학년도 수능 도시락 메뉴`], keywords: ["수능 도시락", "도시락", "수험생 식사"] },
  { key: "benefits", label: "수험생 할인·혜택", queries: [`${academicYear} 수능 수험생 할인 수험표`], keywords: ["수험생 할인", "수험표 할인", "수험생 혜택", "수험표"] },
  { key: "after-exam", label: "수능 이후 생활", queries: [`${academicYear} 수능 끝난 고3 할 일`], keywords: ["수능 끝", "수능 끝나고", "고3", "운전면허", "졸업"] },
];

export const allRadarQueries = radarClusters.flatMap((cluster) => cluster.queries.map((query) => ({ query, clusterKey: cluster.key })));

export function clusterForText(text: string, fallback: string) {
  const normalized = text.toLowerCase();
  const studentContext = hasAny(normalized, ["수능", "수험생", "수험표", "고3"]);
  if (studentContext && hasAny(normalized, ["할인", "혜택", "무료", "지원"])) return "benefits";
  if (studentContext && hasAny(normalized, ["도시락", "식사", "점심"])) return "lunch";
  return radarClusters.find((cluster) => cluster.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())))?.key ?? fallback;
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function isRelevantToCluster(text: string, clusterKey: string) {
  const normalized = text.toLowerCase();
  if (clusterKey === "admissions") return hasAny(normalized, ["대입", "입시", "대학", "수시", "논술", "수능"]);
  if (clusterKey === "exam-day") return hasAny(normalized, ["수능", "수험생", "시험장", "반입 금지"]);
  if (clusterKey === "lunch") return hasAny(normalized, ["수능", "수험생"]) && hasAny(normalized, ["도시락", "식사", "점심"]);
  if (clusterKey === "benefits") return hasAny(normalized, ["수험생", "수험표", "수능"]) && hasAny(normalized, ["할인", "혜택", "무료", "지원"]);
  if (clusterKey === "after-exam") return hasAny(normalized, ["수능", "수험생", "고3"]) && hasAny(normalized, ["끝", "이후", "졸업", "운전면허", "문화", "여행", "생활"]);
  return hasAny(normalized, ["수능", "수험생", "고3", "대입", "입시"]);
}
