# CHAK Local-First Production Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every prototype-only CHAK workflow with a truthful, persistent local-first implementation from real evidence collection through review, export, and optional delivery.

**Architecture:** Browser-owned IndexedDB stores projects, uploaded assets, Radar history, and preferences behind a repository interface. Stateless Next.js routes own credentials, collection, source extraction, Gemini generation, rendering, integration health, and n8n delivery. Shared pure domain modules enforce evidence scoring, official-source classification, status transitions, import/export validation, and canonical SVG output.

**Tech Stack:** Next.js 16, React, TypeScript, IndexedDB, Zod, Sharp, JSZip, Node test runner with tsx, Playwright-compatible browser QA.

**Spec:** `docs/superpowers/specs/2026-10-19-local-first-production-workflow-design.md`

## Global Constraints

- No user account or cloud database is required; durable project data stays in the current browser profile.
- Server routes remain stateless and keep all external credentials out of the browser bundle.
- No unsupported or unavailable social signal may be synthesized.
- Engagement is nullable when no real public metric exists.
- Sensitive content cannot become `ready` without official evidence and all applicable review checks.
- Preview and PNG export consume the same canonical SVG renderer.
- Every enabled action must have an observable persistent result; every disabled action must explain why.

## Review Focus

- Corrupt or quota-exhausted IndexedDB must preserve existing projects and surface recovery/export guidance; Task 2 tests repository failures.
- Malicious or private-network evidence URLs must never be fetched; Task 4 tests SSRF rejection, redirect limits, and partial extraction.
- Generated output with the wrong slide count or unrecognized evidence IDs must be normalized or rejected; Task 4 tests both.
- Editing reviewed copy or imagery must invalidate the correct checks and readiness state; Tasks 2 and 6 test status transitions.
- Large uploaded images and imported `.chak` files must be size-bounded and fail without overwriting data; Tasks 2, 5, and 7 test these limits.

---

### Task 1: Truthful evidence, scoring, and format analysis

**Files:**
- Create: `lib/evidence/official.ts`
- Create: `lib/radar/scoring.ts`
- Create: `lib/radar/formats.ts`
- Modify: `lib/types.ts`
- Modify: `lib/radar/analyze.ts`
- Modify: `lib/radar/collectors/naver.ts`
- Test: `tests/evidence-official.test.ts`
- Test: `tests/radar-scoring.test.ts`
- Test: `tests/radar-formats.test.ts`

**Interfaces:**
- Produces: `classifyOfficialUrl(url): OfficialClassification`, `scoreRadarSignals(signals, now): RadarScores`, `buildFormatPatterns(signals, previous): RadarItem[]`.
- Consumes: existing `RadarSignal` and source evidence metadata.

- [ ] Write failing tests proving official education domains are centralized, missing metrics yield `engagementScore: null`, trends compare like-for-like observations, and a format pattern requires two actual items.
- [ ] Run `npm test -- tests/evidence-official.test.ts tests/radar-scoring.test.ts tests/radar-formats.test.ts` and verify failures name the missing interfaces.
- [ ] Implement the three pure modules and update types/analyzer/collectors to consume them.
- [ ] Run the focused tests and then `npm test`; expect all tests to pass.
- [ ] Commit with `feat: add truthful radar evidence analysis`.

### Task 2: IndexedDB repository, project lifecycle, and `.chak` schema

**Files:**
- Create: `lib/workspace/types.ts`
- Create: `lib/workspace/status.ts`
- Create: `lib/workspace/repository.ts`
- Create: `lib/workspace/indexed-db.ts`
- Create: `lib/workspace/memory.ts`
- Create: `lib/workspace/transfer.ts`
- Modify: `lib/types.ts`
- Test: `tests/workspace-status.test.ts`
- Test: `tests/workspace-transfer.test.ts`
- Test: `tests/workspace-memory.test.ts`

**Interfaces:**
- Produces: `WorkspaceRepository`, `openWorkspaceRepository()`, `deriveProjectStatus(project)`, `invalidateReview(project, reason)`, `exportProject(project)`, `importProject(text, existingIds)`.
- Consumes: Task 1 evidence and score types.

- [ ] Write failing tests for exact save/reopen, status gates, review invalidation, corrupt JSON, schema mismatch, duplicate IDs, oversize imports, and repository write failure preservation.
- [ ] Run the focused tests and verify the expected missing-module failures.
- [ ] Implement versioned project types, memory repository, IndexedDB adapter, lifecycle rules, and safe transfer format.
- [ ] Run focused tests and full `npm test`; expect all tests to pass.
- [ ] Commit with `feat: add local workspace persistence`.

### Task 3: Stateless Radar persistence and automatic refresh

**Files:**
- Modify: `lib/radar/pipeline.ts`
- Modify: `app/api/radar/route.ts`
- Modify: `app/api/radar/run/route.ts`
- Modify: `app/radar/page.tsx`
- Create: `lib/radar/client.ts`
- Create: `lib/config/watch-accounts.ts`
- Test: `tests/radar-client.test.ts`
- Test: `tests/watch-accounts.test.ts`

**Interfaces:**
- Produces: `mergeRadarSnapshot(previous, fresh)`, `isRadarRefreshDue(lastRunAt, interval, now)`, `parseWatchAccounts(yaml)`.
- Consumes: Task 1 analyzer and Task 2 repository.

- [ ] Write failing tests for snapshot preservation on provider failure, automatic-refresh intervals, and schema-based empty/populated watch lists.
- [ ] Run the focused tests and verify failures.
- [ ] Make collection routes stateless, store snapshots/history in IndexedDB, add off/30m/1h/3h refresh controls, and replace regex YAML parsing.
- [ ] Run focused tests and full `npm test`; expect all tests to pass.
- [ ] Commit with `feat: make radar local-first and refreshable`.

