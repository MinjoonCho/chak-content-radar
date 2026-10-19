---
name: CHAK Content Radar
description: An evidence-led editorial desk for source-aware Korean student content operations.
colors:
  tomato: "#d93a1f"
  tomato-pressed: "#bd2e15"
  tomato-soft: "#ffd9cf"
  paper-canvas: "#efebe4"
  paper-surface: "#fbf9f5"
  paper-raised: "#ffffff"
  ink: "#1e1b18"
  text: "#292722"
  muted: "#6f6961"
  border: "#d9d1c7"
  signal-blue: "#2f6bff"
  signal-blue-soft: "#d6e2ff"
  butter: "#ffc21a"
  success: "#3f7659"
  success-soft: "#e3eee6"
  warning: "#8a661c"
  warning-soft: "#f8edc9"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, Noto Sans KR, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(26px, 2.6vw, 38px)"
    fontWeight: 750
    lineHeight: 1.18
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, Noto Sans KR, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "19px"
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Pretendard Variable, Pretendard, Noto Sans KR, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "Pretendard Variable, Pretendard, Noto Sans KR, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 450
    lineHeight: 1.5
  label:
    fontFamily: "Pretendard Variable, Pretendard, Noto Sans KR, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.08em"
rounded:
  tight: "7px"
  control: "10px"
  choice: "12px"
  card: "14px"
  panel: "15px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "24px"
  page: "42px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "#37322e"
    textColor: "{colors.paper-surface}"
    rounded: "{rounded.control}"
  button-generate:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.paper-raised}"
    typography: "{typography.title}"
    rounded: "{rounded.choice}"
    padding: "0 20px"
    height: "61px"
  field:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "18px 20px"
  chip-verified:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
---

# Design System: CHAK Content Radar

## Overview

**Creative North Star: "The Evidence Desk"**

CHAK Content Radar extends the existing CHAK identity into a focused internal editorial desk. Warm paper tones and dark ink give the workspace the familiarity of marked-up briefs, while tomato red remains the decisive brand voice for generation, selection, and urgent editorial attention.

The interface is compact, operational, and evidence-led. Thin dividers, modest corner rounding, small status labels, and dense information blocks help editors scan sources, risk, scores, and production state without turning the workspace into a decorative marketing dashboard. Starting templates establish hierarchy, then the freeform scene canvas lets editors position and style every layer while preserving export fidelity and publish safety.

**Key Characteristics:**

- Warm paper surfaces anchored by a near-black editorial sidebar.
- Tomato red used as a precise action and brand signal, not ambient decoration.
- Compact, Korean-first typography with strong numeric and status hierarchy.
- Evidence, verification, and publishing state remain visible beside creation controls.
- A versioned 4:5 scene canvas keeps editing, preview, PNG, and ZIP output structurally consistent.

## Colors

The palette pairs tomato red with tactile paper neutrals and dark brown-black ink, then reserves blue, butter, green, and ochre for explicit operational meaning.

### Primary

- **CHAK Tomato** (`tomato`): the brand accent for the mark, generation action, selected slide borders, and high-salience editorial signals.
- **Pressed Tomato** (`tomato-pressed`): hover, pressed, and text-accent treatment when the base tomato needs stronger contrast.
- **Tomato Wash** (`tomato-soft`): low-intensity backgrounds for viral labels and coral score cells.

### Secondary

- **Signal Blue** (`signal-blue`): links, focus visibility, information labels, and changed-information markers.
- **Notebook Butter** (`butter`): curation templates and small attention cues; it reads as editorial annotation rather than general warning.

### Neutral

- **Desk Canvas** (`paper-canvas`): the workspace ground behind every operational surface.
- **Paper Surface** (`paper-surface`): cards, forms, toolbars, and the active navigation item.
- **Raised Sheet** (`paper-raised`): editable fields and controls that sit above paper surfaces.
- **Dark Ink** (`ink`): the sidebar, primary button, strongest headings, and selected-control state.
- **Reading Ink** (`text`): default body copy and general interface text.
- **Pencil Gray** (`muted`): descriptions, metadata, counts, and secondary labels.
- **Rule Line** (`border`): quiet control outlines and structural separation.

### Tertiary

- **Verified Green** (`success`, `success-soft`): source-safe and usable-for-publish states.
- **Review Ochre** (`warning`, `warning-soft`): missing verification, demo/API state, and review-gated publishing.

### Named Rules

**The One Red Decision Rule.** Tomato red marks the strongest brand or action decision in a region; it does not flood general surfaces.

