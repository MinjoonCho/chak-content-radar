"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, BadgeCheck, CheckCircle2, ChevronRight, Clock3, Database, ExternalLink, FileSearch, Layers3, LoaderCircle, RefreshCw, Search, ShieldAlert, TrendingDown, TrendingUp, X } from "lucide-react";
import { contentTypeLabels } from "@/lib/data";
import { isRadarRefreshDue, mergeRadarSnapshot } from "@/lib/radar/client";
import { openWorkspaceRepository } from "@/lib/workspace/indexed-db";
import type { RadarItem, RadarProviderRun, RadarSnapshot } from "@/lib/types";
import { radarCollectionCopy } from "@/lib/ui-copy";

function Score({ value, label, tone }: { value: number | null; label: string; tone: string }) {
  return <div className="score"><span className={`score-value ${tone}`}>{value ?? "—"}</span><small>{value === null ? `${label} 데이터 없음` : label}</small></div>;
}

function formatDate(value: string | null | undefined, includeTime = true) {
  if (!value) return "아직 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "시간 미상";
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "short", day: "numeric", ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(date);
}

const evidenceLabels = { reel: "릴스", video: "영상", post: "게시물", hashtag: "해시태그", official: "공식", community: "커뮤니티", article: "기사", search: "검색" } as const;

