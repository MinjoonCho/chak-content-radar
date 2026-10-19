"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, RadioTower, Sparkles, CircleCheck, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useEffect, useState } from "react";
import { shellConnectionCopy } from "@/lib/ui-copy";

const nav = [
  { href: "/radar", label: "Radar", sub: "주제와 포맷 탐색", icon: RadioTower },
  { href: "/generate", label: "Generate", sub: "카드뉴스 제작", icon: Sparkles },
  { href: "/archive", label: "Archive", sub: "콘텐츠 보관함", icon: Archive },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [geminiConnected, setGeminiConnected] = useState(false);
  const [connectionLabel, connectionDetail] = shellConnectionCopy(geminiConnected);

  useEffect(() => {
    fetch("/api/status").then((response) => response.json()).then((data) => setGeminiConnected(Boolean(data.geminiConnected))).catch(() => setGeminiConnected(false));
    setCollapsed(window.localStorage.getItem("chak-sidebar-collapsed") === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("chak-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className={`app-shell ${collapsed ? "app-shell--collapsed" : ""}`}>
      <button className="mobile-menu" aria-label="메뉴 열기" onClick={() => setOpen(true)}><Menu size={21} /></button>
      {open && <button className="nav-scrim" aria-label="메뉴 닫기" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "sidebar--open" : ""} ${collapsed ? "sidebar--collapsed" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">C</div>
          <div className="brand-copy"><strong>CHAK</strong><span>Content Studio</span></div>
          <button className="desktop-sidebar-toggle" aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"} title={collapsed ? "사이드바 펼치기" : "사이드바 접기"} onClick={toggleCollapsed}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
          <button className="mobile-close" aria-label="메뉴 닫기" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav aria-label="주요 메뉴">
          {nav.map(({ href, label, sub, icon: Icon }) => (
            <Link key={href} href={href} title={collapsed ? label : undefined} className={pathname.startsWith(href) ? "nav-link active" : "nav-link"} onClick={() => setOpen(false)}>
              <Icon size={19} strokeWidth={2} />
              <span><b>{label}</b><small>{sub}</small></span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-status">
          <div className="status-row"><CircleCheck size={16} /><span>{connectionLabel}</span></div>
          <p>{connectionDetail}</p>
          <Link href="/generate#settings">연결 설정 보기</Link>
        </div>
        <div className="workspace-owner"><span>CM</span><div className="workspace-copy"><b>Content Marketing</b><small>내부 워크스페이스</small></div></div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
