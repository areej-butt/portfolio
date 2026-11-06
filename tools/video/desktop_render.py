"""EquityFlow videos from 1280x900 hi-fi screenshots: cursor clicks + transitions, or camera 'focus' moves."""
import sys, json, math, subprocess, glob
from PIL import Image, ImageDraw
CFG = json.load(open(sys.argv[1])); REPO = CFG['repo']; OUT = CFG['out']
SW, SH = 1280, CFG.get('crop_h', 900); W, H = CFG.get('W', 1120), CFG.get('H', 788); FPS = 30
CROP_H = CFG.get('crop_h')
def scr(tag):
    im = Image.open(glob.glob(f'{REPO}/uploads/screens-*-{tag}.png')[0]).convert('RGB')
    return im.crop((0, 0, 1280, CROP_H)) if CROP_H else im
def ease(t): t = max(0, min(1, t)); return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t

ARROW = [(0, 0), (0, 25), (6, 19), (10.5, 29), (14.5, 27.3), (10.2, 17.6), (18, 17.6)]
def draw_cursor(img, x, y, press=0.0, ripple=None):
    d = ImageDraw.Draw(img, 'RGBA')
    if ripple is not None:
        r = 8 + 34 * ease(ripple); a = int(170 * (1 - ripple))
        d.ellipse((x - r, y - r, x + r, y + r), outline=(191, 103, 133, a), width=3)
        d.ellipse((x - r * .55, y - r * .55, x + r * .55, y + r * .55), fill=(191, 103, 133, a // 4))
    s = 1.15 * (1 - 0.12 * press)
    pts = [(x + px * s, y + py * s) for px, py in ARROW]
    sh = [(px + 1.5, py + 2.5) for px, py in pts]
    d.polygon(sh, fill=(0, 0, 0, 70))
    d.polygon(pts, fill=(255, 255, 255, 255), outline=(20, 20, 30, 255))
    d.line(pts + [pts[0]], fill=(20, 20, 30, 255), width=2)

def camera(img, cx, cy, z):
    w, h = SW / z, SH / z
    x0 = min(max(cx - w / 2, 0), SW - w); y0 = min(max(cy - h / 2, 0), SH - h)
    return img.crop((int(x0), int(y0), int(x0 + w), int(y0 + h))).resize((W, H), Image.LANCZOS), (x0, y0, w, h)

def frames_flow():
    steps = CFG['steps']; slot = CFG['slot']; n = len(steps); L = slot * n
    shots = [scr(s['screen']) for s in steps]
    for f in range(int(L * FPS)):
        t = f / FPS; k = int(t // slot); u = (t - k * slot) / slot
        cur, nxt = steps[k], steps[(k + 1) % n]
        prev_xy = steps[k - 1]['click'] if k > 0 else steps[-1]['click']
        tx, ty = cur['click']
        # cursor: settle 0-.15, travel .15-.55, click at .62, transition .80-1
        m = ease((u - 0.15) / 0.40)
        cx, cy = lerp(prev_xy[0], tx, m), lerp(prev_xy[1], ty, m)
        # gentle arc
        cy -= math.sin(math.pi * m) * 40
        press = 1.0 if 0.60 <= u < 0.66 else 0.0
        rip = (u - 0.60) / 0.22 if 0.60 <= u < 0.82 else None
        if u < 0.80:
            frame = shots[k].copy()
        else:
            p = ease((u - 0.80) / 0.20)
            a = shots[k]; b = shots[(k + 1) % n]
            frame = Image.blend(a, b, p)
        draw_cursor(frame, cx, cy, press, rip)
        yield frame.resize((W, H), Image.LANCZOS)

def frames_focus():
    img = scr(CFG['screen']); L = CFG['loop']
    keys = CFG['cam']   # [t, cx, cy, zoom]
    curk = CFG.get('cursor', [])  # [t, x, y, click(0/1)]
    rings = CFG.get('rings', [])  # [t0, t1, x0, y0, x1, y1]
    def interp(keys, t):
        for i in range(len(keys) - 1):
            a, b = keys[i], keys[i + 1]
            if a[0] <= t <= b[0]:
                q = ease((t - a[0]) / (b[0] - a[0] or 1))
                return [lerp(a[j], b[j], q) for j in range(1, len(a))]
        return keys[-1][1:]
    for f in range(int(L * FPS)):
        t = f / FPS
        frame = img.copy()
        d = ImageDraw.Draw(frame, 'RGBA')
        for t0, t1, x0, y0, x1, y1 in rings:
            if t0 <= t <= t1:
                q = min(1, (t - t0) / 0.5, (t1 - t) / 0.5)
                pulse = 0.5 + 0.5 * math.sin((t - t0) * 4)
                pad = 6 + 3 * pulse
                d.rounded_rectangle((x0 - pad, y0 - pad, x1 + pad, y1 + pad), 12, outline=(191, 103, 133, int(230 * q)), width=4)
        if curk:
            x, y, _ = interp([[k[0], k[1], k[2], 0] for k in curk], t)
            press, rip = 0.0, None
            for k in curk:
                if k[3] and k[0] <= t < k[0] + 0.55:
                    press = 1.0 if t < k[0] + 0.08 else 0.0; rip = (t - k[0]) / 0.55
            draw_cursor(frame, x, y, press, rip)
        cx, cy, z = interp(keys, t)
        out, _ = camera(frame, cx, cy, z)
        yield out

gen = frames_flow() if CFG['mode'] == 'flow' else frames_focus()
p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                      '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', f'{OUT}.mp4'], stdin=subprocess.PIPE)
first = None
for i, fr in enumerate(gen):
    if first is None: first = fr; fr.save(f'{OUT}-poster.jpg', quality=88)
    p.stdin.write(fr.tobytes())
p.stdin.close(); p.wait()
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{OUT}.mp4', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', '-an', f'{OUT}.webm'], check=True)
print('done', OUT)
