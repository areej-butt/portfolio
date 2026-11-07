/* Night mode.
   - Adds a sun/moon switch to every <button class="nm-toggle"> (placed in each page's nav).
   - The choice is remembered (localStorage "theme"); default is the light theme.
   - Pages style colours inline (and the .dc pages rewrite those styles while running), so instead of a fixed
     list of overrides this remaps colours by rule: light surfaces become deep ink-navy (keeping a hint of their
     hue), dark text becomes light, light borders become subtle dark lines. Photos, videos and accents are left
     alone. A final pass lifts any text that ends up with poor contrast. Originals are stored and restored exactly. */
(function () {
  var KEY = 'theme', root = document.documentElement;
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  var dark = saved === 'dark';
  var PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-right-color',
               'border-bottom-color', 'border-left-color', 'outline-color'];

  /* ---------- colour maths ---------- */
  function parse(s) {
    var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/.exec(s);
    if (!m) return null;
    var a = m[4] == null ? 1 : (m[4].slice(-1) === '%' ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    return [+m[1], +m[2], +m[3], a];
  }
  function hexToRgb(h) {
    h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  function hsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0;
    if (mx !== mn) { var d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return [h, s, l];
  }
  function rgb(h, s, l, a) {
    function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1/6 ? p + (q - p) * 6 * t : t < 1/2 ? q : t < 2/3 ? p + (q - p) * (2/3 - t) * 6 : p; }
    var r, g, b; if (!s) r = g = b = l; else { var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; r = f(p, q, h + 1/3); g = f(p, q, h); b = f(p, q, h - 1/3); }
    var o = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    return a < 1 ? 'rgba(' + o.join(', ') + ', ' + a + ')' : 'rgb(' + o.join(', ') + ')';
  }
  function lum(c) { var v = c.slice(0, 3).map(function (x) { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }

  // light surface -> deep ink-navy that keeps a hint of its hue
  // near-white surfaces (cream page, white cards) -> ink-navy, with cards a touch lighter than the page;
  // pastel panels keep a hint of their own hue
  function surf(c) {
    var t = hsl(c); if (t[2] < .8) return null;
    var chroma = Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]);
    if (t[2] >= .93 && chroma <= 12) return rgb(.64, .2, Math.max(.1, .11 + (t[2] - .955) * 1.35), c[3]);
    return rgb(t[0], Math.max(.14, t[1] * .45), .13 + (.93 - t[2]) * .45, c[3]);
  }
  // dark text -> light text (keeps hue)
  function ink(c) { var t = hsl(c); if (t[2] >= .45) return null; return rgb(t[0], Math.min(.55, t[1] * .9), .87 - t[2] * .22, c[3]); }
  // light border -> subtle dark line
  function line(c) { var t = hsl(c); if (t[2] < .72) return null; return rgb(t[1] < .06 ? .66 : t[0], Math.max(.12, t[1] * .35), .25, c[3]); }
  function mapValue(prop, v) {
    if (!v || v === 'none' || v.indexOf('var(') > -1 || v.indexOf('url(') > -1) return null;
    if (prop === 'background-image') {
      if (v.indexOf('gradient') < 0) return null;
      var changed = false;
      var out = v.replace(/rgba?\([^)]*\)/g, function (m) { var c = parse(m), n = c && surf(c); if (n) { changed = true; return n; } return m; });
      return changed ? out : null;
    }
    var c = parse(v); if (!c && /^#[0-9a-f]{3,6}$/i.test(v.trim())) c = hexToRgb(v.trim()); if (!c || c[3] === 0) return null;
    if (prop === 'color') return ink(c);
    if (prop === 'background-color') return surf(c);
    return line(c);
  }

  /* ---------- stylesheet rules (helmet CSS, summary-page CSS, custom properties) ---------- */
  var ruleOrig = [];
  function eachRule(list, fn) {
    for (var i = 0; i < list.length; i++) { var r = list[i];
      if (r.style && r.selectorText && r.selectorText.indexOf('nm-') < 0) fn(r);
      if (r.cssRules) eachRule(r.cssRules, fn); }
  }
  function sheetsDark() {
    for (var i = 0; i < document.styleSheets.length; i++) {
      var sh = document.styleSheets[i], rules; try { rules = sh.cssRules; } catch (e) { continue; }
      if (!rules || sh.__nm) continue; sh.__nm = true;
      eachRule(rules, function (r) {
        var st = r.style;
        for (var j = 0; j < st.length; j++) {
          var p = st[j], v = st.getPropertyValue(p).trim(), n = null;
          if (p.indexOf('--') === 0) {          // custom properties: only clear-cut surfaces and neutral inks
            var c = parse(v) || (/^#[0-9a-f]{3,6}$/i.test(v) ? hexToRgb(v) : null); if (!c) continue;
            var t = hsl(c); n = t[2] >= .8 ? surf(c) : (t[2] < .42 && t[1] < .3) ? ink(c) : (t[2] >= .72 ? line(c) : null);
          } else if (PROPS.indexOf(p) > -1 || p === 'background') {
            if (p === 'background') { var c2 = parse(st.getPropertyValue('background-color')); n = null;
              if (c2 && surf(c2)) { ruleOrig.push([st, 'background-color', st.getPropertyValue('background-color'), st.getPropertyPriority('background-color')]); st.setProperty('background-color', surf(c2), st.getPropertyPriority('background-color')); }
              continue; }
            n = mapValue(p, v);
          }
          if (n) { ruleOrig.push([st, p, v, st.getPropertyPriority(p)]); st.setProperty(p, n, st.getPropertyPriority(p)); }
        }
      });
    }
  }
  function sheetsLight() {
    for (var i = ruleOrig.length - 1; i >= 0; i--) { var o = ruleOrig[i]; o[0].setProperty(o[1], o[2], o[3]); }
    ruleOrig = []; for (var k = 0; k < document.styleSheets.length; k++) document.styleSheets[k].__nm = false;
  }

  /* ---------- inline styles ---------- */
  var busy = false;
  function origOf(el) {
    if (el.__nm) return el.__nm;
    var a = el.getAttribute('data-nm');            // survives the .dc pages copying their own HTML
    el.__nm = a ? JSON.parse(a) : {};
    return el.__nm;
  }
  function inlineDark(el) {
    var st = el.style; if (!st || !st.length) return;
    var o = origOf(el), applied = el.__nma || (el.__nma = {}), dirty = false;
    for (var i = 0; i < PROPS.length; i++) {
      var p = PROPS[i], v = st.getPropertyValue(p);
      if (!v) continue;
      if (applied[p] === v) continue;                // already ours
      var n = mapValue(p, v); if (!n) continue;
      o[p] = v; applied[p] = n; st.setProperty(p, n, st.getPropertyPriority(p)); dirty = true;
    }
    if (dirty) el.setAttribute('data-nm', JSON.stringify(o));
  }
  function inlineLight(el) {
    var o = origOf(el), applied = el.__nma || {};
    for (var p in o) { var cur = el.style.getPropertyValue(p); if (!applied[p] || cur === applied[p]) el.style.setProperty(p, o[p]); }
    el.__nm = null; el.__nma = null; el.removeAttribute('data-nm');
    if (el.__nmc != null) { el.style.color = el.__nmc; el.__nmc = null; }
  }

  /* ---------- contrast safety pass ---------- */
  function bgOf(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) {
      var cs = getComputedStyle(e);
      // a gradient paints over the background colour, so check it first
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && cs.backgroundImage.indexOf('gradient') > -1) { var s = parse(cs.backgroundImage); if (s) return s; }
      var c = parse(cs.backgroundColor);
      if (c && c[3] > .5) return c;
      if (/^(IMG|VIDEO)$/.test(e.tagName) || e.hasAttribute('data-video')) return null;
    }
    return [20, 22, 31, 1];
  }
  function fixContrast(scope) {
    var els = (scope || document.body).querySelectorAll('*');
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (/^(SCRIPT|STYLE|SVG|PATH|IMG|VIDEO|svg|path)$/.test(el.tagName)) continue;
      var hasText = false; for (var k = el.firstChild; k; k = k.nextSibling) if (k.nodeType === 3 && k.nodeValue.trim()) { hasText = true; break; }
      if (!hasText) continue;
      var c = parse(getComputedStyle(el).color), b = bgOf(el); if (!c || !b) continue;
      // text we lightened that sits on a surface that stayed light: give it its original colour back
      if (lum(b) > .4 && el.__nma && el.__nma.color && contrast(c, b) < 4.5) {
        el.style.color = el.__nm.color; el.__nma.color = el.__nm.color; continue;
      }
      if (lum(c) < .35 && lum(b) < .2 && contrast(c, b) < 4.5) {
        if (el.__nmc == null) el.__nmc = el.style.color || '';
        var t = hsl(c), L = Math.max(.72, t[2]), fixed;
        do { fixed = rgb(t[0], Math.min(.5, t[1]), L, c[3]); L += .04; } while (L < .95 && contrast(parse(fixed), b) < 4.5);
        el.style.color = fixed;
      }
    }
  }

  /* ---------- apply / remove ---------- */
  function applyDark() {
    busy = true;
    sheetsDark();
    var els = document.querySelectorAll('[style]'); for (var i = 0; i < els.length; i++) inlineDark(els[i]);
    fixContrast();
    busy = false;
  }
  function applyLight() {
    busy = true;
    sheetsLight();
    var els = document.querySelectorAll('[data-nm], [style]'); for (var i = 0; i < els.length; i++) if (els[i].__nm || els[i].hasAttribute('data-nm') || els[i].__nmc != null) inlineLight(els[i]);
    busy = false;
  }
  var pend = null;
  function soon() { if (pend) return; pend = setTimeout(function () { pend = null; if (dark) applyDark(); }, 90); }

  /* ---------- the switch ---------- */
  var css = document.createElement('style');
  css.textContent =
    'html.dark{background:#14161F;color-scheme:dark}' +
    'html.dark.nm-pending body{opacity:0}' +
    'html.nm-anim,html.nm-anim *{transition:background-color .45s ease,color .45s ease,border-color .45s ease!important}' +
    '.nm-toggle{position:relative;width:54px;height:30px;flex-shrink:0;border-radius:100px;border:1px solid rgba(33,31,46,.08);background:#EFE8DA;cursor:pointer;padding:0;transition:background-color .4s}' +
    'html.dark .nm-toggle{background:#2B3150;border-color:rgba(255,255,255,.08)}' +
    '.nm-toggle .nm-k{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#F6C453;box-shadow:0 0 0 3px rgba(246,196,83,.25);transition:transform .45s cubic-bezier(.3,1.5,.5,1),background .4s,box-shadow .4s}' +
    'html.dark .nm-toggle .nm-k{transform:translateX(24px);background:#E8E4F5;box-shadow:inset -6px -2px 0 #B6AFD3}' +
    '.nm-toggle:focus-visible{outline:2px solid #2F7A6F;outline-offset:3px}' +
    '.nm-toggle .nm-s{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;opacity:0;transition:opacity .4s}' +
    'html.dark .nm-toggle .nm-s{opacity:.9}' +
    '@media (prefers-reduced-motion:reduce){.nm-toggle .nm-k,html.nm-anim *{transition:none!important}}';
  document.head.appendChild(css);
  if (dark) root.classList.add('dark', 'nm-pending');

  function fill(btn) {
    if (btn.querySelector('.nm-k')) return;
    btn.innerHTML = '<span class="nm-s" style="top:8px;left:9px"></span><span class="nm-s" style="top:17px;left:15px"></span><span class="nm-k"></span>';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    btn.setAttribute('aria-label', 'Night mode');
    btn.setAttribute('title', dark ? 'Switch to day mode' : 'Switch to night mode');
  }
  function fillAll() { var b = document.querySelectorAll('.nm-toggle'); for (var i = 0; i < b.length; i++) fill(b[i]); }
  function set(d) {
    dark = d; try { localStorage.setItem(KEY, d ? 'dark' : 'light'); } catch (e) {}
    root.classList.add('nm-anim'); setTimeout(function () { root.classList.remove('nm-anim'); }, 600);
    root.classList.toggle('dark', d);
    if (d) applyDark(); else applyLight();
    var b = document.querySelectorAll('.nm-toggle');
    for (var i = 0; i < b.length; i++) { b[i].setAttribute('aria-pressed', d ? 'true' : 'false'); b[i].setAttribute('title', d ? 'Switch to day mode' : 'Switch to night mode'); }
  }
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('.nm-toggle'); if (t) { e.preventDefault(); set(!dark); } });

  function start() {
    fillAll();
    new MutationObserver(function (muts) {
      fillAll();
      if (!dark || busy) return;
      for (var i = 0; i < muts.length; i++) { var m = muts[i];
        if (m.type === 'attributes' && m.target.__nma) { var st = m.target.style, a = m.target.__nma, own = true;
          for (var p in a) if (st.getPropertyValue(p) !== a[p]) { own = false; break; }
          if (own) continue; }
        soon(); return; }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    if (dark) { applyDark(); setTimeout(function () { applyDark(); root.classList.remove('nm-pending'); }, 400); setTimeout(function () { root.classList.remove('nm-pending'); }, 1500); }
    window.addEventListener('load', function () { if (dark) applyDark(); });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
