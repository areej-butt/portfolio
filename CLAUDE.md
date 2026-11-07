# CLAUDE.md: Areej's portfolio (handoff for the next session)

Personal portfolio for Areej Butt (product designer, CS + Psychology at LUMS).
Live at https://areejbutt.vercel.app. Repo `areej-butt/portfolio`. **Pushing to `main` deploys to Vercel**
(about 1 to 2 minutes, no build step). `HANDOFF.md` covers deployment details; this file covers how the code works,
what has been decided, and how to change it safely. Read it all before editing.

## How Areej likes to work

- She reviews visually and changes her mind. **Show a preview before anything big goes live** (screenshots, a short
  video, or a standalone HTML options page she can click through), then push when she says yes.
  Small, explicit fixes ("make X green", "push it") can go straight live after you test them.
- Keep changes surgical. Don't redesign things she didn't ask about.
- She often sends new requests mid-task. Finish or park the current one, then handle each.
- After pushing, tell her to check the live site in a private window (favicons, fonts and videos cache hard).

## Decisions already made (don't undo without asking)

- **Layout width:** content capped at `max-width:1100px` (case studies 900px). Full-width layouts were rejected.
- **Footer:** keep the original (icons left, links right). A paper-plane footer and several redesigns were rejected.
- **Featured Work (home):** the original layout: one pastel card per project, text on the left (logo, eyebrow,
  title, description, CTA) and a 16:10 video on the right (max 420px wide). She wants the work to feel big and
  important. A three-column grid (option E) was tried and **rejected as "too small and unimportant"**. If she asks for
  bigger videos again, the candidates she was shown were **B, Showcase** (full-width video on top, info row below)
  and **C, Zigzag** (text + a video about twice as big, alternating sides). Show an HTML options page first.
- **Case studies open on the full page.** Home cards and "Next case study" go to `X.dc.html`, not the summary.
  Every case study and summary has a **Full case study | Summary** toggle (Full on the left) in the same spot.
  Never write "2 min" anywhere.
- **Summaries** (`*-summary.html`) are short versions with the same fonts as the full pages: Fraunces headings,
  Fraunces italic tagline, Figtree 17px body.
- **End of every case study and summary:** a "Back to / ← Home" and "Next case study / Name →" row
  (HoshiyarPK → EquityFlow → Marine Link → HoshiyarPK), with no divider line, then the standard footer.
- **Scrollbar:** option **D, the reading line** (`reading-line.js`) on every page. Touch devices keep the normal
  scrollbar. Other styles she was shown (teal pill, palette gradient, draggable logo handle) were not chosen.
- **Bug bash:** 15-second rounds.
- **Night mode:** a switch in every nav, starting in light mode. It does not follow the device's dark setting
  automatically (not decided; ask before changing).
- **Videos instead of static images** for hero covers, home cards and screen galleries, and **every section shows
  something different** (see "Video previews").

## Pages

