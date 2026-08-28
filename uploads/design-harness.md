# Marine Link — Design Harness

Marine Link is an illustrated, single-scene ocean-exploration experience for kids: scroll down through ocean depth zones (Sunlight → Twilight → Midnight → Abyssal → Hadal), tap glowing creatures to discover them, flip their card for facts, and test what you've learned in a quiz. It is not a multi-page app — almost everything happens as an overlay on top of one continuously-scrolling scene.

## Decision map

```
Landing / first-run tour?        → patterns/onboarding.md
Finding/opening a creature?      → patterns/creature-discovery.md + components/core/creature-marker.md, map-pin.md, creature-card.md
Search UI?                       → components/core/search-field.md + list-item.md + chip.md
The trophy quiz?                 → patterns/quiz-flow.md + components/core/quiz-panel.md, quiz-option.md
Top bar / progress / depth HUD?  → patterns/exploration-hud.md + components/core/hud-bar.md, depth-badge.md, depth-ruler.md
Any overlay/dialog?              → components/core/modal.md (shared shell for search, map, quiz, creature-card)
A circular icon action?          → components/core/icon-button.md
A pill/CTA button?               → components/core/button.md
Zone welcome messages?           → components/core/zone-banner.md
Tutorial coachmarks?             → components/core/coachmark.md
Ambient decoration (bubbles, sparkles, fish, submarine)? → references/motion.md § "The boundary" — this is scene-dressing, not a component; don't create a component file for it.
Need exact values?               → references/tokens.md
Need a repeated look?            → references/hypertokens.md
Copy / tone?                     → references/voice.md
Using a component?               → read its file, build the current version
Nothing fits, need new?          → STOP. Read the creation gate first.
```

---

## Operating rules

- **Precedence:** production system beats prototype; doc beats prototype on rules.
- **Tokens:** every visual value maps to a token in `references/tokens.md`. No hardcoded values.
- **Icons:** there is no icon library. Every icon is a bespoke inline SVG (stroke-based, ~1.6–3px stroke weight) or, for micro-glyphs, a literal character (✕ close, ✓ correct/explored, ↺ wrong, ↻ flip, ? unexplored). A new icon must match the existing stroke weight and palette — flag it as a gap if nothing close exists to copy from.
- **Sound:** every interactive element fires a `hoverSound` event on mouse-enter. Treat this as a required event binding on every button/interactive component, not an optional flourish.
- **When nothing fits:** flag the gap — name what's needed, the closest existing component, the delta required. Wait for an explicit "yes, create it."

---

## Creation gate

You may NOT create, modify, or extend anything canonical on your own: components, tokens, hypertokens, motion, or patterns.

- Every element in your output maps to a registered component, or is composed purely from registered ones.
- Every visual value maps to a token. No hardcoded values.
- Every repeated look maps to a hypertoken, and every hypertoken maps only to tokens.
- Every animation maps to registered motion. Motion patterns reference duration and easing by token name.

If nothing fits:
1. STOP. Do not improvise an unregistered component, token, hypertoken, motion value, or pattern.
2. Name the gap: what's needed, why nothing fits, the closest existing thing, the delta required.
3. Wait. Only an explicit "yes, create it" / "extend X" from the person lets you proceed.

When told to proceed: write the file in the component-file format (delta-only for extensions, status: draft), and add one line to the extensions index below.

---

## Status glossary

- **draft** — new, not yet proven in real use. May change.
- **proven** — used in real screens and held up. Safe to reuse.
- **retired** — replaced or dropped. Don't use; kept so old work resolves.

All components below are currently **draft**: they were authored directly from the live prototype's markup/JS, but haven't yet been through a second real build to confirm they hold up.

---

## Minimum Viable States (MVS)

Marine Link has almost no traditional page states (no loading/empty/error pages — it's one asset-bundled scene) but its interactive pieces still have real state floors:

| Class | Examples | Required states |
|-------|----------|-----------------|
| **Static / decorative** | zone-banner, depth-ruler, ambient bubbles | default only — no interaction |
| **Discovery target** | creature-marker, map-pin | unexplored (pulsing/dashed) · explored (checked) |
| **Interactive control** | icon-button, button, chip | default · active (chip only) — no hover/focus/disabled states are implemented in the source; don't invent them without a reason |
| **Overlay** | modal (search/map/quiz/creature-card) | open · closed (no animated exit today) |
| **Quiz option** | quiz-option | default · correct · wrong-selected · other |
| **Card** | creature-card | front · back (flip, not open/closed) |

Cross-cutting: every clickable element fires `hoverSound`; treat that as its own required "interaction" hook alongside visual states.

---

## Minimum Viable Components

| Class | Core set |
|-------|----------|
| **Actions** | button · icon-button · chip |
| **Overlay shell** | modal |
| **Search** | search-field · list-item |
| **Discovery** | creature-marker · map-pin · creature-card |
| **Quiz** | quiz-panel · quiz-option |
| **HUD** | hud-bar · depth-badge · depth-ruler |
| **Announcements** | zone-banner · coachmark |
| **Status** | badge |

---

## Extensions index

| Name | Status | Extends | When to use |
|------|--------|---------|-------------|
| *(none yet)* | — | — | — |

---

## Revisions

- **r3:** filled the Abyssal Zone gap flagged in r2, and while sourcing it, corrected the zone-naming model across tokens.md, voice.md, and zone-banner.md. The two deepest zones don't follow the "{Name} Zone" pattern used by the other three — the product's real names are **"Abyss"** and **"The Trenches"** (confirmed from the welcome-banner markup and the `zoneLabelOf` function), not "Abyssal Zone" / "Hadal Zone" as originally guessed. Also documented the two milestone banners (50%/100% explored) that r2 had missed entirely, and added the full 3-color-role model (subtext/headline/underline) per zone in place of the earlier partial one.
- **r2 (full rewrite):** replaced the initial enterprise-SaaS-shaped harness (forms, tables, app-shell, dashboards) with the real Marine Link product harness, derived directly from `Marine Link Home - Standalone.html`. Marine Link is a kids' ocean-exploration/discovery experience, not a logistics dashboard — every reference, token, hypertoken, motion entry, component, and pattern was rewritten from the live prototype's actual markup, styles, and copy.
- **r1:** initial placeholder harness, authored before any real design file was available (superseded).
