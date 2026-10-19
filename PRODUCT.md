# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js, TypeScript, CSS with CHAK design tokens, Gemini API, IndexedDB local-first persistence, canonical SVG rendering, Sharp PNG rendering, and JSZip. Vercel is the primary deployment target; server routes remain stateless.

## Users

CHAK marketing team members working on Korean high-school student and CSAT-candidate Instagram content. They need to move from finding a timely topic to a reviewed, exportable carousel without switching among several tools.

## Product Purpose

Collect and rank relevant topic signals, recommend a timely angle, turn a selected or manually entered topic into tightly constrained card-news copy, render it through code-owned templates, and preserve the result with sources and publishing status.

## Positioning

This is a source-aware content operations workspace, not an unconstrained AI design generator. Models interpret topics and produce structured copy; CHAK-owned templates control visual output and safety rules control publish readiness.

## Operating Context

The team checks Topic Radar and Format Radar, chooses or enters a topic, reviews sources and official-source status, generates and edits a carousel, downloads PNGs, then archives the post. Sensitive admissions or exam information always remains review-gated.

## Capabilities and Constraints

- Three primary screens: Radar, Generate, Archive. No login or complex administration.
- Exactly four initial 1080x1350 templates: information, viral, curation, and breaking news.
- Gemini uses structured output for analysis, copy, image queries, caption, and hashtags. It does not design layouts.
- Headline, subtext, and body lengths are capped at 28, 45, and 80 Korean characters.
- Official-source verification is required for high-impact exam and admissions information before publish-ready status.
- Image candidates retain provider, source page, query, license status, and publish usability.
- Scraping that violates platform terms is out of scope; official APIs, RSS, public metadata, and manual watchlists are preferred.
- API-free local drafting remains available. External providers are explicitly unavailable until configured and verified; no social popularity is synthesized.
- Projects and Radar history persist in the current browser and move between teammates through versioned `.chak` files. This is intentionally not multi-user cloud storage.

## Brand Commitments

Use the existing CHAK name and visual tokens as found in `../14-DEMODAY-FRONTEND-CHAK/src/design-system/tokens`: tomato red, warm paper neutrals, dark ink, and Pretendard-first Korean typography. The internal interface stays restrained and workflow-led.

## Evidence on Hand

- Product brief: `/Users/minjooncho/.codex/attachments/7c1d9305-285d-456a-b8ff-12ffdd4712e1/붙여넣은 텍스트.txt`
- Existing CHAK design token implementation: `../14-DEMODAY-FRONTEND-CHAK/src/design-system/tokens`
- No production trend feeds, Instagram account list, credentials, approved photo library, or publishing integration were supplied. Demo values must be labeled as examples.

## Product Principles

1. Sources before speed: visible evidence and verification state travel with every topic and post.
2. Code owns layout: model output stays inside explicit schemas and fixed template variants.
3. Korea-first context: generated search terms and media review avoid generic Western school imagery.
4. Short enough to publish: the editor enforces card-level copy limits at creation and revision time.
5. Useful without setup: core exploration and generation work in demo mode before credentials are added.

## Accessibility & Inclusion

Keyboard navigation, visible focus, reduced-motion support, sufficient text contrast, semantic controls, and non-color-only status labels are required.
