"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Archive as ArchiveIcon, CalendarDays, ChevronRight, FileText, Search, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { CardCanvas } from "@/components/CardCanvas";
import { ProjectImport } from "@/components/archive/ProjectImport";
import { contentTypeLabels, templateMeta } from "@/lib/data";
import { openWorkspaceRepository } from "@/lib/workspace/indexed-db";
import { projectReopenUrl, useWorkspaceProjects } from "@/lib/workspace/hooks";
import type { ContentType, TemplateId } from "@/lib/types";
import type { WorkspaceProject } from "@/lib/workspace/types";

export default function ArchivePage() {
  const { items, setItems, loading, error: storageError, reload } = useWorkspaceProjects();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ContentType | "all">("all");
  const [template, setTemplate] = useState<TemplateId | "all">("all");
  const [recentlyDeleted, setRecentlyDeleted] = useState<{ post: WorkspaceProject; index: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => items.filter((post) => `${post.title} ${post.topic}`.toLowerCase().includes(query.toLowerCase()) && (type === "all" || post.contentType === type) && (template === "all" || post.template === template)), [items, query, type, template]);
  async function remove(id: string) {
    const index = items.findIndex((item) => item.id === id); if (index < 0) return;
    const next = items.filter((item) => item.id !== id); try { await (await openWorkspaceRepository()).deleteProject(id); setRecentlyDeleted({ post: items[index], index }); setItems(next); } catch { setNotice("삭제하지 못했습니다. 기존 프로젝트는 보존되었습니다."); }
  }
  async function undoRemove() {
    if (!recentlyDeleted) return;
    const next = [...items]; next.splice(recentlyDeleted.index, 0, recentlyDeleted.post); try { await (await openWorkspaceRepository()).saveProject(recentlyDeleted.post); setItems(next); setRecentlyDeleted(null); } catch { setNotice("복원에 실패했습니다. .chak 백업 파일이 있다면 다시 가져오세요."); }
  }

  return (
    <div className="page archive-page">
      <header className="page-header"><div><h1>Archive</h1><p>이 브라우저에 저장된 콘텐츠를 그대로 다시 열거나 공유 파일로 가져옵니다.</p></div><div className="result-actions"><ProjectImport onImported={() => { void reload(); setNotice("프로젝트를 가져왔습니다."); }} onError={setNotice} /><Link href="/generate" className="primary-button"><Sparkles size={16} /> 새 카드뉴스</Link></div></header>
      {(notice || storageError) && <div className="error-banner" role="status">{notice || storageError}</div>}
      <section className="archive-metrics"><div><ArchiveIcon /><span><b>{items.length}</b> 전체 콘텐츠</span></div><div><FileText /><span><b>{items.filter((item) => item.status === "draft").length}</b> 편집 중</span></div><div><ShieldAlert /><span><b>{items.filter((item) => item.status === "needs_review").length}</b> 검증 필요</span></div><div><CalendarDays /><span><b>{items.filter((item) => item.status === "ready").length}</b> 게시 준비</span></div></section>
      <div className="archive-toolbar"><label className="search-field wide"><Search size={17} /><span className="sr-only">아카이브 검색</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="제목 또는 주제 검색" /></label><select value={type} onChange={(e) => setType(e.target.value as ContentType | "all")}><option value="all">모든 콘텐츠 유형</option>{Object.entries(contentTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><select value={template} onChange={(e) => setTemplate(e.target.value as TemplateId | "all")}><option value="all">모든 템플릿</option>{Object.keys(templateMeta).map((value) => <option value={value} key={value}>Template {value}</option>)}</select></div>
      <section className="archive-list">
        {loading && <div className="empty-state"><ArchiveIcon /><h2>로컬 프로젝트를 불러오는 중</h2></div>}
        {filtered.map((post) => <article className="archive-row" key={post.id}>
          <div className="archive-preview"><CardCanvas compact slide={post.slides[0]} template={post.template} /></div>
          <div className="archive-info"><div className="badge-line"><span className={`type-badge type-${post.contentType}`}>{contentTypeLabels[post.contentType]}</span><span className={`status-badge status-${post.status}`}>{post.status === "ready" ? "게시 준비" : post.status === "needs_review" ? "검증 필요" : "편집 중"}</span></div><h2>{post.title}</h2><p>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(new Date(post.updatedAt))} · Template {post.template} · {post.slides.length}장</p><div className="tag-line">{[...post.hashtags.core, ...post.hashtags.topic].slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div></div>
          <div className="archive-sources"><span>출처 {post.sourceLinks.length}개</span>{post.sourceLinks.slice(0, 2).map((link) => <a key={link} href={link} target="_blank" rel="noreferrer">{new URL(link).hostname}</a>)}<span>이미지 {post.imageSources.length}개</span>{!post.officialSourceAvailable && post.status === "needs_review" && <b><ShieldAlert size={14} /> 공식 출처 필요</b>}</div>
          <div className="archive-actions"><Link href={projectReopenUrl(post.id)} aria-label={`${post.title} 이어서 편집`}><ChevronRight /></Link><button onClick={() => void remove(post.id)} aria-label={`${post.title} 삭제`}><Trash2 /></button></div>
        </article>)}
        {!loading && !filtered.length && <div className="empty-state"><ArchiveIcon /><h2>{items.length ? "조건에 맞는 콘텐츠가 없어요" : "저장된 프로젝트가 없어요"}</h2><p>{items.length ? "필터를 바꿔보세요." : "새 카드뉴스를 만들거나 .chak 파일을 가져오세요."}</p></div>}
      </section>
      {recentlyDeleted && <div className="undo-toast" role="status"><span>“{recentlyDeleted.post.title}”을 삭제했어요.</span><button onClick={() => void undoRemove()}>되돌리기</button></div>}
    </div>
  );
}