function TrendRow({ item }: { item: RadarItem }) {
  const [activeSource, setActiveSource] = useState<number | null>(null);
  const sourceLinks = [...new Set(item.sources.flatMap((source) => source.evidence.map((evidence) => evidence.url)))];
  const selectedSource = activeSource === null ? null : item.sources[activeSource];
  const recommendation = Math.round((item.engagementScore ?? item.evidenceScore) * .35 + item.evidenceScore * .4 + item.recencyScore * .25);
  const trend = item.trendDirection === "new" ? "신규" : item.trendDirection === "rising" ? "근거 증가" : item.trendDirection === "falling" ? "근거 감소" : "유지";
  return (
    <article className="trend-row">
      <div className="trend-score-block">
        <span className="rank-label">추천도</span><strong>{recommendation}</strong>
        <span className={`trend-delta trend-${item.trendDirection}`}>{item.trendDirection === "falling" ? <TrendingDown size={13} /> : <TrendingUp size={13} />} {trend}</span>
      </div>
      <div className="trend-body">
        <div className="trend-heading">
          <div>
            <div className="badge-line">
              <span className={`type-badge type-${item.recommendedContentType}`}>{contentTypeLabels[item.recommendedContentType]}</span>
              {item.officialSourceAvailable ? <span className="verified"><BadgeCheck size={13} /> 공식 원문 포함</span> : <span className="needs-check"><ShieldAlert size={13} /> 공식 원문 미확인</span>}
            </div>
            <h2>{item.title}</h2><p>{item.summary}</p>
          </div>
          <div className="score-strip"><Score value={item.engagementScore} label="공개 반응" tone="coral" /><Score value={item.evidenceScore} label="근거" tone="blue" /><Score value={item.recencyScore} label="최신성" tone="amber" /></div>
        </div>
        <div className="card-forecast">
          <div className="forecast-hook"><Layers3 size={15} /><span><b>첫 장 후보</b>{item.coverHook}</span></div>
          <ol aria-label="예상 카드 구성">{item.cardPlan.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
        </div>
        <div className="source-signals">
          <span className="source-label"><FileSearch size={13} /> 실제 수집 근거</span>
          {item.sources.map((source, index) => <button key={`${source.label}-${index}`} className={activeSource === index ? "source-chip active" : "source-chip"} aria-expanded={activeSource === index} aria-controls={`source-${item.id}`} onClick={() => setActiveSource(activeSource === index ? null : index)}>
            <span><b>{source.label}</b> {source.value}</span><ChevronRight size={12} />
            <span className="source-tooltip" role="tooltip"><b>{source.headline}</b><small>{source.capturedAt} · 원문 목록 보기</small></span>
          </button>)}
        </div>
        {selectedSource && <div className="source-detail" id={`source-${item.id}`}>
          <div className="source-detail-head"><div><span className={`source-kind source-kind-${selectedSource.sourceType}`}>{selectedSource.official ? "공식" : selectedSource.sourceType === "community" ? "커뮤니티" : selectedSource.sourceType === "social" || selectedSource.sourceType === "video" ? "소셜" : "검색"}</span><b>{selectedSource.label}</b><small>{selectedSource.capturedAt}</small></div><button aria-label="출처 상세 닫기" onClick={() => setActiveSource(null)}><X size={15} /></button></div>
          <h3>{selectedSource.headline}</h3><p>{selectedSource.detail}</p>
          <div className="source-evidence-list" aria-label={`${selectedSource.label} 원문 링크`}>
            {selectedSource.evidence.map((evidence) => <a key={evidence.url} href={evidence.url} target="_blank" rel="noreferrer">
              <span className={`evidence-kind evidence-kind-${evidence.kind}`}>{evidenceLabels[evidence.kind]}</span>
              <span><b>{evidence.label}</b><small>{[evidence.author, evidence.publishedAt ? formatDate(evidence.publishedAt) : null, evidence.note].filter(Boolean).join(" · ")}</small></span><ExternalLink size={13} />
            </a>)}
          </div>
          <div className="source-detail-foot"><span>수집 질의 <b>{selectedSource.query}</b></span></div>
        </div>}
        <div className="trend-footer">
          <span><Clock3 size={14} /> 최근 원문 {formatDate(item.detectedAt)} · 직접 링크 {sourceLinks.length}개</span>
          <Link className="inline-action" href={`/generate?topic=${encodeURIComponent(item.generationTopic)}&type=${item.recommendedContentType}&verified=${item.officialSourceAvailable ? "1" : "0"}&sources=${encodeURIComponent(sourceLinks.join("|"))}`}>카드뉴스 만들기 <ArrowRight size={16} /></Link>
        </div>
      </div>
    </article>
  );
}

function ProviderState({ provider }: { provider: RadarProviderRun }) {
  return <div className={`provider-state provider-${provider.status}`}>{provider.status === "ok" ? <CheckCircle2 size={16} /> : provider.status === "error" ? <AlertCircle size={16} /> : <Clock3 size={16} />}<div><b>{provider.label}</b><span>{provider.status === "ok" ? `${provider.collected}개 수집` : provider.message}</span></div></div>;
}

export default function RadarPage() {
  const [snapshot, setSnapshot] = useState<RadarSnapshot | null>(null);
  const [kind, setKind] = useState<"topic" | "format">("topic");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshMinutes, setRefreshMinutes] = useState<0 | 30 | 60 | 180>(60);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const repository = await openWorkspaceRepository();
      const [stored, preferences] = await Promise.all([repository.getRadarSnapshot(), repository.getPreferences()]);
      setSnapshot(stored ?? { version: 1, lastRunAt: null, topics: [], signals: [], providers: [] });
      setRefreshMinutes(preferences.radarRefreshMinutes); setError(null);
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(loadError instanceof Error ? loadError.message : "Radar를 불러오지 못했습니다.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  async function runCollection() {
    if (running) return;
    setRunning(true); setError(null);
    try {
      const response = await fetch("/api/radar/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ previous: snapshot }) });
      const payload = await response.json() as RadarSnapshot & { error?: string };
      if (!response.ok) throw new Error(payload.error || `수집 요청이 실패했습니다. (${response.status})`);
      const merged = mergeRadarSnapshot(snapshot, payload);
      await (await openWorkspaceRepository()).saveRadarSnapshot(merged);
      setSnapshot(merged);
      if (!merged.topics.length) setError("수집된 원문이 없습니다. 오른쪽 공급자 상태에서 필요한 API 키나 실패 원인을 확인하세요.");
    } catch (runError) { setError(runError instanceof Error ? runError.message : "Radar 수집에 실패했습니다."); }
    finally { setRunning(false); }
  }

  useEffect(() => {
    if (!snapshot || !isRadarRefreshDue(snapshot.lastRunAt, refreshMinutes)) return;
    void runCollection();
    // snapshot 변경 시 다음 만료 여부를 다시 평가합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot?.lastRunAt, refreshMinutes]);

  async function changeRefresh(value: 0 | 30 | 60 | 180) {
    setRefreshMinutes(value);
    try { await (await openWorkspaceRepository()).savePreferences({ radarRefreshMinutes: value }); }
    catch { setError("자동 수집 설정을 로컬에 저장하지 못했습니다."); }
  }

  const topics = snapshot?.topics ?? [];
  const filtered = useMemo(() => topics.filter((item) => item.kind === kind && `${item.title} ${item.summary} ${item.keywords.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [topics, kind, query]);
  const directLinks = new Set(topics.flatMap((topic) => topic.sources.flatMap((source) => source.evidence.map((evidence) => evidence.url)))).size;
  const officialTopics = topics.filter((topic) => topic.officialSourceAvailable).length;
  const workingProviders = snapshot?.providers.filter((provider) => provider.status === "ok").length ?? 0;

  return <div className="page radar-page">
    <header className="page-header"><div><h1>온라인 원문에서 콘텐츠 후보를 찾습니다</h1><p>기사·게시물·영상 링크를 주제별로 묶어 보여줍니다.</p></div><div className="result-actions"><label className="refresh-select">자동 수집 <select aria-label="자동 수집 간격" value={refreshMinutes} onChange={(event) => void changeRefresh(Number(event.target.value) as 0 | 30 | 60 | 180)}><option value={0}>끔</option><option value={30}>30분</option><option value={60}>1시간</option><option value={180}>3시간</option></select></label><button className="secondary-button" disabled={running} onClick={() => void runCollection()}>{running ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />} {running ? "수집 중" : "지금 수집"}</button></div></header>
    {error && <div className="error-banner radar-error" role="alert"><AlertCircle size={17} /><span>{error}</span><button onClick={() => setError(null)} aria-label="오류 메시지 닫기"><X size={15} /></button></div>}
    <section className="radar-summary" aria-label="레이더 수집 요약"><div className="pulse-orbit"><span /><i /></div><div><strong>{topics.length}개 주제</strong><span>{snapshot?.lastRunAt ? `${formatDate(snapshot.lastRunAt)} 수집 완료` : "수집 전"}</span></div><dl><div><dt>직접 링크</dt><dd>{directLinks}</dd></div><div><dt>공식 원문</dt><dd>{officialTopics}</dd></div><div><dt>작동 공급자</dt><dd>{workingProviders}</dd></div></dl><p>{radarCollectionCopy(Boolean(snapshot?.lastRunAt))}</p></section>
    <div className="toolbar"><div className="segmented" role="tablist" aria-label="레이더 종류"><button role="tab" aria-selected={kind === "topic"} onClick={() => setKind("topic")}>Topic Radar <span>{topics.filter((item) => item.kind === "topic").length}</span></button><button role="tab" aria-selected={kind === "format"} onClick={() => setKind("format")}>Format Radar <span>{topics.filter((item) => item.kind === "format").length}</span></button></div><label className="search-field"><Search size={17} /><span className="sr-only">레이더 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목 또는 키워드 검색" /></label></div>
    <div className="content-layout"><section className="trend-list" aria-live="polite"><div className="list-caption"><span>원문 근거 추천도순</span><small>{snapshot?.lastRunAt ? `마지막 수집 ${formatDate(snapshot.lastRunAt)}` : "수집 전"}</small></div>
      {loading ? <div className="empty-state"><LoaderCircle className="spin" size={25} /><h2>저장된 Radar를 불러오는 중</h2></div> : filtered.map((item) => <TrendRow key={item.id} item={item} />)}
      {!loading && !filtered.length && <div className="empty-state"><Database size={25} /><h2>{kind === "format" ? "반복 포맷이 아직 없습니다" : topics.length ? "검색과 일치하는 원문이 없습니다" : "수집된 원문이 없습니다"}</h2><p>{kind === "format" ? "Instagram 감시 계정의 게시물과 릴스가 쌓이면 반복 포맷을 계산합니다." : topics.length ? "다른 검색어를 입력해보세요." : "수집을 실행하고 공급자 상태를 확인하세요."}</p>{!topics.length && <button className="secondary-button" disabled={running} onClick={() => void runCollection()}>{running ? "수집 중" : "지금 수집"}</button>}</div>}
    </section><aside className="review-panel provider-panel"><h2>수집 공급자 상태</h2>{snapshot?.providers.length ? snapshot.providers.map((provider) => <ProviderState key={provider.provider} provider={provider} />) : <div className="provider-placeholder"><Database size={18} /><p>첫 수집 후 공급자별 성공·설정 누락·오류가 여기에 표시됩니다.</p></div>}<Link href="/generate" className="primary-button full">직접 주제로 만들기 <ArrowRight size={16} /></Link></aside></div>
  </div>;
}
