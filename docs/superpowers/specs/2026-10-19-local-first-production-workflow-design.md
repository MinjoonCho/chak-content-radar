# CHAK Local-First Production Workflow Design

**Date:** 2026-10-19
**Status:** Approved design, implementation pending

## 1. Purpose

Turn the current CHAK prototype into a truthful local-first internal tool. Every visible workflow must have a real implementation, while features that require unavailable external credentials must show an explicit unavailable state instead of fabricated results.

The completed workflow is:

1. Collect real topic and format signals.
2. Preserve individual evidence URLs and observed public metrics.
3. Generate source-grounded card-news copy.
4. Edit copy, caption, hashtags, layout, and imagery.
5. Review sources, factual copy, and image rights.
6. Save and reopen the exact project locally.
7. Export a project, individual PNGs, or all PNGs as a ZIP.
8. Optionally deliver an approved project to a configured n8n webhook.

## 2. Constraints and explicit non-goals

- No user account or shared cloud database is required.
- Projects and collection history are private to one browser profile and device.
- A purely static deployment cannot safely hold Gemini, Naver, YouTube, Meta, Pexels, or n8n secrets. Deployment therefore remains a Next.js application with server route handlers, while durable project data stays in the browser.
- Vercel or other serverless filesystems are not used as durable storage.
- Automatic synchronization between team members is not included. Team members exchange a `.chak` project file when needed.
- Unsupported or unavailable social data is never synthesized. In particular, Instagram hashtag discovery is shown as unsupported unless an official API available to the configured account provides it.
- Visual analysis of a reel is not claimed unless the application actually receives and analyzes media frames. Initial format analysis uses public metadata, captions, media type, account, timestamps, and observed metrics.

## 3. Architecture

### 3.1 Browser-owned durable state

Introduce a repository interface with two implementations:

- `IndexedDbWorkspaceRepository`: production browser storage.
- `MemoryWorkspaceRepository`: automated tests.

IndexedDB stores:

- card-news projects;
- review checklists and status transitions;
- uploaded image blobs;
- Radar snapshots and metric observations;
- automatic refresh preferences;
- last verified integration results.

Small UI preferences may remain in `localStorage`, but no card-news project or uploaded image is stored there.

### 3.2 Server-owned secret operations

Next.js route handlers keep all external credentials server-side and provide:

- content collection;
- safe source extraction;
- Gemini generation and single-slide regeneration;
- image-provider search and proxying;
- canonical SVG/PNG rendering;
- ZIP creation;
- integration health checks;
- n8n webhook delivery.

The routes are stateless. Radar history and projects are supplied by or returned to the browser repository.

### 3.3 Storage adapter boundary

The application consumes a `WorkspaceRepository` interface rather than IndexedDB directly. A future Supabase adapter can implement the same interface without changing pages or editor components.

## 4. Data model

### 4.1 Evidence

Each evidence record contains:

- stable ID;
- provider and source type;
- canonical or provider permalink;
- title, author, publication time, and collected time;
- official-source flag and verification reason;
- publicly observed metrics;
- extracted text excerpt and extraction status;
- content hash for deduplication.

The official flag is determined once by a shared registry and carried through Radar, generation, review, Archive, and export. Frontend and API routes must not maintain separate hard-coded host lists.

### 4.2 Scores

Radar exposes three independently named values:

- `engagementScore`: nullable; calculated only when real views, likes, or comments exist;
- `evidenceScore`: source count, provider diversity, and official-source coverage;
- `recencyScore`: publication recency.

When engagement metrics are unavailable, the UI says `반응 데이터 없음`; it does not derive a reaction score from recency or provider count.

Trend direction compares like-for-like observations between the current and preceding snapshot. A previous composite score is never compared with current raw engagement.

### 4.3 Format patterns

Format analysis records explainable patterns derived from actual signals:

- platform and media type;
- caption pattern: POV, checklist, question, myth/fact, before/after, reaction, ranking, or plain;
- repeated opening phrase or keyword;
- participating accounts and evidence count;
- median engagement and engagement-per-hour when metrics and timestamps exist;
- first seen, last seen, and change since the previous snapshot.

A pattern requires at least two independent evidence items. Every Format Radar item exposes those items. Unsupported signals are listed in provider status rather than represented as results.

### 4.4 Card-news project

A saved project contains:

- generated slides and exact edits;
- caption and hashtag groups;
- selected template and generation options;
- evidence bundle and per-slide evidence references;
- selected images and license metadata;
- review checklist;
- status history;
- schema version and timestamps.

Statuses are `draft`, `needs_review`, and `ready`.

## 5. Radar workflow

### 5.1 Collection

Google News RSS remains key-free. Naver, YouTube, Instagram, and Pexels operate only when their required credentials are configured. Collection responses report `ok`, `unavailable`, or `error` with a human-readable reason.

The browser sends the preceding Radar summary with a collection request so the stateless server can calculate changes. The returned snapshot is stored in IndexedDB. No route writes a deployment-local JSON file in production.

### 5.2 Automatic refresh

Users may choose off, 30 minutes, 1 hour, or 3 hours. While the Radar page is open, it refreshes only when the saved snapshot is older than the selected interval. Closing the browser stops refresh; the UI states this limitation explicitly.

### 5.3 Provider configuration

Provider status distinguishes:

- implemented and working;
- implemented but credentials or watch accounts missing;
- unsupported by the official API;
- request failure.

The watch-account parser uses a defined schema rather than indentation-dependent regular expressions. Empty watch lists are valid and visible.

## 6. Source-grounded generation

### 6.1 Source extraction

Before generation, the server extracts bounded readable text from selected evidence URLs.

Safety requirements:

