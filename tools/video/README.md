# Video preview tools

These scripts made the 18 looping previews in `uploads/video/` (`<name>.mp4` + `<name>.jpg` still frame).
They are not part of the site; `.vercelignore` keeps `tools/` off Vercel. Needs `ffmpeg`, Python 3 + Pillow,
Node + Playwright (Chromium).

After rendering, copy the `.mp4` into `uploads/video/` and regenerate its still frame (taken at 42% of the clip):

```bash
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 uploads/video/NAME.mp4)
ffmpeg -y -ss $(python3 -c "print(round($d*0.42,2))") -i uploads/video/NAME.mp4 -frames:v 1 -q:v 4 uploads/video/NAME.jpg
```

## 1. HoshiyarPK: `phone_render.py` (phones made from Figma screens)

`python3 tools/video/phone_render.py tools/video/configs/hpk-hero.json`

Config: `frames` (folder of 393x852 PNGs), `out`, `W`/`H`, background gradient `bg1`/`bg2`, `loop` seconds,
`phone_h` (phone height as share of H), `gap`, `offsets` (per-phone time offset), and `flows`: one list per phone of
`[file, [tapX, tapY]]` in 393x852 screen pixels. Each screen holds, shows a tap ripple at its tap point, then slides
to the next. Loops seamlessly. Replace `FRAMES_DIR` in the configs with your frames folder.

Frames are exported from the Figma file `69ytBgNnagjB1kAP7QzxHi` ("HoshiyarPK Hi-fi (Copy)", page
"FULL PROTOTYPE FLOW") with the Figma MCP `get_screenshot` tool, then downloaded from the returned URL
(the cloud environment must allow `www.figma.com`). Frame file → Figma node:

| file | node | screen | file | node | screen |
|---|---|---|---|---|---|
| 01.png | 427:946 | Landing | l1.png | 506:2230 | Learn Dashboard |
| 02.png | 427:962 | Language | l2.png | 506:2485 | Banking Track |
| 03.png | 427:1067 | Home | l3.png | 506:3002 | Bank Manager Fraud |
| 04.png | 636:17 | Practice Page | r2.png | 484:1987 | NCCIA |
| 05.png | 636:61 | Spoofed Calls | r3.png | 484:2121 | NCCIA tutorial |
| 06.png | 636:235 | Incoming call | s1.png | 636:318 | SMS Page |
| 07.png | 636:119 | Call Paused | s2.png | 636:484 | SMS Practice |
| 08.png | 636:168 | Call Completed | s3.png | 636:365 | SMS quiz done |
| 09.png | 521:4081 | Identify | e1.png | 636:711 | Spot the Errors |
| 10.png | 521:4458 | Verify Screenshot | e2.png | 636:561 | Email practice |
| 11.png | 484:1857 | Report | e3.png | 636:648 | Errors feedback |
| k1.png | 671:1320 | Scam-it | p1c.png | 595:6466 | Profile (crop the device border: box 38,12,431,865, resize to 393x852) |
| | | | p2c.png | 595:6557 | Profile Friends (same crop) |

Videos: `hpk-hero` (Landing/Language/Home, Practice call flow, Identify/Verify/Report),
`hpk-card` (Learn, Report), `hpk-gallery` (SMS, Spot the Errors, Scam-it/Profile).

## 2. EquityFlow: `desktop_render.py` (desktop screenshots + cursor)

`python3 tools/video/desktop_render.py tools/video/configs/ef-hero.json` (run from the repo root)

Source images are the 1280x900 hi-fi screens in `uploads/screens-*-<tag>.png`
(tags: `4wnb` browse, `b0xc` campaign detail, `i557` invest, `ykah` portfolio, `dmpr` identity, `awv6` suitability).
Two modes:
- `"mode": "flow"`: `steps` of `{screen, click:[x,y]}`; the cursor travels, clicks with a ripple, then crossfades
  to the next screen. `crop_h: 800` trims the prototype's state-switcher bar (used by `ef-card`, rendered 1120x700).
- `"mode": "focus"`: one `screen`, camera keyframes `cam: [t, centreX, centreY, zoom]`, cursor keyframes
  `cursor: [t, x, y, click(0/1)]`, pink highlight `rings: [t0, t1, x0, y0, x1, y1]`. All coordinates are 1280x900 px.

Videos: `ef-hero`, `ef-card`, and gallery `ef-detail`, `ef-invest`, `ef-portfolio`, `ef-identity`, `ef-finances`.

## 3. Marine Link: `site_record.js` (records the live site)

Records https://areej-butt.github.io/marine-link/ with Chrome's screencast (needs that host allowed), adds a soft
cursor with click ripples, and crossfades the end into the first frame so it loops.

`S=/some/work/dir node tools/video/site_record.js ml-hero ml-card ml-card-front ml-card-flip ml-search-browse ml-search-find ml-map ml-quiz`

`S` must contain `vid/` (output) and `ml/` (temp frames) folders. Each clip is a `[prep, act]` pair at the bottom
of the file. Gotchas: creatures are always moving, so click them by coordinates (`tap()` does this); "tap to flip" /
"flip back" are text, not buttons (`tapText()`); quiz answers are `role="button"`, and the ocean behind the quiz has
off-screen copies of the same creature images; "next question" is lowercase. Open quiz/search/map after scrolling
to 900px, or the "Sunlight Zone" title overlaps the popup (a bug on the Marine Link site itself).

## Summary pages

`tools/summary_generator_reference.py` is the script that first generated `EquityFlow-summary.html` and
`MarineLink-summary.html` from `HoshiyarPK-summary.html`. It's kept for reference only: the three summary pages
are now edited directly. Don't rerun it, it would overwrite later edits.
