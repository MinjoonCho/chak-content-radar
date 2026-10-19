"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, ChevronLeft, Copy, Layers3, LoaderCircle, RefreshCw, Save, Send, ShieldAlert, SlidersHorizontal, Sparkles, Trash2, WandSparkles } from "lucide-react";
import { CardCanvas } from "./CardCanvas";
import { CaptionEditor } from "./editor/CaptionEditor";
import { ReviewChecklist } from "./editor/ReviewChecklist";
import { ExportActions } from "./editor/ExportActions";
import { EditorToolbar } from "./editor/EditorToolbar";
import { ElementInspector } from "./editor/ElementInspector";
import { FreeformCanvas } from "./editor/FreeformCanvas";
import { LayerPanel } from "./editor/LayerPanel";
import { reviewClassForElement, useEditorController } from "./editor/useEditorController";
import { contentTypeLabels, templateMeta } from "@/lib/data";
import { reindexSlide, sceneForSlide, syncLegacyFields } from "@/lib/editor/migrate";
import { updateElement } from "@/lib/editor/operations";
import type { CanvasElement, CanvasScene, ImageElement, ShapeElement, TextElement } from "@/lib/editor/scene";
import { classifyOfficialUrl } from "@/lib/evidence/official";
import { openWorkspaceRepository } from "@/lib/workspace/indexed-db";
import { migrateProjectScenes, postToProject, projectToPost } from "@/lib/workspace/project";
import { deriveProjectStatus, invalidateReview, isSensitiveProject, updateReview } from "@/lib/workspace/status";
import { exportProject } from "@/lib/workspace/transfer";
import type { ContentType, GeneratedPost, GenerateOptions, ImageAsset, Slide, SourceEvidence, TemplateId } from "@/lib/types";
import type { ReviewState, WorkspaceProject } from "@/lib/workspace/types";
import { generationConnectionCopy } from "@/lib/ui-copy";

const sampleTopic = "수능 끝나고 바로 할 것 5가지";
const emptyScene: CanvasScene = { version: 1, width: 1080, height: 1350, elements: [] };

function collectImageSources(slides: Slide[]) {
  return slides.flatMap((slide) => slide.canvas?.elements.flatMap((element) => element.type === "image" ? [element.asset] : []) ?? (slide.image ? [slide.image] : []))
    .filter((asset, index, all) => all.findIndex((candidate) => candidate.url === asset.url) === index);
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return <div className="field-label"><b>{children}</b>{hint && <span>{hint}</span>}</div>;
}

