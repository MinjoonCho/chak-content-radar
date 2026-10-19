import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "CHAK Content Radar",
  description: "수험생 트렌드 탐색부터 카드뉴스 제작까지 이어지는 CHAK 내부 워크스페이스",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {/*
        THESIS: 수험생 콘텐츠의 발견·검증·제작을 한 화면 흐름으로 잇고, 장식적인 마케팅 대시보드 배치를 거부한다.
        OWN-WORLD: CHAK의 토마토 레드, 웜 페이퍼, 짙은 잉크와 얇은 구분선으로 만든 편집 데스크.
        STORY: 팀원은 지금 뜨는 주제와 근거를 보고, 안전 상태를 확인한 뒤, 코드 템플릿으로 바로 제작한다.
        FIRST VIEWPORT: 왼쪽 고정 내비게이션, 상단 운영 상태, 중앙의 점수순 신호 목록과 우측 검수 요약.
        FORM: 기존 CHAK 디자인 시스템을 확장한 내부 운영 도구; incumbent-chak-ops.
        FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
