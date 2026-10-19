export type OfficialClassification = { official: boolean; host: string; reason?: string };

const officialDomains = new Map([
  ["moe.go.kr", "교육부 공식 도메인"],
  ["suneung.re.kr", "한국교육과정평가원 공식 도메인"],
  ["adiga.kr", "대입정보포털 공식 도메인"],
  ["ebsi.co.kr", "EBSi 공식 도메인"],
  ["kcue.or.kr", "한국대학교육협의회 공식 도메인"],
  ["goe.go.kr", "교육청 공식 도메인"],
]);

export function classifyOfficialUrl(value: string): OfficialClassification {
  try {
    const host = new URL(value).hostname.toLowerCase();
    for (const [domain, reason] of officialDomains) {
      if (host === domain || host.endsWith(`.${domain}`)) return { official: true, host, reason };
    }
    return { official: false, host };
  } catch {
    return { official: false, host: "" };
  }
}