- allow only HTTP and HTTPS;
- reject loopback, private-network, link-local, and credential-bearing URLs;
- follow a limited number of redirects;
- enforce timeout, content-type, and response-size limits;
- never send secrets to fetched domains;
- preserve extraction failures per source instead of failing the whole request.

Google News redirect URLs are resolved when possible. If full text cannot be extracted, title, publisher, date, and collected description remain valid evidence.

### 6.2 Gemini prompt and output

The prompt includes the evidence bundle, content type, selected template, slide count, and image mode. It instructs Gemini to distinguish facts from creative framing and to reference evidence IDs.

Structured output requires:

- the requested slide count;
- text within product length limits;
- allowed layout variants for the selected template;
- per-slide evidence IDs for factual claims;
- caption and hashtag groups.

Server-side validation normalizes or rejects malformed output. Sensitive factual slides without evidence stay `needs_review`.

### 6.3 Single-slide regeneration

A dedicated route receives the full project context, selected slide, neighboring slides, and evidence bundle, then returns exactly one replacement slide. It does not regenerate the entire deck.

## 7. Editor and rendering

### 7.1 Editing

The editor supports:

- headline, subtext, and body;
- caption;
- core, topic, and viral hashtags;
- layout variant restricted to the selected template;
- evidence references;
- image replacement and removal.

Edits autosave to IndexedDB after a short debounce and show saved, saving, or error status.

### 7.2 Image search

Pexels search displays all returned candidates with preview, photographer/source link, and selection state. It never silently chooses the first result. Missing credentials disable the control with a setup explanation.

Provider architecture permits later Unsplash, Pixabay, or Wikimedia adapters, but those providers are not presented as available until implemented and configured.

### 7.3 Canonical rendering

A single pure SVG renderer is the source of truth for both browser preview and PNG export. Template geometry, line wrapping, source labels, and images must come from this renderer so preview and download are equivalent.

Server PNG rendering validates template, slide fields, image type, and payload size. Remote images are fetched only from approved provider hosts. Uploaded images are read from local blobs and sent explicitly for rendering.

### 7.4 Downloads

Users can download:

- the selected card as PNG;
- all cards as a ZIP with ordered filenames;
- the project as a versioned `.chak` JSON file.

Import validates schema version and data size before saving. Conflicting project IDs create a copy unless the user chooses replacement.

## 8. Review and Archive

### 8.1 Review checklist

Each project has three review groups:

- factual claims and dates checked against linked evidence;
- caption and copy reviewed;
- image source and usage rights reviewed.

Sensitive admissions, exam, rule, schedule, and benefit content additionally requires at least one official evidence record.

`ready` is reachable only when all required checks pass. Reopening and editing factual copy or replacing an image invalidates the affected checks and returns the project to `needs_review` or `draft`.

### 8.2 Archive behavior

Archive loads from IndexedDB without inserting examples into production data. An optional clearly separated demo import may create sample projects on request.

Opening a project restores the exact slides, images, caption, hashtags, template, evidence, review state, and history. Search and filters operate on stored projects. Delete supports undo during the current session.

## 9. Integrations

### 9.1 Health status

`configured` and `verified` are separate states. A key's mere presence is not reported as a successful connection. Health checks use the lightest provider-supported authenticated request and cache results briefly to avoid unnecessary quota use.

### 9.2 n8n

When `N8N_WEBHOOK_URL` is configured, an explicit `n8n으로 전달` action sends the approved project manifest, evidence metadata, caption, hashtags, and rendered card files. Delivery is disabled for non-ready projects. The response and timestamp are stored in project history.

No request is sent automatically merely because the environment variable exists.

## 10. Error handling

- Provider failures do not erase the last successful local snapshot.
- Partial source-extraction failure remains visible per evidence item.
- IndexedDB quota and corruption errors are surfaced with export/recovery guidance.
- Import errors never overwrite existing projects.
- Failed generation or regeneration preserves the current editor state.
- Failed rendering identifies the affected slide.
- Webhook failure keeps the project ready and records a failed delivery event.

## 11. Interface changes

The visual system remains the existing restrained CHAK operating interface. New UI is limited to workflow needs:

- integration status with configured/verified/error distinctions;
- automatic-refresh control and local-storage explanation;
- explainable Format Radar pattern cards;
- Pexels candidate picker;
- caption and hashtag editor;
- autosave indicator;
- review checklist and readiness action;
- exact-project Archive reopen;
- export/import, ZIP, and n8n delivery actions.

Controls that cannot work are disabled with a reason. No empty button or optimistic success message is allowed.

## 12. Testing and acceptance criteria

### Unit tests

- official-source registry and redirect handling;
- score nullability and like-for-like trend comparison;
- format-pattern extraction and minimum evidence threshold;
- project status transitions and checklist invalidation;
- `.chak` import/export validation;
- prompt grounding and structured-output normalization;
- canonical renderer output and unsafe image rejection.

### Route tests

- generation with partial extraction failure;
- single-slide regeneration;
- provider health states;
- PNG and ZIP output;
- n8n ready-state gate.

### Browser tests

- collect → select evidence → generate → edit → autosave;
- caption/hashtag edit;
- image candidate selection;
- review → ready transition;
- exact Archive reopen;
- project export/import;
- individual and ZIP download;
- mobile and desktop layouts;
- unavailable-provider messaging.

### Completion criteria

- No visible feature depends on seeded fake production data.
- Every enabled action has an observable persistent result.
- Every disabled action explains the missing credential or unsupported capability.
- A generated factual claim can be traced to evidence shown in the editor.
- Preview and downloaded PNG use the same rendering source.
- A saved project survives reload and reopens without losing edits.
- A project cannot become ready unless its applicable checklist rules pass.
- The full test suite, type check, production build, and one desktop/mobile browser pass succeed.
