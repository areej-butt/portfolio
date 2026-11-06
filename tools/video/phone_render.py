"""Render a looping 3-phone walkthrough video from exported Figma screens.
usage: render.py <frames_dir> <out_basename> <W> <H> <bg_top_left_hex> <bg_bottom_right_hex> [seconds]"""
import sys, math, subprocess
from PIL import Image, ImageDraw, ImageFilter

import json
CFG = json.load(open(sys.argv[1]))
FR, OUT, W, H, BG1, BG2 = CFG['frames'], CFG['out'], CFG['W'], CFG['H'], CFG['bg1'], CFG['bg2']
LOOP = CFG.get('loop', 15.0)
FPS = 30
def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

# flows: (file, tap point in 393x852 screen px)
FLOWS = [[(f, tuple(p)) for f, p in flow] for flow in CFG['flows']]
OFFSETS = CFG.get('offsets', [0.0, 1.1, 2.2, 3.3])
NP = len(FLOWS)

# ---------- static layers ----------
def gradient(w, h, c1, c2):
    a, b = hexrgb(c1), hexrgb(c2)
    g = Image.new('RGB', (w, h))
    px = g.load()
    for y in range(h):
        for x in range(0, w):
            t = (x / w + y / h) / 2
            px[x, y] = tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
    return g
bg = gradient(W // 4, H // 4, BG1, BG2).resize((W, H), Image.BICUBIC)

phone_h = int(H * CFG.get('phone_h', 0.80))
bez = max(6, int(phone_h * 0.016))
scr_h = phone_h - 2 * bez
scale = scr_h / 852
scr_w = int(393 * scale)
phone_w = scr_w + 2 * bez
rad_out, rad_in = int(phone_w * 0.14), int(phone_w * 0.14) - bez

mask = Image.new('L', (scr_w, scr_h), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, scr_w - 1, scr_h - 1), rad_in, fill=255)
body = Image.new('RGBA', (phone_w, phone_h), (0, 0, 0, 0))
ImageDraw.Draw(body).rounded_rectangle((0, 0, phone_w - 1, phone_h - 1), rad_out, fill=(30, 30, 36, 255))
shadow = Image.new('RGBA', (phone_w + 80, phone_h + 80), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle((40, 52, 40 + phone_w, 52 + phone_h), rad_out, fill=(40, 30, 60, 70))
shadow = shadow.filter(ImageFilter.GaussianBlur(22))

screens = [[(Image.open(f'{FR}/{f}').convert('RGB').resize((scr_w, scr_h), Image.LANCZOS), (tx * scale, ty * scale)) for f, (tx, ty) in flow] for flow in FLOWS]

gap = int(phone_w * CFG.get('gap', 0.22))
total = NP * phone_w + (NP - 1) * gap
x0 = (W - total) // 2
cols = [x0 + i * (phone_w + gap) for i in range(NP)]
base_y = (H - phone_h) // 2

def ease(t): return t * t * (3 - 2 * t)
TAP, SLIDE = 0.5, 0.5

def screen_at(i, t):
    flow = screens[i]; n = len(flow); slot = LOOP / n
    tt = (t + OFFSETS[i]) % LOOP
    k = int(tt // slot); local = tt - k * slot
    cur, nxt = flow[k], flow[(k + 1) % n]
    canvas = cur[0].copy()
    tap = None
    s_start = slot - SLIDE
    t_start = s_start - TAP
    if t_start <= local < s_start:
        tap = (cur[1], (local - t_start) / TAP)
    if local >= s_start:
        p = ease((local - s_start) / SLIDE)
        canvas = Image.new('RGB', (scr_w, scr_h))
        old = cur[0]
        if p < 1:
            dark = Image.blend(old, Image.new('RGB', old.size, (0, 0, 0)), 0.18 * p)
            canvas.paste(dark, (int(-0.3 * scr_w * p), 0))
        canvas.paste(nxt[0], (int(scr_w * (1 - p)), 0))
    if tap:
        (tx, ty), q = tap
        ov = Image.new('RGBA', (scr_w, scr_h), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
        r = 10 + 26 * ease(min(1, q * 1.3)); a = int(150 * (1 - q))
        d.ellipse((tx - r, ty - r, tx + r, ty + r), fill=(255, 255, 255, a // 2), outline=(255, 255, 255, a), width=3)
        dr = 11 * (1 - 0.4 * q)
        d.ellipse((tx - dr, ty - dr, tx + dr, ty + dr), fill=(40, 30, 50, int(110 * (1 - q * 0.8))))
        canvas = Image.alpha_composite(canvas.convert('RGBA'), ov).convert('RGB')
    return canvas

def frame(t):
    f = bg.copy().convert('RGBA')
    for i in range(NP):
        bob = math.sin(2 * math.pi * (t / LOOP) * 2 + i * 2.1) * H * 0.006
        lift = -int(H * 0.025) if (NP == 3 and i == 1) else 0
        x, y = cols[i], int(base_y + bob + lift)
        f.alpha_composite(shadow, (x - 40, y - 40))
        f.alpha_composite(body, (x, y))
        sc = screen_at(i, t)
        f.paste(sc, (x + bez, y + bez), mask)
    return f.convert('RGB')

N = int(LOOP * FPS)
raw = f'{OUT}.yuv.mp4'
p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                      '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', f'{OUT}.mp4'], stdin=subprocess.PIPE)
for n in range(N):
    p.stdin.write(frame(n / FPS).tobytes())
    if n == 0: frame(0).save(f'{OUT}-poster.jpg', quality=88)
p.stdin.close(); p.wait()
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{OUT}.mp4', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', '-an', f'{OUT}.webm'], check=True)
print('done', N, 'frames')