| File | What it is |
|---|---|
| `Portfolio.dc.html` | Home: hero + Experience Road, Featured Work grid, Skills, About Me (flip card + bug game), footer |
| `CareerLevel.dc.html` | The Experience Road, imported into the home hero via `<dc-import name="CareerLevel">` |
| `HoshiyarPK.dc.html`, `EquityFlow.dc.html`, `MarineLink.dc.html` | Full case studies |
| `HoshiyarPK-summary.html`, `EquityFlow-summary.html`, `MarineLink-summary.html` | Summaries: **plain static HTML** (not .dc), each self-contained. Edit each file directly; keep the three consistent |
| `video-previews.js` | Turns `<div data-video="name">` into a looping muted video (see below) |
| `case-motion.js` | Scroll motion on the full case studies (timeline + section fade-ups) |
| `sparkle-cursor.js` | Custom cursor (teal dot + coral sparkle), per-page colours via `data-dot` / `data-spark` |
| `reading-line.js` | Replaces the browser scrollbar (mouse devices only) with a hairline on the right edge that fills as you read, with a sparkle at the tip. Colours come from the sparkle-cursor tag's `data-dot` / `data-spark`. Click or drag the edge to jump. Must load right after `sparkle-cursor.js` |
| `night-mode.js` | Night mode: sun/moon switch in every nav (`<button class="nm-toggle">`), loaded early (not deferred) in each head before `reading-line.js`. Remembers the choice in `localStorage.theme`; default is light. Remaps colours by rule (see below) |
| `support.js`, `image-slot.js` | Generic Claude Design runtime. **Don't edit.** |
| `vendor/` | Self-hosted React 18.3.1, ReactDOM 18.3.1 and Babel standalone 7.29.0 (byte-identical to unpkg, checked against the runtime's SRI hashes). Each .dc page sets `window.__resources` before `support.js` so the runtime loads these instead of unpkg, and preloads them. Cached for a year (`vercel.json`), so rename the files if you ever change versions |
| `uploads/og/` | Link-preview images (1200x630) used by the `og:image` tags on every page |
| `uploads/video/` | 18 videos (`.mp4`) + still frames (`.jpg`), 7.8 MB total |
| `tools/` | Scripts that made the videos (not deployed, see `tools/video/README.md`) |

## Speed and SEO (done, keep it this way)

- **Images:** every referenced image over 80 KB was converted to right-sized WebP (49.7 MB → 2.2 MB). Pages point at
  the `.webp` files; the original PNG/JPGs are still in `uploads/` but unused. New images: export WebP at about 2x
  their display size. Pixel-art sprites (`*pixel*`) stay PNG.
- **Lazy loading:** `<img>` tags below the hero have `loading="lazy" decoding="async"`; videos only start downloading
  within 600px of the screen (`video-previews.js`).
- **Fonts:** each .dc page links Google Fonts in the static `<head>` (not only the helmet), so text renders in the
  right fonts straight away.
- **Caching (`vercel.json`):** `vendor/` 1 year immutable, `uploads/` 1 week + stale-while-revalidate, root scripts
  1 hour. Pages themselves use Vercel's default so changes show immediately.
- **Short URLs:** `/hoshiyarpk`, `/equityflow`, `/marinelink` and `-summary` versions (rewrites). Internal links still
  use the file names.
- **Meta:** every page has a `<title>`, description, canonical URL, Open Graph and Twitter tags pointing at `uploads/og/`.
- First-load result: case studies went from about 26 MB to about 4 MB (most of the rest is Babel, cached after the first visit).

## Night mode (`night-mode.js`)

Colours are mostly inline styles (and the .dc pages rewrite them while running), so there is no list of overrides.
When dark, the script remaps colours **by rule** on inline styles and on every stylesheet rule (helmet CSS, summary
CSS, custom properties): near-white surfaces (cream, white; chroma ≤ 12) → ink-navy with cards a touch lighter than
the page; tinted pastels → a dark version of their hue; dark text → light text; light borders → subtle dark lines.
Photos, videos, the pixel road and saturated accents are untouched. A contrast pass then lifts any dark text that
lands on a dark surface, and gives text back its original colour if it sits on a surface that stayed light. Originals
are stored (also in a `data-nm` attribute, because the .dc pages copy their own HTML once) and restored exactly.
A MutationObserver re-applies after re-renders. When adding new UI, check it in both modes; if something looks
wrong in the dark, prefer adjusting the rule thresholds in `surf()` / `ink()` / `line()` over special cases.

## How the .dc.html pages work

Built in Claude Design's `.dc.html` format, not a normal framework.

- Each page has an `<x-dc>` template, a `<helmet>` for head tags and CSS, and a `<script type="text/x-dc">` block with
  `class Component extends DCLogic`. `support.js` loads React 18 + Babel **from unpkg** and renders the template.
- Bindings `{{ value }}` come from `renderVals()`. Control flow: `<sc-if value="{{ x }}">`,
  `<sc-for list="{{ items }}" as="item">`. Events `onClick="{{ handler }}"`. Refs `ref="{{ setThingRef }}"`.
  Hover/active styles: `style-hover="..."`, `style-active="..."`.
- `sc-for` keys items **by index**, so DOM nodes are reused when a list shrinks. Anything you style imperatively
  on list items must be reset for every item (this caused the bug-game confetti bug).
- The raw template is in the DOM briefly before React renders, and pages re-render. Scripts that look for elements
  must wait for real content and handle re-renders (see `case-motion.js` and `video-previews.js`).

### Runtime gotchas (each of these has bitten us)

1. **Inline `style` strings are split on `;`.** Put anything containing `;` (such as data URIs) in a CSS class in the
   helmet `<style>`. CSS custom properties inline are fine (`style="--acc:#2F7A6F;--i:{{ stage.i }}"`).
2. **Never `setState` every animation frame.** Keep positions in instance variables and write `el.style.transform`
   inside `requestAnimationFrame` (see `paint()` in CareerLevel and `tickBugs()` in Portfolio).
3. **Pause animations off screen** with an IntersectionObserver (the road, the bug game and the videos all do).
4. Inline styles set via refs survive re-renders as long as the template doesn't bind the same property. Classes
   added with `classList.add` survive too, as long as the template's `class` value doesn't change.
5. Elements with `tabindex` get focus on click. Don't make "is anything focused" pause the road.
6. Road buildings sit in 340px-wide click areas; trees, cat and dog need `z-index` above them.
7. **Don't find-and-replace font names across files.** Marine Link's Typography card describes that project's own
   fonts and must stay as written.
8. The page root `<div style="min-height:100vh;...">` on the case studies uses `overflow-x:clip`, not `hidden`.
   `hidden` turns it into its own scroll box, which showed a second grey scrollbar. Keep `clip`.
9. `.image-slots.state.json` (dotfile) holds the About Me photo crop and six Marine Link images. Never delete or skip it.

## Design system

- **Fonts:** headings Fraunces (soft and wonky via `[style*="Fraunces"] { font-variation-settings: 'SOFT' 100, 'WONK' 1 }`),
  body Figtree. One Google Fonts `<link>` per page.
- **Colours:** cream `#FBF7F0`, teal `#2F7A6F` / deep `#1D4E46` / hover `#245D54`, coral `#D97D5E`, gold `#D6A947`,
  lilac `#A574C9` / `#B18FCF`, blue `#7FA3C4`, ink `#211F2E`, body `#453F52`, muted `#5C5668`, line `#ECE6DA`.
  Case-study accents: HoshiyarPK teal `#2F7A6F`, EquityFlow pink `#BF6785` (CTA `#7B4FA8`), Marine Link navy `#214C7A` (CTA `#1C6E9C`).
- **Logo:** sparkle "a" in a ring; on case-study pages it uses the page accent. Each page links its own favicon set.

## Features and where they live

### Home (`Portfolio.dc.html`)
- **Experience Road** (`CareerLevel.dc.html`): Areej runs between 7 stops (about a 30s lap). Four secrets (pet the
  cat, pet the dog, say hi to Areej, shake a tree) tracked in an "x/4 secrets" pill. No pop-up messages.
- **Featured Work:** `sc-for` over the `projects` array in `renderVals()` inside `#work`. Each card is a `.work-card`
  (pastel `project.bg`) whose text lines are `.work-bit` and whose video column is `.work-shot`; they animate in when
  scrolled into view (`setWorkRef` adds `work-in`). Videos: `hpk-card`, `ef-card`, `ml-card`, all 1120x700 (16:10),
  `imgAspect: '1120/700'`, `imgMaxW: '420px'`.
- **Skills:** cards reveal on scroll; clicking a pill pulses only that pill. Every pill needs a **unique `data-tag`**
  that is also listed in the `tagAnim` key list in `renderVals`.
- **About Me:** photo/bug-game flip card (15-second rounds). Folded corner flips to the game, and the same corner on the game side flips
  back. When a round ends it flips back and shows the score for 6s. "Contact Me" and "Download my Resume" both turn
  teal on hover/click.

### Full case studies (`HoshiyarPK/EquityFlow/MarineLink.dc.html`)
- Toggle `.cs-toggle` at the top of the hero (`--acc` sets the colour).
- **Process timeline** `.tl`: numbered dots on a gradient line, rendered from `processStages`
  (`.map` in `renderVals` adds `i`, `n`, trims labels). The line draws in and dots pop when scrolled into view;
  it turns vertical under 720px.
- `case-motion.js` adds `in` to `.tl` and fades up (`.cs-reveal`) each top-level section below the first screen.
- Video slots replace the hero and gallery images (see below). EquityFlow's "Wireframe to final" images are still static.
- `.next-row` (Home / Next case study) before the footer. EquityFlow now has the standard footer too.

### Summary pages (`*-summary.html`)
Static HTML: nav, toggle, eyebrow, title, Fraunces italic tagline, meta row, cover video, six numbered sections
(each `.reveal`, fading up via a small inline script), animated `.tl` timeline, "Want the whole story?" CTA,
`.next-row`, footer. Cover = the project's hero video; the one inline shot = a gallery video.

## Video previews

`video-previews.js` (loaded in every page head with `defer`) finds `<div data-video="NAME" data-alt="...">`,
adds `uploads/video/NAME.jpg` as a still and `NAME.mp4` as a muted, looping, playsinline video. It plays only while
≥20% visible, resumes after re-renders, and shows only the still for `prefers-reduced-motion`. Give the div a width
and `aspect-ratio` matching the video. Videos are MP4 (H.264) only, no WebM.

| Where | HoshiyarPK | EquityFlow | Marine Link |
|---|---|---|---|
| Case-study hero + summary cover | `hpk-hero` (3 phones: onboarding, scam call, Identify) | `ef-hero` (browse → detail → invest) | `ml-hero` (dive from Sunlight to Trenches) |
| Home card | `hpk-card` (Learn, Report) | `ef-card` (identity → finances → portfolio) | `ml-card` (landing + tutorial) |
| Gallery | `hpk-gallery` (SMS, Errors, Scam-it/Profile) | `ef-detail`, `ef-invest`, `ef-portfolio`, `ef-identity`, `ef-finances` (camera zooms on each captioned detail) | `ml-card-front`, `ml-card-flip`, `ml-search-browse`, `ml-search-find`, `ml-map`, `ml-quiz` |
| Summary inline shot | `hpk-gallery` | `ef-detail` | `ml-card-front` |

Sizes: HoshiyarPK hero 1600x922, gallery 1600x846, card 1120x700; EquityFlow 1120x788 (card 1120x700);
Marine Link 1120x700. To make or change videos, see `tools/video/README.md`.

## Testing before you push

Serve locally: `python3 -m http.server 8817` from the repo root, then open `/Portfolio.dc.html`.

The .dc pages now load React/Babel from `vendor/`, so they work locally and in cloud sessions with no extra setup.
(Older note, only needed for a checkout from before `vendor/` existed: cloud sessions block `unpkg.com`; route it
to npm copies in Playwright:)

```bash
cd /tmp && npm pack react@18.3.1 react-dom@18.3.1 @babel/standalone@7.29.0
# extract each .tgz, then in Playwright:
#   ctx.route('https://unpkg.com/**', r => r.fulfill({ path: <react|react-dom|babel UMD file>, contentType: 'application/javascript' }))
# UMD files: react/umd/react.production.min.js, react-dom/umd/react-dom.production.min.js, @babel/standalone/babel.min.js
```

Chromium is pre-installed (`require('playwright')`), and it plays H.264. Also abort `googletagmanager`.
The summary pages need no runtime.

Allowed hosts in the cloud environment (Areej added them): `www.figma.com`, `areej-butt.github.io`, `app.pen.dev`.
**`areejbutt.vercel.app` is not allowed**, so you can't verify the live site from the cloud; ask her to check.

Checklist:
- [ ] All seven pages load with no console errors (two `{{ ... }}` 404s on first paint are harmless).
- [ ] Every `[data-video]` plays when scrolled into view and pauses off screen; stills load.
- [ ] Road laps in about 30s; bubbles aren't clipped; the four secrets work.
- [ ] Flip card auto-flips both ways; the game is smooth; no stray confetti.
- [ ] Toggle sits in the same spot on full and summary pages; Next/Home links go to the right pages.
- [ ] No sideways scroll at 390px wide; hero fits one screen at 1440x900.

## Git

Cloud sessions run on a `claude/...` branch. Commit there, then deploy with `git push origin HEAD:main`
(fetch `main` first and make sure your branch is on top of it). End commit messages with the attribution lines
the session gives you.

## Known open items

- **HoshiyarPK:** six dotted-underlined labels open sketch lightboxes whose images were never uploaded
  (`uploads/Screenshot 2026-08-03 at 6.50.38 PM.png` and five `uploads/pasted-17857654…-0.png`). Add the images or
  make the labels plain text.
- **MarineLink:** `openZonesLightbox` / `openProcessLightbox` point at missing images but aren't used in the template.
- **Marine Link site bug** (separate repo, not this one): the "Sunlight Zone" title draws over the quiz/search popup
  near the surface.
- `video-previews.js` clears a slot before setting it up, because the .dc pages copy their own HTML once while
  rendering (that copy left a second, blocked video in the hero).
- Leftover unused code is harmless but could be tidied: `imgSrc` / `slotId` / `placeholderText` and the `imgSmall`
  branch in the home `projects` template (the cards now use `data-video`).
- Sparkle cursor: Areej once saw the normal arrow next to the sparkle (possibly Safari). Not reproduced.
- On short laptop screens (around 1366x768) the hero needs a small scroll to show the bottom of the road.
- Possible next steps she's shown interest in: more polish on the case-study pages, more projects in Featured Work.