**The Meaning Before Hue Rule.** Blue, green, ochre, and butter retain stable operational meanings and always appear with text or icon reinforcement.

## Typography

**Display Font:** Pretendard Variable (with Pretendard, Noto Sans KR, and system sans-serif fallbacks)  
**Body Font:** Pretendard Variable (with Pretendard, Noto Sans KR, and system sans-serif fallbacks)  
**Label Font:** Pretendard Variable (same fallback stack)

**Character:** A single Korean-first sans-serif family keeps the dense tool legible and matter-of-fact. Hierarchy comes from weight, compact size changes, and slightly tightened display tracking rather than a decorative display face.

### Hierarchy

- **Display** (750, responsive 26–38px, 1.18): page titles only; tight tracking makes short Korean headings feel intentional.
- **Headline** (750, 19px, approximately 1.3): topic names and major card headings.
- **Title** (700, 14px, 1.5): section titles, control groups, and active navigation labels.
- **Body** (450, 15px, 1.5): default interface copy; explanatory text generally stays near 64 characters per line.
- **Label** (700, 11px, 1.5): statuses, field hints, metadata, and compact operational controls; uppercase and wider tracking are reserved for short English system labels.

### Named Rules

**The Dense, Never Tiny Rule.** Use the compact label scale for supporting information, but preserve clear weight, contrast, and a larger touch target around it.

**The Canvas Scales Itself Rule.** Carousel typography uses container-relative units so the 4:5 composition keeps its hierarchy at thumbnail, preview, and export sizes.

## Layout

The desktop workspace uses a fixed 246px dark sidebar and a centered content region capped at 1480px with 42px horizontal page padding. Primary views combine one fluid work column with a narrow contextual rail: 286px for review, 320px for generation guidance, and 340px for editing. Repeated gaps cluster around 8–12px inside controls and 18–26px between functional groups.

At 1120px, side rails fall below the primary work area or become compact summary grids. At 820px, the sidebar becomes a slide-in drawer, page padding reduces to 16px, and the editor becomes a vertical sequence of preview, horizontal slide rail, and edit panel. Below 560px, headers, toolbars, trend rows, and archive rows stack; 44px minimum interactive targets are applied to icon-heavy controls.

Carousel output is fixed at a 4:5 aspect ratio corresponding to 1080×1350 exports. The desktop editor uses a 152px slide rail, a fluid canvas workspace, and a 360px inspector. Generated templates provide initial photo-top, photo-bottom, photo-right, text-only, and number-large compositions; every text, image, and shape becomes an editable scene layer afterward.

The canvas viewport scales the canonical 1080×1350 coordinate system without changing persisted geometry. Selection outlines, eight resize handles, a rotation handle, and magenta alignment guides sit above the exact SVG used for export. Shift-drag pans the viewport; zoom remains between 20% and 125%. Pointer transactions stay transient until release, while inspector changes commit immediately.

**The Work First Rule.** The main task surface receives width first; contextual guidance remains narrow, sticky where useful, and collapses before the work area becomes cramped.

## Elevation & Depth

The system is flat by default and relies on paper-tone changes, one-pixel borders, and darker work zones for structure. Shadows are reserved for true separation: a summary panel, a hovering row, the active segmented control, the primary generation action, the carousel preview, and transient feedback.

### Shadow Vocabulary

- **Segmented Lift** (`0 2px 7px rgba(50,45,40,.08)`): selected option inside a shared control track.
- **Row Hover** (`0 10px 25px rgba(53,48,42,.08)`): temporary lift for actionable radar rows.
- **Panel Lift** (`0 12px 30px rgba(53,48,42,.13)`): the dark radar summary against the paper canvas.
- **Action Lift** (`0 7px 18px rgba(166,45,25,.22)`): the tomato generation button only.
- **Canvas Lift** (`0 22px 50px rgba(45,39,34,.25)`): the editable carousel sheet above the neutral preview stage.

**The Flat Until Active Rule.** Resting cards use borders and tone; noticeable shadows appear only for interaction, hierarchy, preview focus, or transient feedback.

## Shapes

Controls use gently rounded 10px corners, selectable tiles use 12px, operational cards use 14px, and major summary or form panels use 15px. Pills are reserved for statuses, model labels, and compact counters. The sidebar mark and navigation share the same softened geometry, while the carousel remains a clean clipped rectangle whose internal circles and bars supply its graphic character.

Borders are quiet and structural: a single warm-gray line separates cards, fields, and editor regions. Selected choices strengthen the dark ink border with a one-pixel inset line rather than introducing a new shape.

