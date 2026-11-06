/* Trailing sparkle cursor.
   Include in <head> with optional colours:
   <script src="sparkle-cursor.js" data-dot="#2F7A6F" data-spark="#D97D5E" defer></script>
   Only runs on devices with a real mouse, and stays off for reduced-motion users.
   Add data-native-cursor to any element that should keep its own cursor (e.g. the bug game). */
(function () {
  var script = document.currentScript || {};
  var data = script.dataset || {};
  var DOT = data.dot || '#2F7A6F';
  var SPARK = data.spark || '#D97D5E';

  if (!window.matchMedia) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var HOT = 'a, button, [role="button"], label, summary, select, [onclick], [style*="cursor:pointer"], [style*="cursor: pointer"]';
  var TYPE = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';
  var NATIVE = '[data-native-cursor]';

  var css = document.createElement('style');
  css.textContent =
    'html.sc-on, html.sc-on *:not(' + NATIVE + '):not(' + NATIVE + ' *) { cursor: none !important; }' +
    'html.sc-on ' + TYPE.split(', ').join(', html.sc-on ') + ' { cursor: text !important; }' +
    '.sc-layer { position: fixed; left: 0; top: 0; width: 0; height: 0; pointer-events: none; z-index: 2147483000; }' +
    '.sc-el { position: absolute; left: 0; top: 0; will-change: transform; transition: opacity 0.2s ease; }';
  document.head.appendChild(css);

  var layer = document.createElement('div');
  layer.className = 'sc-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML =
    '<div class="sc-el sc-halo" style="width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:1.5px solid ' + SPARK + ';opacity:0"></div>' +
    '<svg class="sc-el sc-star" width="18" height="18" viewBox="0 0 24 24" style="margin:-9px 0 0 -9px;opacity:0"><path fill="' + SPARK + '" d="M12 0 14.6 9.4 24 12 14.6 14.6 12 24 9.4 14.6 0 12 9.4 9.4Z"/></svg>' +
    '<div class="sc-el sc-dot" style="width:7px;height:7px;margin:-3.5px 0 0 -3.5px;border-radius:50%;background:' + DOT + ';opacity:0"></div>';
  var halo = layer.children[0], star = layer.children[1], dot = layer.children[2];

  var mx = -100, my = -100, sx = -100, sy = -100;
  var seen = false, inside = false, hot = false, hidden = false;
  var spin = 0, kick = 0, press = 0, hotEase = 0, last = performance.now();

  function attach() {
    if (!layer.isConnected && document.body) document.body.appendChild(layer);
  }

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (!seen) { seen = true; sx = mx + 14; sy = my + 14; document.documentElement.classList.add('sc-on'); }
    inside = true;
    var t = e.target && e.target.closest ? e.target : null;
    hidden = !!(t && (t.closest(NATIVE) || t.closest(TYPE)));
    hot = !hidden && !!(t && t.closest(HOT));
  }, { passive: true });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) inside = false; });
  document.addEventListener('mousedown', function () { press = 1; });
  window.addEventListener('wheel', function (e) { kick += Math.max(-80, Math.min(80, e.deltaY)); }, { passive: true });
  window.addEventListener('blur', function () { inside = false; });

  function tick(now) {
    var dt = Math.min(40, now - last); last = now;
    attach();
    var f = function (rate) { return 1 - Math.pow(1 - rate, dt / 16.67); };
    sx += (mx + 14 - sx) * f(0.12);
    sy += (my + 14 - sy) * f(0.12);
    kick *= Math.pow(0.9, dt / 16.67);
    press *= Math.pow(0.82, dt / 16.67);
    hotEase += ((hot ? 1 : 0) - hotEase) * f(0.25);
    spin += dt * 0.05 + kick * 0.5;

    var show = seen && inside && !hidden ? 1 : 0;
    // Over something clickable the sparkle snaps onto the pointer and the dot gives way to a halo.
    var x = sx + (mx - sx) * hotEase, y = sy + (my - sy) * hotEase;
    star.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + spin + 'deg) scale(' + (1 + 0.2 * hotEase) + ')';
    dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) scale(' + ((1 - hotEase) * (1 - 0.5 * press)) + ')';
    halo.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) scale(' + (0.3 + hotEase - 0.15 * press) + ')';
    star.style.opacity = show;
    dot.style.opacity = show;
    halo.style.opacity = show * hotEase;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
