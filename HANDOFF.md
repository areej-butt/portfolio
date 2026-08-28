# Handoff: Deploying Areej's Portfolio

## What this is

A 5-page personal portfolio site built with **Claude Design's `.dc.html` format** — not a standard React/Vue/static-site-generator build. Each `.dc.html` file is a self-contained HTML document that boots a small custom runtime (`support.js`) which:

1. Loads **React 18, ReactDOM, and Babel Standalone from unpkg.com at runtime** (see the `loadReactUmd()` call in `support.js`).
2. In-browser-transpiles the `<script type="text/x-dc">` block at the bottom of each file (JSX-like component code) and renders it into the `<x-dc>` template.

**Implication for deployment: the site needs outbound internet access to unpkg.com to boot.** No CSP that blocks third-party scripts, no offline-only hosting. Otherwise it's 100% static files — no Node server, no build step, no `npm install`. Any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, S3+CloudFront) works as-is.

## File structure (deploy the whole directory as-is)

```
/Users/areejbutt/portfolio/
├── Portfolio.dc.html          ← main/home page
├── HoshiyarPK.dc.html         ← case study
├── EquityFlow.dc.html         ← case study
├── MarineLink.dc.html         ← case study
├── CareerLevel.dc.html        ← imported component (Experience Road on the home page)
├── support.js                 ← dc-runtime (generic, not project-specific)
├── image-slot.js              ← image-slot web component (generic)
├── .image-slots.state.json    ← ⚠️ SEE BELOW — do not skip this file
├── screenshot-2026-08-03-...png (x2)  ← root-level images referenced by HoshiyarPK.dc.html
└── uploads/                    ← 76 files: photos, screenshots, logos, resume docx
```

Total size ~54MB (mostly high-res real screenshots/photos, nothing to trim without asking).

## ⚠️ Critical gotcha: the dotfile

`.image-slots.state.json` is a **hidden file** that stores:
- The About Me profile photo (`about-photo`) — actual image data + the exact pan/zoom crop the designer set
- 6 images for Marine Link's "Early sketch" and "zone creatures" slots

`image-slot.js` fetches it via a plain relative `fetch('.image-slots.state.json')` at runtime. **Many deploy tools, drag-and-drop upload UIs, and zip utilities silently skip dotfiles.** Before/after deploying, explicitly verify this file made it to the host (curl the deployed URL + `/.image-slots.state.json` and confirm it returns JSON, not 404). If it's missing, the About Me photo reverts to a default (wrong) crop and 6 Marine Link images go blank.

## Picking the home page / entry point

The main page is `Portfolio.dc.html`, **not** `index.html`. Three files link back to it explicitly via `href="Portfolio.dc.html"` (the "Back to Portfolio" nav link in each case study). Two options, pick one before deploying:

- **A) Configure the host's default document** to `Portfolio.dc.html` (Netlify: `_redirects` file with `/ /Portfolio.dc.html 200`; S3: set index document in bucket settings). Simplest, no code changes.
- **B) Rename** `Portfolio.dc.html` → `index.html` and update the 3 `href="Portfolio.dc.html"` references (one each in HoshiyarPK/EquityFlow/MarineLink) to `href="index.html"`. Cleaner URLs (`yoursite.com/` instead of `/Portfolio.dc.html`).

Neither is done yet — decide based on the chosen host.

## What's real vs. what to know about

Every image on the site is a **real asset pulled from the actual Claude Design project** (via its GetFile API, called directly from the browser to bypass a 256KB response cap that a wrapper tool had) — nothing is a placeholder or AI-generated stand-in at this point. This includes: the bug-game icons, all Experience Road buildings/mascot, all three case-study hero images and screenshots, the About Me photo, and the Marine Link sketch/creature images.

Two filenames in `uploads/` contain spaces (e.g. `Screenshot 2026-07-23 at 7.32.04 PM.png`) — most hosts handle this fine via URL-encoding, but if the deploy pipeline does anything path-sensitive (custom nginx rules, some CDN purge scripts), it's worth knowing they exist.

## Local dev / preview

There's no build step to run. To preview locally: `python3 -m http.server 8817` from the `portfolio/` directory, then open `http://localhost:8817/Portfolio.dc.html`.

## Post-deploy smoke test

- [ ] `.image-slots.state.json` returns JSON (not 404) at the deployed URL
- [ ] Home page loads, bug-squashing game is playable (hover the panel)
- [ ] Experience Road arrows advance through all 5 nodes
- [ ] All three "view case study" links work
- [ ] About Me photo shows the correct crop (not oddly centered)
- [ ] Resume download link works (`uploads/Areej_Butt_LUMS_Resume.docx`)
- [ ] No console 404s other than the two known-harmless ones (a template-flash artifact on first paint, and `.image-slots.state.json` 404ing is the ONE that actually matters — see above)

## If an image ever needs re-fetching from the Design project later

The project's DesignSync/GetFile tool caps responses at 256KB, which silently truncates larger images. The reliable workaround used throughout this build: open the project at `claude.ai/design/p/e9d2502e-a80c-42ed-8a01-f8183bdd4ae6` in a real logged-in Chrome tab, then run a `fetch()` against `https://claude.ai/design/anthropic.omelette.api.v1alpha.OmeletteService/GetFile` (same-origin, uses the session cookie, no size cap) with `{projectId, path}`, decode the base64 `content` field, and trigger a browser download via a Blob + anchor click. Full working snippet is in this session's history if needed again.