**The Radius Has Rank Rule.** Corner size increases with container scope: control, choice, card, then panel. Do not assign large floating radii to ordinary work surfaces.

## Components

### Buttons

- **Shape:** compact and gently rounded (10px), with a 40px minimum height for standard actions.
- **Primary:** dark ink on warm white, bold label weight, and restrained horizontal padding.
- **Generate:** tomato red, taller at 61px, with an icon, primary instruction, supporting output summary, and a specific warm shadow.
- **Hover / Focus:** hover darkens the fill; keyboard focus uses a 3px translucent signal-blue outline with a 2px offset.
- **Secondary / Text:** secondary buttons are paper-white with a warm border; text buttons remove the container and use muted copy.

### Chips

- **Style:** fully rounded, compact, and semantically tinted; labels remain bold and explicit.
- **State:** green means verified, ochre means review required, blue marks information, tomato wash marks viral content, butter marks curation, and lilac marks breaking or model context.

### Cards / Containers

- **Corner Style:** softly rounded operational cards (14px) and major panels (15px).
- **Background:** paper surface above the desk canvas; raised white is reserved for controls inside a surface.
- **Shadow Strategy:** border and tonal separation at rest; see the Flat Until Active Rule.
- **Border:** one warm-gray line, softened for larger cards.
- **Internal Padding:** generally 18–26px, tightened to 12–14px for rows and compact modules.

### Inputs / Fields

- **Style:** raised white, a warm one-pixel border, 10px corners, and 10–15px internal padding.
- **Focus:** the border shifts toward signal blue with a subtle three-pixel blue halo.
- **Error / Disabled:** errors use a pale red banner with explicit text; disabled generation retains its form but lowers opacity and changes cursor state.

### Navigation

The desktop navigation is a fixed dark-ink rail with muted inactive labels and a warm-paper active item. Each destination pairs a 19px outline icon with an English title and a smaller Korean descriptor. On mobile it becomes an off-canvas panel behind a dark scrim, with dedicated open and close controls.

### Evidence Status

Verification and publishing safety are never color-only. Each status combines semantic tint, an icon where space allows, and explicit Korean copy; source links remain visibly underlined and use signal blue.

### Freeform Carousel Canvas

Every carousel starts on a fixed 4:5 frame with a CHAK signature, oversized numeric or editorial hierarchy, and a footer rule. Four templates establish background, accent, image position, and headline scale, then editors can add, move, resize, rotate, duplicate, reorder, lock, hide, or delete text, image, and shape layers.

- **Toolbar:** selection, text/image/shape insertion, undo/redo, and zoom stay in one compact horizontal strip.
- **Slide rail:** thumbnails keep navigation, duplicate, delete, and ordering controls adjacent to each card.
- **Layer panel:** topmost layers appear first, with visibility, lock, and front/back controls. Selection uses signal blue and a left inset rule.
- **Inspector:** shared geometry and opacity controls precede text, image, or shape-specific properties. Numeric fields remain available on touch devices for precise edits.
- **Focus:** keyboard focus uses the existing signal-blue ring; the canvas itself is focusable for arrows, Shift+arrows, delete, duplicate, copy/paste, and undo/redo shortcuts.
- **Images:** uploads accept PNG, JPEG, and WebP up to 8MB. Crop scale and offsets are non-destructive and remain in the scene graph.
- **Responsive:** below 800px the canvas, horizontal slide rail, and inspector stack vertically. Property controls remain visible, and coarse drag is supported without horizontal page overflow.

## Do's and Don'ts

### Do:

- **Do** build hierarchy with paper tone, thin rules, weight, and compact spacing before adding shadow.
- **Do** keep evidence, verification state, dates, and source actions adjacent to the editorial decision they affect.
- **Do** preserve Pretendard-first Korean typography and container-relative type inside carousel canvases.
- **Do** keep mobile icon controls at least 44px in each dimension and preserve visible keyboard focus.
- **Do** use a starting template, then make intentional layer edits on the canonical scene canvas.

### Don't:

- **Don't** turn the workspace into a decorative marketing dashboard with gradients, glass panels, or oversized hero composition.
- **Don't** use tomato red as a general background wash or apply it to multiple competing actions in one region.
- **Don't** communicate verification, risk, or publish readiness through color alone.
- **Don't** imply that generated placement is final; templates are editable starting points and every visible layer must remain inspectable.
- **Don't** add heavy shadows to resting cards or increase corner radii beyond the established control-to-panel hierarchy.
