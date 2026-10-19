# CHAK Freeform Card Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn CHAK's generated cards into a fully layer-based freeform editor whose autosaved preview, PNG, and ZIP output remain pixel-consistent.

**Architecture:** A versioned scene graph becomes the canonical slide representation. Legacy generated fields deterministically migrate into text, image, and shape layers; a shared SVG renderer consumes the scene for both browser preview and server export. Focused React components own canvas interaction, history, toolbars, and inspectors while the existing workspace owns generation, evidence, review, and persistence.

**Tech Stack:** Next.js 16, React, TypeScript, Pointer Events, SVG, IndexedDB, Sharp, Node test runner with tsx, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-19-freeform-card-editor-design.md`

## Global Constraints

- Stage coordinates are always 1080×1350 and persisted as finite pixel values.
- Preview, PNG, and ZIP consume the same scene graph and SVG renderer.
- Existing projects without scene data must reopen without losing copy or images.
- Autosave occurs after committed interactions, not every pointer move.
- Text/image/source changes invalidate their corresponding review check.
- Browser-safe Korean-capable font stacks only; custom font upload is out of scope.
- The UI must not use implementation-facing phrases such as “더미 데이터 없음”, “실제 응답”, or “AI 생성”.

## Review Focus

- Malformed or extreme geometry must be clamped or rejected without breaking the project; Task 1 tests NaN, infinity, and bounds.
- A long edit session must not grow history without limit; Task 2 tests the history cap and redo invalidation.
- Pointer scaling at non-100% zoom must still commit correct stage coordinates; Task 4 tests coordinate conversion.
- Large or deeply nested imported scenes must fail before overwriting stored data; Task 5 tests element and file limits.
- Korean text, emoji, XML characters, and cropped uploaded images must render identically in preview and export; Task 3 tests the canonical SVG.

---

### Task 1: Versioned scene model, validation, and legacy migration

**Files:**
- Create: `lib/editor/scene.ts`
- Create: `lib/editor/migrate.ts`
- Modify: `lib/types.ts`
- Modify: `lib/workspace/transfer.ts`
- Test: `tests/editor-scene.test.ts`
- Test: `tests/editor-migrate.test.ts`

**Interfaces:**
- Produces: `CanvasScene`, `CanvasElement`, `TextElement`, `ImageElement`, `ShapeElement`, `validateScene(value)`, `sceneForSlide(slide, template)`, `syncLegacyFields(slide, scene)`.
- Consumes: existing `Slide`, `ImageAsset`, and `TemplateId`.

- [ ] Write failing tests for stable element IDs, valid default scenes, NaN/infinity rejection, clamped geometry with intentional edge bleed, 100-element limits, safe typography/crop ranges, and image MIME/8MB limits.
- [ ] Run `npm test -- tests/editor-scene.test.ts tests/editor-migrate.test.ts`; expect missing-module failures.
- [ ] Implement the scene types and validator with stage size 1080×1350, font size 8–240, opacity 0–1, at most 100 elements, PNG/JPEG/WebP assets up to 8MB, and safe remote-image hosts.
- [ ] Implement deterministic migration for templates A–D and synchronization of semantic headline/subtext/body/image roles back to legacy fields.
- [ ] Extend `.chak` validation to accept legacy projects and validate version-1 scenes before returning imported data.
- [ ] Run focused tests, full `npm test`, and `npm run typecheck`; expect all to pass.
- [ ] Commit with `feat: add versioned card scene model`.

### Task 2: Layer operations, snapping, and bounded history

**Files:**
- Create: `lib/editor/operations.ts`
- Create: `lib/editor/history.ts`
- Create: `lib/editor/geometry.ts`
- Test: `tests/editor-operations.test.ts`
- Test: `tests/editor-history.test.ts`
- Test: `tests/editor-geometry.test.ts`

**Interfaces:**
- Produces: `addElement`, `updateElement`, `duplicateElement`, `deleteElement`, `reorderElement`, `moveElement`, `resizeElement`, `snapElement`, `stagePointFromClient`, and `createSceneHistory(initial, limit = 50)`.
- Consumes: Task 1 `CanvasScene` and element unions.

- [ ] Write failing tests for add/duplicate/delete/reorder/lock behavior, crop-safe resizing, 4px snapping, zoom coordinate conversion, undo/redo, redo clearing, and the 50-entry cap.
- [ ] Run focused tests and verify named missing interfaces.
- [ ] Implement immutable scene operations and pure geometry helpers.
- [ ] Implement bounded commit-based history with `present`, `undo()`, `redo()`, `commit(scene)`, `canUndo`, and `canRedo`.
- [ ] Run focused tests and full `npm test`; expect all to pass.
- [ ] Commit with `feat: add freeform editor operations`.

### Task 3: Canonical scene SVG renderer

**Files:**
- Modify: `lib/render/card-svg.ts`
- Modify: `lib/render/png.ts`
- Modify: `components/CardCanvas.tsx`
- Test: `tests/card-svg.test.ts`
- Create: `tests/scene-svg.test.ts`

**Interfaces:**
- Produces: `renderSceneSvg(scene, options)`, with `renderCardSvg(slide, template, total)` delegating through `sceneForSlide`.
- Consumes: Task 1 scene model and migration.

- [ ] Write failing tests for z-order, transforms, text alignment, Korean/emoji/XML escaping, line height, opacity, shape styling, image crop clips, and deterministic output.
- [ ] Run focused tests and verify failures identify missing scene rendering.
- [ ] Implement renderers for text, image, rectangle, and ellipse layers with deterministic clip IDs.
- [ ] Keep the browser preview and Sharp PNG/ZIP paths on the same generated SVG.
- [ ] Run focused tests, full tests, and typecheck; expect all to pass.
- [ ] Commit with `feat: render editable card scenes`.

### Task 4: Direct-manipulation canvas and editor controls

**Files:**
- Create: `components/editor/FreeformCanvas.tsx`
- Create: `components/editor/EditorToolbar.tsx`
- Create: `components/editor/LayerPanel.tsx`
- Create: `components/editor/ElementInspector.tsx`
- Create: `components/editor/TextInspector.tsx`
- Create: `components/editor/ImageInspector.tsx`
- Create: `components/editor/ShapeInspector.tsx`
- Create: `components/editor/useEditorController.ts`
- Modify: `components/GeneratorWorkspace.tsx`
- Modify: `app/globals.css`
- Test: `tests/editor-controller.test.ts`

**Interfaces:**
- Produces: freeform select/drag/resize/rotate, keyboard shortcuts, add text/image/shape, duplicate/delete, layer ordering/locking/visibility, zoom, alignment guides, inspectors, and committed-change callbacks.
- Consumes: Tasks 1–3 scene, operations, history, and renderer contracts.

- [ ] Write failing controller tests for selection, scaled pointer deltas, viewport pan, keyboard movement, duplicate/delete/copy/paste shortcuts, double-click text editing, locked elements, committed autosave callbacks, and review invalidation classification.
- [ ] Run focused tests and verify failures.
- [ ] Implement `useEditorController` as the only owner of transient selection, pointer transaction, history, clipboard, zoom, and viewport-pan state.
- [ ] Implement the SVG artboard overlay with pointer capture, eight resize handles, rotation handle, and 4px snapping guides.
- [ ] Implement toolbar, slide rail, layer panel, and type-specific inspector components with explicit accessible labels and finite numeric controls; support slide duplicate, delete, and reorder.
- [ ] Replace fixed layout selection in `GeneratorWorkspace` with the new editor while retaining caption, evidence, review, and export sections.
- [ ] Add desktop-first responsive styling and mobile coarse manipulation without hiding property controls.
- [ ] Run focused tests, full tests, and typecheck; expect all to pass.
- [ ] Commit with `feat: add freeform canvas editor`.

### Task 5: Project migration, persistence, review invalidation, and clean copy

**Files:**
- Modify: `lib/workspace/project.ts`
- Modify: `lib/workspace/status.ts`
- Modify: `lib/workspace/transfer.ts`
- Modify: `app/radar/page.tsx`
- Modify: `components/AppShell.tsx`
- Modify: `components/GeneratorWorkspace.tsx`
- Modify: `README.md`
- Test: `tests/workspace-transfer.test.ts`
- Create: `tests/editor-persistence.test.ts`
- Create: `tests/ui-copy.test.ts`

**Interfaces:**
- Produces: legacy-on-read migration, scene autosave/reopen, semantic review invalidation, and direct editorial UI copy.
- Consumes: Tasks 1–4 scene and committed-change contracts.

- [ ] Write failing tests for exact scene round trips, legacy reopen, malformed/oversized scenes, text/image/source invalidation, persistence failure preserving the last committed scene, safe-default migration notices, and forbidden implementation-facing UI phrases.
- [ ] Run focused tests and verify failures.
- [ ] Migrate scenes at project load and persist only committed changes through the existing 650ms debounce; keep the last committed scene and show a non-blocking notice if migration or persistence fails.
- [ ] Route committed changes to copy, image, or source review invalidation without changing unrelated checks.
- [ ] Rewrite Radar, shell, generation, status, empty-state, and documentation copy in concise editorial Korean.
- [ ] Run focused tests, full tests, and typecheck; expect all to pass.
- [ ] Commit with `feat: persist freeform edits and refine product copy`.

### Task 6: End-to-end and visual verification

**Files:**
- Modify: `tests/e2e/workflow.spec.ts`
- Create: `tests/e2e/editor.spec.ts`
- Modify: `DESIGN.md`

**Interfaces:**
- Produces: regression coverage and documented editor interaction rules.
- Consumes: all prior tasks.

- [ ] Extend browser tests for add text/image/shape, double-click text editing, drag, resize, rotate, pan/zoom, copy/paste, style, layer reorder, slide reorder, lock/hide, undo/redo, autosave, exact reopen, PNG/ZIP, and legacy migration.
- [ ] Add mobile tests for slide navigation, selection, numeric position editing, typography, image upload state, and no horizontal page overflow.
- [ ] Run the Impeccable detector once across changed UI files and resolve blocking findings.
- [ ] Run one bounded desktop/mobile screenshot inspection, fix defects in one batch, and confirm in at most one additional pass.
- [ ] Update `DESIGN.md` with the scene canvas, inspector, toolbar, layer, focus, and responsive rules actually shipped.
- [ ] Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run test:e2e`; expect all commands to pass without console errors.
- [ ] Commit with `test: verify freeform card editor`.