### Task 4: Safe source extraction and evidence-grounded generation

**Files:**
- Create: `lib/evidence/extract.ts`
- Create: `lib/generation/schema.ts`
- Create: `lib/generation/prompt.ts`
- Create: `lib/generation/normalize.ts`
- Modify: `lib/generation.ts`
- Modify: `app/api/generate/route.ts`
- Create: `app/api/generate/slide/route.ts`
- Modify: `app/api/status/route.ts`
- Test: `tests/evidence-extract.test.ts`
- Test: `tests/generation-prompt.test.ts`
- Test: `tests/generation-normalize.test.ts`

**Interfaces:**
- Produces: `extractEvidence(urls, fetcher)`, `buildGenerationPrompt(options, evidence)`, `normalizeGeneratedPost(raw, context)`, `regenerateSlide(context)`.
- Consumes: Task 1 evidence registry and Task 2 project types.

- [ ] Write failing tests for private URL rejection, response limits, partial extraction, evidence inclusion, exact slide count, allowed variants, unknown evidence IDs, and actual configured/verified health distinction.
- [ ] Run the focused tests and verify failures.
- [ ] Implement bounded source extraction, grounded prompt/schema normalization, exact one-slide route, and cached lightweight health verification.
- [ ] Run focused tests and full `npm test`; expect all tests to pass.
- [ ] Commit with `feat: ground generation in collected evidence`.

### Task 5: Canonical SVG rendering, PNG, and ZIP exports

**Files:**
- Create: `lib/render/card-svg.ts`
- Create: `lib/render/images.ts`
- Modify: `components/CardCanvas.tsx`
- Modify: `app/api/render/route.ts`
- Create: `app/api/render/zip/route.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `tests/card-svg.test.ts`
- Test: `tests/render-images.test.ts`

**Interfaces:**
- Produces: `renderCardSvg(slide, template, total)`, `normalizeRenderImage(image, fetcher)`, PNG route, ZIP route.
- Consumes: Task 2 project/asset types.

- [ ] Write failing tests for deterministic shared SVG, escaped text, template variant restrictions, unsafe remote hosts, oversized data images, ordered ZIP filenames, and failing-slide errors.
- [ ] Run focused tests and verify failures.
- [ ] Implement canonical renderer, switch browser preview to it, validate render payloads, and add JSZip-based complete export.
- [ ] Run focused tests and full `npm test`; expect all tests to pass.
- [ ] Commit with `feat: unify card preview and exports`.

### Task 6: Complete editor, review, imagery, autosave, and delivery UI

**Files:**
- Split: `components/GeneratorWorkspace.tsx`
- Create: `components/editor/CaptionEditor.tsx`
- Create: `components/editor/ImagePicker.tsx`
- Create: `components/editor/ReviewChecklist.tsx`
- Create: `components/editor/ExportActions.tsx`
- Create: `app/api/integrations/n8n/route.ts`
- Modify: `app/api/images/search/route.ts`
- Modify: `app/generate/page.tsx`
- Test: `tests/n8n-delivery.test.ts`
- Test: `tests/image-search.test.ts`

**Interfaces:**
- Produces: editor autosave, exact project loading via `?project=`, candidate selection, caption/hashtag editing, checklist transitions, PNG/ZIP/project export, ready-gated n8n delivery.
- Consumes: Tasks 2, 4, and 5 interfaces.

- [ ] Write failing route/domain tests for all image candidates, missing credential state, non-ready n8n rejection, configured delivery response, and edit-triggered checklist invalidation.
- [ ] Run focused tests and verify failures.
- [ ] Implement focused editor components, debounced repository autosave, candidate selection/removal, caption/hashtags, evidence references, readiness controls, exports, and explicit n8n delivery.
- [ ] Run focused tests, full `npm test`, and `npm run typecheck`; expect all to pass.
- [ ] Commit with `feat: complete card editor workflow`.

### Task 7: Exact Archive reopen, import, export, and recovery

**Files:**
- Modify: `app/archive/page.tsx`
- Create: `components/archive/ProjectImport.tsx`
- Create: `lib/workspace/hooks.ts`
- Test: `tests/archive-actions.test.ts`

**Interfaces:**
- Produces: repository-backed list/search/filter/delete/undo, exact reopen URL, safe `.chak` import conflict handling, explicit demo import.
- Consumes: Task 2 repository and transfer interfaces.

- [ ] Write failing tests for exact project reopen parameters, no automatic sample insertion, import conflict copy behavior, oversize rejection, and delete/undo persistence.
- [ ] Run focused tests and verify failures.
- [ ] Replace localStorage/archive seeding with repository hooks and implement import/export/recovery states.
- [ ] Run focused tests, full `npm test`, and `npm run typecheck`; expect all to pass.
- [ ] Commit with `feat: make archive restore exact projects`.

### Task 8: Integration documentation and end-to-end verification

**Files:**
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `PRODUCT.md`
- Modify: `tests/*` as required by integration findings
- Create: `tests/e2e/workflow.spec.ts`

**Interfaces:**
- Produces: accurate setup/status documentation and full workflow regression coverage.
- Consumes: all prior task interfaces.

- [ ] Add browser tests covering collect → generate → edit → autosave → review → ready → exact reopen → project export/import → PNG/ZIP, plus unavailable-provider states at desktop and mobile widths.
- [ ] Run browser tests and use systematic debugging for every unexpected failure.
- [ ] Update documentation to distinguish local-only storage, stateless server routes, credentials, supported/unsupported provider capabilities, and no closed-browser scheduling.
- [ ] Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run test:e2e`; expect all to pass with no console errors.
- [ ] Commit with `test: verify complete local-first workflow`.
