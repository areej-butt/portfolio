/* Scroll motion for the full case studies (matches the summary pages):
   - .tl timelines draw their line and pop their dots in when they scroll into view
   - each section below the first screen fades up as it arrives
   Content is never hidden without JS, and reduced-motion users get everything at once. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window)) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); countUp(e.target); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });

  // numbers marked data-count="78.1" (optional data-dec) count up from 0 when their block arrives
  function countUp(scope) {
    var nums = scope.querySelectorAll ? scope.querySelectorAll('[data-count]') : [];
    for (var i = 0; i < nums.length; i++) (function (el) {
      var to = parseFloat(el.getAttribute('data-count')), dec = +(el.getAttribute('data-dec') || 0);
      if (reduce || isNaN(to)) { el.textContent = to.toFixed(dec); return; }
      var t0 = performance.now(), D = 1200;
      (function f(t) { var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
        el.textContent = (to * e).toFixed(dec); if (k < 1) requestAnimationFrame(f); })(t0);
    })(nums[i]);
  }

  function watch(el) {
    if (el.__cm) return;
    el.__cm = true;
    if (reduce) { el.classList.add('in'); countUp(el); return; }
    io.observe(el);
  }

  function sections() {
    var anchor = document.getElementById('overview') || document.getElementById('timeline');
    if (!anchor || !anchor.parentElement) return [];
    var kids = anchor.parentElement.children, out = [];
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i], cs = getComputedStyle(k);
      if (cs.position === 'fixed' || cs.position === 'sticky' || k.tagName === 'SCRIPT') continue;
      if (k.getBoundingClientRect().top < window.innerHeight) continue;   // already on screen: leave it
      out.push(k);
    }
    return out;
  }

  /* role filter buttons (EquityFlow "who can do what") */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-role-btn]');
    if (!b) return;
    var root = b.closest('.roles'); if (!root) return;
    var v = b.getAttribute('data-role-btn');
    root.setAttribute('data-role', v);
    var all = root.querySelectorAll('[data-role-btn]');
    for (var i = 0; i < all.length; i++) all[i].setAttribute('aria-pressed', all[i] === b ? 'true' : 'false');
  });

  /* pan + zoom canvas (EquityFlow moodboard): drag to pan, wheel/pinch to zoom, buttons for +, -, fit */
  function canvas(el) {
    if (el.__cv) return; el.__cv = true;
    var img = el.querySelector('img'); if (!img) return;
    var s = 1, x = 0, y = 0, fitS = 1, hi = false, pts = {}, last = null, pinch = null;
    function apply() { img.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')'; }
    function clamp() {
      var W = el.clientWidth, H = el.clientHeight, w = img.naturalWidth * s, h = img.naturalHeight * s;
      x = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, x));
      y = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, y));
    }
    function fit() { if (!img.naturalWidth) return; fitS = Math.min(el.clientWidth / img.naturalWidth, el.clientHeight / img.naturalHeight); s = fitS; clamp(); apply(); }
    function zoomAt(f, cx, cy) {
      var ns = Math.min(fitS * 8, Math.max(fitS, s * f)); if (ns === s) return;
      x = cx - (cx - x) * (ns / s); y = cy - (cy - y) * (ns / s); s = ns; clamp(); apply(); used();
    }
    function used() {
      el.classList.add('used');
      if (!hi && img.getAttribute('data-full')) { hi = true; var f = new Image(); f.onload = function () { var r = img.naturalWidth / f.naturalWidth; img.src = f.src; s *= r; fitS *= r; clamp(); apply(); }; f.src = img.getAttribute('data-full'); }
    }
    if (img.complete) fit(); else img.addEventListener('load', fit);
    window.addEventListener('resize', fit);
    el.addEventListener('wheel', function (e) { e.preventDefault(); var r = el.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    el.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; el.setPointerCapture(e.pointerId); pts[e.pointerId] = [e.clientX, e.clientY]; last = [e.clientX, e.clientY]; el.classList.add('drag'); });
    el.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return; pts[e.pointerId] = [e.clientX, e.clientY];
      var ids = Object.keys(pts);
      if (ids.length === 2) {
        var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = el.getBoundingClientRect();
        if (pinch) zoomAt(d / pinch, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top);
        pinch = d; return;
      }
      x += e.clientX - last[0]; y += e.clientY - last[1]; last = [e.clientX, e.clientY]; clamp(); apply(); used();
    });
    function up(e) { delete pts[e.pointerId]; pinch = null; if (!Object.keys(pts).length) el.classList.remove('drag'); }
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var act = b.getAttribute('data-cv'), W = el.clientWidth / 2, H = el.clientHeight / 2;
      if (act === 'in') zoomAt(1.5, W, H); else if (act === 'out') zoomAt(1 / 1.5, W, H); else { fit(); }
    });
  }

  function rendered() {
    var dot = document.querySelector('.tl .tl-dot');
    return dot && dot.textContent.indexOf('{{') === -1 && dot.textContent.trim() !== '' && dot.isConnected;
  }
  function setup() {
    if (!rendered()) return;
    var tls = document.querySelectorAll('.tl, .sus, .fx');
    for (var cv = document.querySelectorAll('.cv'), q = 0; q < cv.length; q++) canvas(cv[q]);
    for (var i = 0; i < tls.length; i++) watch(tls[i]);
    if (reduce) return;
    var secs = sections();
    for (var j = 0; j < secs.length; j++) {
      if (secs[j].__cm) continue;
      secs[j].classList.add('cs-reveal');
      watch(secs[j]);
    }
  }
  // The .dc.html pages render after load (and may re-render), so keep an eye out for new content.
  var t = null;
  function soon() { clearTimeout(t); t = setTimeout(setup, 120); }
  function start() {
    soon();
    new MutationObserver(soon).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
