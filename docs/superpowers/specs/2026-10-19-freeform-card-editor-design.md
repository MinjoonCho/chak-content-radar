# CHAK Freeform Card Editor Design

## Goal

Replace the fixed-field card editor with a local-first freeform canvas editor comparable in interaction fundamentals to Canva, Miricanvas, and Photoshop while preserving CHAK's evidence, review, autosave, and export workflow. Remove implementation-facing or defensive AI copy from the product UI.

## Product Decisions

- A template is a starting arrangement, never a permanent layout constraint.
- Editors can add, duplicate, reorder, lock, hide, and delete text, image, and shape elements.
- The editor and exported PNG/ZIP use the same versioned scene graph and SVG renderer.
- Every edit remains browser-local, autosaved in IndexedDB, and portable in `.chak` files.
- Editing visible content invalidates the applicable review checks.
- Existing projects migrate in memory and are saved in the new format without losing their original copy or images.

## Architecture

### Versioned scene graph

Each slide gains an optional `canvas` field with schema version 1. It contains a 1080×1350 stage and ordered elements:

- `text`: content, x/y, width/height, rotation, opacity, font family, size, weight, line height, letter spacing, alignment, color, background, padding, and locking.
- `image`: asset metadata, x/y, width/height, rotation, opacity, object-fit mode, crop scale and offsets, corner radius, and locking.
- `shape`: rectangle or ellipse, x/y, width/height, rotation, fill, stroke, stroke width, corner radius, opacity, and locking.

Every element has a stable ID, visibility, z-order, and optional semantic role. Legacy headline/body/image fields remain for generation compatibility and are converted into layers by a deterministic template adapter.

### Shared rendering

`renderCardSvg` consumes the scene graph. If a slide has no scene graph, the template adapter produces one first. Browser preview embeds the resulting SVG and overlays selection controls that manipulate the same element geometry. Server PNG and ZIP routes consume the identical renderer, so visual output cannot diverge from the editor.

### Editor state

The editor owns:

- current slide and selected element IDs;
- scene history with bounded undo/redo;
- zoom and viewport pan;
- active drag/resize/rotate transaction;
- clipboard payload for duplicate/copy/paste;
- snapping guides and keyboard movement.

Transient interaction state is not persisted. Committed scenes are debounced into the existing WorkspaceRepository.

## Editor Experience

The result screen becomes a four-part production workspace:

1. A narrow slide rail for navigation, duplication, deletion, and ordering.
2. A compact top toolbar for selection, text/image/shape insertion, undo/redo, zoom, and export.
3. A centered 4:5 artboard with direct selection, drag, eight resize handles, rotation, snapping guides, and double-click text editing.
4. A property inspector that changes with the selected element and exposes typography, color, alignment, geometry, layer order, locking, image crop, and replacement controls.

Keyboard controls include arrows for movement, Shift+arrows for 10px movement, Delete/Backspace, Cmd/Ctrl+D duplicate, Cmd/Ctrl+C/V, Cmd/Ctrl+Z, and Shift+Cmd/Ctrl+Z.

The UI remains an operational CHAK workspace rather than imitating competitor chrome. Mobile supports property editing and coarse drag operations, while desktop is the primary precision editing surface.

## Typography and Assets

Initial font choices are restricted to browser-safe Korean-capable stacks so preview and server export stay consistent: Pretendard/system sans, Noto Sans KR, Nanum Gothic, and serif fallback. Custom font uploads are out of scope because server rendering cannot safely reproduce arbitrary local fonts without embedding and licensing controls.

Image upload accepts PNG, JPEG, and WebP up to 8MB. Images retain source/license metadata. Crop state is non-destructive and stored on the image element.

## Copy Cleanup

Remove phrases such as “더미 데이터 없음”, “실제 응답”, “AI 생성”, and internal implementation explanations. Replace them with direct editorial language:

- collection summary states when the content was updated;
- empty states say which source connection or action is needed;
- generation state says “초안 생성” or “문구 생성”;
- provider configuration messages remain factual and actionable.

No UI claims unsupported popularity or verification.

## Review and Persistence

- Text edits invalidate copy review.
- Image edits invalidate image review.
- Source layer or citation changes invalidate source review.
- Geometry-only movement invalidates the relevant content class but does not discard sources.
- Autosave runs only after a committed interaction, not every pointer movement.
- `.chak` schema accepts both legacy and scene-graph projects and exports the new scene data.
- Corrupt or oversized scene data is rejected without replacing the stored project.

## Error Handling and Limits

- Clamp elements to a generous stage boundary while allowing intentional edge bleed.
- Enforce finite numeric geometry, sensible font-size and scale ranges, and a maximum element count per slide.
- Reject unsupported image MIME types and unsafe remote hosts.
- Preserve the last committed scene when an interaction or persistence write fails.
- Unsupported legacy values fall back to safe defaults and surface a non-blocking notice.

## Testing

- Pure tests for scene validation, legacy migration, snapping, history, layer operations, keyboard deltas, and SVG determinism.
- Renderer tests for typography, transforms, crop clips, stacking order, and escaping.
- Workspace transfer tests for scene round trips and malformed/oversized rejection.
- Browser tests for add/select/drag/resize/style/undo/autosave/reopen/export on desktop and essential inspector behavior on mobile.
- Production build and screenshot inspection at desktop and mobile widths.

## Out of Scope

- Collaborative real-time editing, cloud accounts, comments, custom font upload, PSD import/export, background removal, filters, vector pen tools, animation, and multi-select group transforms.