export function GeneratorWorkspace() {
  const params = useSearchParams();
  const [topic, setTopic] = useState(sampleTopic);
  const [contentType, setContentType] = useState<ContentType>("info");
  const [template, setTemplate] = useState<TemplateId>("A");
  const [slideCount, setSlideCount] = useState<GenerateOptions["slideCount"]>("auto");
  const [imageMode, setImageMode] = useState<GenerateOptions["imageMode"]>("auto");
  const [post, setPost] = useState<GeneratedPost | null>(null);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<"demo" | "gemini" | null>(null);
  const [geminiConnected, setGeminiConnected] = useState(false);
  const [review, setReview] = useState<ReviewState>({ copy: false, sources: false, images: false });
  const [evidence, setEvidence] = useState<SourceEvidence[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<"properties" | "layers" | "post">("properties");
  const editPanelBodyRef = useRef<HTMLDivElement>(null);

  const activeScene = useMemo(() => post ? sceneForSlide(post.slides[selected] ?? post.slides[0], post.template) : emptyScene, [post, selected]);
  const commitScene = useCallback((canvas: CanvasScene, reason: "copy" | "images") => {
    setPost((current) => {
      if (!current || !current.slides[selected]) return current;
      const slides = current.slides.map((slide, index) => index === selected ? syncLegacyFields(slide, canvas) : slide);
      return { ...current, slides, imageSources: collectImageSources(slides) };
    });
    setReview((current) => ({ ...current, [reason]: false }));
  }, [selected]);
  const editor = useEditorController(activeScene, commitScene);
  const [connectionLabel, connectionDetail] = generationConnectionCopy(geminiConnected);

  useEffect(() => {
    editPanelBodyRef.current?.scrollTo({ top: 0 });
  }, [panelTab, selected, editor.state.selectedId]);

  useEffect(() => {
    const incoming = params.get("topic");
    const type = params.get("type") as ContentType | null;
    if (incoming) setTopic(incoming);
    if (type && Object.keys(contentTypeLabels).includes(type)) setContentType(type);
  }, [params]);

  useEffect(() => {
    const id = params.get("project"); if (!id) return;
    void openWorkspaceRepository().then((repo) => repo.getProject(id)).then((project) => { if (!project) { setNotice("요청한 프로젝트를 이 브라우저에서 찾지 못했습니다."); return; } const migrated = migrateProjectScenes(project); setPost(projectToPost(migrated.project)); setTopic(project.topic); setContentType(project.contentType); setTemplate(project.template); setReview(project.review); setEvidence(project.evidence); setSelected(0); setMode("demo"); if (migrated.notices.length) setNotice(migrated.notices.join(" ")); }).catch(() => setNotice("로컬 프로젝트를 열지 못했습니다."));
  }, [params]);

  useEffect(() => {
    fetch("/api/status").then((response) => response.json()).then((data) => setGeminiConnected(Boolean(data.geminiConnected))).catch(() => setGeminiConnected(false));
  }, []);

  const sourceLinks = useMemo(() => (params.get("sources") || "").split("|").filter((link) => { try { return ["https:", "http:"].includes(new URL(link).protocol); } catch { return false; } }), [params]);
  const verified = useMemo(() => {
    return params.get("verified") === "1" && sourceLinks.some((link) => classifyOfficialUrl(link).official);
  }, [params, sourceLinks]);
  const sensitive = useMemo(() => contentType === "breaking" || /입시|정시|논술|규정|일정|준비물|합격/.test(topic), [contentType, topic]);

  async function generate() {
    setLoading(true); setNotice(null);
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, contentType, template, slideCount, imageMode, officialSourceAvailable: verified, sourceLinks }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "생성하지 못했습니다.");
      setPost(data.post); setMode(data.mode); setSelected(0); setReview({ copy: false, sources: false, images: false });
      setEvidence((data.evidence ?? []).map((item: { title: string; url: string; official: boolean }) => ({ label: item.title, url: item.url, kind: item.official ? "official" : "article" })));
    } catch (error) { setNotice(error instanceof Error ? error.message : "생성하지 못했습니다."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!post) return;
    const timer = window.setTimeout(async () => { try { const repo = await openWorkspaceRepository(); const existing = await repo.getProject(post.id); const project = postToProject(post, evidence, existing ?? undefined); project.review = review; project.status = deriveProjectStatus(project); await repo.saveProject(project); setSavedAt(new Date().toISOString()); } catch { setNotice("자동 저장에 실패했습니다. .chak 파일로 백업해주세요."); } }, 650);
    return () => window.clearTimeout(timer);
  }, [post, review, evidence]);

  async function regenerateSlide() {
    if (!post) return;
    setLoading(true); setNotice(null);
    try {
      const response = await fetch("/api/generate/slide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ options: { topic: post.topic, contentType: post.contentType, template: post.template, slideCount: post.slides.length, imageMode }, index: selected, current: post.slides[selected], sourceLinks: post.sourceLinks }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "카드를 재생성하지 못했습니다.");
      const replacement = { ...data.slide, index: selected + 1, image: post.slides[selected].image, canvas: undefined } as Slide;
      const nextSlide = syncLegacyFields(replacement, sceneForSlide(replacement, post.template));
      const slides = post.slides.map((item, index) => index === selected ? nextSlide : item);
      setPost({ ...post, slides, imageSources: collectImageSources(slides) });
      setReview((current) => ({ ...current, copy: false }));
      setNotice(`${selected + 1}번 카드 문구를 다시 만들었어요.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "카드 재생성 실패"); }
    finally { setLoading(false); }
  }

  async function downloadSlide(index = selected) {
    if (!post) return;
    setNotice("PNG를 렌더링하고 있어요…");
    try {
      const response = await fetch("/api/render", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slide: post.slides[index], template: post.template, total: post.slides.length }) });
      if (!response.ok) throw new Error("PNG 렌더링에 실패했습니다.");
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `CHAK-${String(index + 1).padStart(2, "0")}.png`; anchor.click(); URL.revokeObjectURL(url);
      setNotice(`${index + 1}번 카드를 다운로드했어요.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "다운로드 실패"); }
  }

  async function downloadZip() { if (!post) return; setNotice("전체 PNG ZIP을 만들고 있어요…"); try { const response = await fetch("/api/render/zip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slides: post.slides, template: post.template }) }); const data = response.ok ? await response.blob() : await response.json(); if (!response.ok) throw new Error(data.error || "ZIP 생성 실패"); downloadBlob(data as Blob, `CHAK-${post.id}.zip`); setNotice("전체 카드 ZIP을 다운로드했어요."); } catch (error) { setNotice(error instanceof Error ? error.message : "ZIP 생성 실패"); } }
  function downloadBlob(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function currentProject(): WorkspaceProject | null { if (!post) return null; const project = postToProject(post, evidence); project.review = review; project.status = deriveProjectStatus(project); return project; }
  function downloadProject() { const project = currentProject(); if (!project) return; downloadBlob(new Blob([exportProject(project)], { type: "application/json" }), `${project.title.replace(/[^가-힣\w-]+/g, "-")}.chak`); }
  async function deliver() { const project = currentProject(); if (!project) return; try { const response = await fetch("/api/integrations/n8n", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(project) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setNotice("n8n 워크플로로 전달했습니다."); } catch (error) { setNotice(error instanceof Error ? error.message : "전달 실패"); } }
  function changeReview(patch: Partial<ReviewState>) { if (!post) return; const project = updateReview({ ...postToProject(post, evidence), review }, patch); setReview(project.review); setPost({ ...post, status: project.status }); }

  async function archive() {
    if (!post) return;
    try { const project = currentProject(); if (!project) return; await (await openWorkspaceRepository()).saveProject(project); setSavedAt(new Date().toISOString()); setNotice("이 브라우저의 Archive에 저장했어요."); } catch { setNotice("저장에 실패했습니다. .chak 파일로 백업해주세요."); }
  }

  function addCanvasText() {
    const id = `text-${Date.now()}`;
    const element: TextElement = { id, type: "text", x: 180, y: 280, width: 720, height: 180, rotation: 0, opacity: 1, locked: false, visible: true, content: "새 텍스트", fontFamily: "Pretendard, Noto Sans KR, sans-serif", fontSize: 72, fontWeight: 700, lineHeight: 1.15, letterSpacing: -1, align: "left", color: "#1e1b18", background: "transparent", padding: 0 };
    editor.add(element);
    setPanelTab("properties");
  }

  function addCanvasShape(shape: ShapeElement["shape"]) {
    const id = `shape-${Date.now()}`;
    editor.add({ id, type: "shape", shape, x: 250, y: 350, width: 420, height: 260, rotation: 0, opacity: 1, locked: false, visible: true, fill: "#ffc21a", stroke: "transparent", strokeWidth: 0, cornerRadius: shape === "rectangle" ? 24 : 0 });
    setPanelTab("properties");
  }

  function uploadCanvasImage(file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setNotice("PNG, JPEG, WebP 이미지를 선택하세요."); return; }
    if (file.size > 8 * 1024 * 1024) { setNotice("이미지는 8MB 이하만 업로드할 수 있어요."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const asset: ImageAsset = { url: String(reader.result), source: "upload", sourcePage: "팀 업로드", licenseStatus: "safe", usableForPublish: true, query: file.name };
      if (editor.selectedElement?.type === "image") editor.updateSelected({ asset } as Partial<ImageElement>);
      else editor.add({ id: `image-${Date.now()}`, type: "image", x: 140, y: 250, width: 800, height: 520, rotation: 0, opacity: 1, locked: false, visible: true, asset, fit: "cover", cropScale: 1, cropOffsetX: 0, cropOffsetY: 0, cornerRadius: 24 });
      setPanelTab("properties");
    };
    reader.readAsDataURL(file);
  }

  function changeLayer(id: string, patch: Partial<CanvasElement>) {
    const element = editor.state.scene.elements.find((item) => item.id === id);
    if (!element) return;
    editor.commitScene(updateElement(editor.state.scene, id, patch), reviewClassForElement(element), id);
  }

  function duplicateSlide(index: number) {
    if (!post) return;
    const duplicate = structuredClone(post.slides[index]);
    const slides = [...post.slides]; slides.splice(index + 1, 0, duplicate);
    const normalized = slides.map((slide, position) => reindexSlide(slide, position + 1));
    setPost({ ...post, slides: normalized, imageSources: collectImageSources(normalized) });
    setSelected(index + 1);
    setReview((current) => ({ ...current, copy: false, images: false }));
  }

  function deleteSlide(index: number) {
    if (!post || post.slides.length <= 1) return;
    const slides = post.slides.filter((_, position) => position !== index).map((slide, position) => reindexSlide(slide, position + 1));
    setPost({ ...post, slides, imageSources: collectImageSources(slides) }); setSelected(Math.min(index, slides.length - 1)); setReview((current) => ({ ...current, copy: false }));
  }

  function moveSlide(index: number, delta: -1 | 1) {
    if (!post) return;
    const target = index + delta; if (target < 0 || target >= post.slides.length) return;
    const slides = [...post.slides]; [slides[index], slides[target]] = [slides[target], slides[index]];
    const normalized = slides.map((slide, position) => reindexSlide(slide, position + 1));
    setPost({ ...post, slides: normalized, imageSources: collectImageSources(normalized) }); setSelected(target);
  }

  if (post) {
    const slide = post.slides[selected];
    return (
      <div className="generator-result">
        <div className="result-topbar">
          <button className="text-button" onClick={() => setPost(null)}><ChevronLeft size={17} /> 설정으로</button>
          <div><strong>{post.title}</strong><span>{mode === "gemini" ? "연결 생성" : "빠른 초안"} · {post.slides.length}장 · {savedAt ? "자동 저장됨" : "저장 중"}</span></div>
          <div className="result-actions"><button className="secondary-button" onClick={() => void archive()}><Save size={16} /> 지금 저장</button></div>
        </div>
        {notice && <div className="toast" role="status">{notice}</div>}
        <div className="editor-layout">
          <aside className="slide-rail" aria-label="카드 목록">
            {post.slides.map((item, index) => <div key={`${item.index}-${index}`} className="slide-item"><button className={selected === index ? "slide-thumb selected" : "slide-thumb"} onClick={() => setSelected(index)}><span>{index + 1}</span><CardCanvas slide={item} template={post.template} total={post.slides.length} compact /></button><div className="slide-actions"><button aria-label={`${index + 1}번 카드 위로`} disabled={index === 0} onClick={() => moveSlide(index, -1)}><ArrowUp size={12} /></button><button aria-label={`${index + 1}번 카드 아래로`} disabled={index === post.slides.length - 1} onClick={() => moveSlide(index, 1)}><ArrowDown size={12} /></button><button aria-label={`${index + 1}번 카드 복제`} onClick={() => duplicateSlide(index)}><Copy size={12} /></button><button aria-label={`${index + 1}번 카드 삭제`} disabled={post.slides.length <= 1} onClick={() => deleteSlide(index)}><Trash2 size={12} /></button></div></div>)}
          </aside>
          <section className="freeform-center">
            <EditorToolbar zoom={editor.state.zoom} canUndo={editor.canUndo} canRedo={editor.canRedo} onAddText={addCanvasText} onAddImage={uploadCanvasImage} onAddShape={addCanvasShape} onUndo={editor.undo} onRedo={editor.redo} onZoom={(value) => editor.dispatch({ type: "zoom", value })} />
            <FreeformCanvas scene={editor.state.scene} selectedId={editor.state.selectedId} editingTextId={editor.state.editingTextId} zoom={editor.state.zoom} pan={editor.state.pan} dispatch={(action) => { if ((action.type === "select" || action.type === "editText") && action.id) setPanelTab("properties"); editor.dispatch(action); }} onCommit={editor.commitScene} />
          </section>
          <aside className="edit-panel">
            <div className="edit-heading"><div><b>{selected + 1}번 카드</b><span>{slide.type} · {slide.layoutVariant}</span></div><button title="이 카드 재생성" aria-label="이 카드 재생성" disabled={loading} onClick={regenerateSlide}>{loading ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />}</button></div>
            <div className="editor-panel-tabs" role="tablist" aria-label="편집 패널">
              <button role="tab" aria-selected={panelTab === "properties"} onClick={() => setPanelTab("properties")}><SlidersHorizontal size={15} />속성</button>
              <button role="tab" aria-selected={panelTab === "layers"} onClick={() => setPanelTab("layers")}><Layers3 size={15} />레이어</button>
              <button role="tab" aria-selected={panelTab === "post"} onClick={() => setPanelTab("post")}><Send size={15} />게시</button>
            </div>
            <div className="editor-panel-body" ref={editPanelBodyRef}>
              {panelTab === "properties" && <ElementInspector element={editor.selectedElement} onChange={editor.updateSelected} onDuplicate={() => editor.dispatch({ type: "duplicate" })} onDelete={() => editor.dispatch({ type: "delete" })} onUpload={uploadCanvasImage} />}
              {panelTab === "layers" && <LayerPanel elements={editor.state.scene.elements} selectedId={editor.state.selectedId} onSelect={(id) => { editor.dispatch({ type: "select", id }); setPanelTab("properties"); }} onChange={changeLayer} onReorder={editor.reorder} />}
              {panelTab === "post" && <><CaptionEditor post={post} onChange={(patch) => { setPost({ ...post, ...patch }); setReview((current) => ({ ...current, copy: false })); }} /><ReviewChecklist review={review} officialRequired={isSensitiveProject(postToProject(post, evidence))} officialAvailable={post.officialSourceAvailable} onChange={changeReview} /><ExportActions ready={currentProject()?.status === "ready"} onPng={() => void downloadSlide()} onZip={() => void downloadZip()} onProject={downloadProject} onDeliver={() => void deliver()} />{sensitive && <div className={post.officialSourceAvailable ? "safety-note safe" : "safety-note"}>{post.officialSourceAvailable ? <Check size={18} /> : <ShieldAlert size={18} />}<div><b>{post.officialSourceAvailable ? "공식 출처 확인" : "게시 전 검증 필요"}</b><p>{post.officialSourceAvailable ? "아래 원문을 게시 직전에 다시 확인하세요." : "공식 출처가 연결되지 않아 게시 준비 상태로 전환할 수 없습니다."}</p>{post.sourceLinks.length > 0 && <div className="source-link-list">{post.sourceLinks.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer">{new URL(link).hostname}</a>)}</div>}</div></div>}</>}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="page generate-page">
      <header className="page-header"><div><h1>카드뉴스 만들기</h1><p>주제와 형식만 정하면 문구·구조·검색어를 한 번에 초안으로 만듭니다.</p></div><span className="model-badge"><Sparkles size={15} /> Gemini Flash-Lite</span></header>
      {notice && <div className="error-banner" role="alert">{notice}</div>}
      <div className="generate-layout">
        <section className="generate-form">
          <label><FieldLabel hint="직접 입력하거나 Radar에서 선택">주제</FieldLabel><textarea className="topic-input" value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} placeholder="예: 수능 끝나고 바로 할 것 5가지" /></label>
          <div><FieldLabel>콘텐츠 유형</FieldLabel><div className="choice-grid four">{(Object.entries(contentTypeLabels) as [ContentType, string][]).map(([value, label]) => <button key={value} aria-pressed={contentType === value} className={contentType === value ? "choice active" : "choice"} onClick={() => setContentType(value)}><span>{contentType === value && <Check size={14} />}</span><b>{label}</b><small>{value === "info" ? "정확한 정보 전달" : value === "viral" ? "공감과 공유 중심" : value === "curation" ? "저장용 리스트" : "변경사항과 행동"}</small></button>)}</div></div>
          <div><FieldLabel hint="생성 후 모든 요소를 자유롭게 편집할 수 있어요">시작 템플릿</FieldLabel><div className="template-grid">{(Object.entries(templateMeta) as [TemplateId, typeof templateMeta.A][]).map(([value, meta]) => <button key={value} aria-pressed={template === value} className={template === value ? "template-choice active" : "template-choice"} onClick={() => setTemplate(value)}><i className={`template-swatch swatch-${value.toLowerCase()}`}><span /><b>Aa</b></i><span><b>{meta.name}</b><small>{meta.label} · {meta.description}</small></span></button>)}</div></div>
          <div className="option-row"><div><FieldLabel>장수</FieldLabel><div className="compact-choices">{(["auto", 4, 5, 6, 7, 8] as const).map((value) => <button key={value} aria-pressed={slideCount === value} className={slideCount === value ? "active" : ""} onClick={() => setSlideCount(value)}>{value === "auto" ? "자동" : value}</button>)}</div></div><div><FieldLabel>이미지 사용</FieldLabel><div className="compact-choices">{(["auto", "minimal", "photo"] as const).map((value) => <button key={value} aria-pressed={imageMode === value} className={imageMode === value ? "active" : ""} onClick={() => setImageMode(value)}>{value === "auto" ? "자동" : value === "minimal" ? "최소" : "사진 중심"}</button>)}</div></div></div>
          {sensitive && <div className={verified ? "safety-note safe" : "safety-note"}>{verified ? <Check size={18} /> : <ShieldAlert size={18} />}<div><b>{verified ? "공식 출처가 연결됐어요" : "공식 출처 검증이 필요해요"}</b><p>{verified ? "생성 후에도 원문 링크와 날짜를 다시 확인하세요." : "카드 생성은 가능하지만 게시 준비 상태로 전환되지 않습니다."}</p>{sourceLinks.length > 0 && <div className="source-link-list">{sourceLinks.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer">{new URL(link).hostname}</a>)}</div>}</div></div>}
          <button className="generate-button" disabled={loading || !topic.trim()} onClick={generate}>{loading ? <><LoaderCircle className="spin" /> 초안을 만들고 있어요…</> : <><WandSparkles /> 카드뉴스 생성</>}<span>문구 · 구조 · 이미지 검색어</span></button>
        </section>
        <aside className="generation-guide">
          <div className="guide-preview"><CardCanvas template={template} slide={{ index: 1, type: "cover", headline: topic || sampleTopic, subtext: contentTypeLabels[contentType], body: "", imageQueryKo: "한국 고등학생", imageQueryEn: "Korean high school student", imageRequired: imageMode !== "minimal", layoutVariant: template === "C" ? "number_large" : template === "B" ? "photo_top" : "text_only" }} compact /></div>
          <h2>생성 원칙</h2>
          <ol><li><span>1</span><div><b>짧게</b><p>헤드라인 28자, 본문 80자 안에서 정리해요.</p></div></li><li><span>2</span><div><b>한국 맥락으로</b><p>한국 학생·교실·거리 중심 검색어를 만들어요.</p></div></li><li><span>3</span><div><b>출처와 함께</b><p>민감한 정보는 공식 출처 없이는 게시할 수 없어요.</p></div></li></ol>
          <div id="settings" className={geminiConnected ? "api-status connected" : "api-status"}><span /><div><b>{connectionLabel}</b><p>{connectionDetail}</p></div></div>
        </aside>
      </div>
    </div>
  );
}
