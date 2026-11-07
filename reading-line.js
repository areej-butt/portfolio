/* Reading line: replaces the browser scrollbar (mouse devices only) with a hairline on the right edge
   that fills as you read, with a sparkle riding the tip. Colours come from this page's sparkle-cursor
   script (data-dot = line, data-spark = sparkle). Click or drag along the edge to jump.
   Touch devices keep their normal scrollbar. */
(function () {
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var cfg = document.querySelector('script[src*="sparkle-cursor"]');
  var line = (cfg && cfg.getAttribute('data-dot')) || '#2F7A6F';
  var spark = (cfg && cfg.getAttribute('data-spark')) || '#D97D5E';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = document.createElement('style');
  css.textContent =
    'html{scrollbar-width:none}html::-webkit-scrollbar{display:none;width:0;height:0}' +
    '#rl{position:fixed;top:14px;bottom:14px;right:0;width:22px;z-index:2147483000;cursor:pointer;touch-action:none}' +
    '#rl.rl-off{display:none}' +
    '#rl .rl-track{position:absolute;right:10px;top:0;bottom:0;width:2px;border-radius:2px;background:rgba(33,31,46,.08);transition:background .2s,width .2s,right .2s}' +
    '#rl .rl-fill{position:absolute;right:10px;top:0;width:2px;height:0;border-radius:2px;background:' + line + ';transition:width .2s,right .2s}' +
    '#rl:hover .rl-track,#rl.rl-drag .rl-track{width:4px;right:9px;background:rgba(33,31,46,.12)}' +
    '#rl:hover .rl-fill,#rl.rl-drag .rl-fill{width:4px;right:9px}' +
    '#rl .rl-tip{position:absolute;right:1px;width:20px;height:20px;margin-top:-10px;pointer-events:none}' +
    '#rl .rl-tip svg{display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.18))' + (reduce ? '' : ';animation:rlTwinkle 2.6s ease-in-out infinite') + '}' +
    '@keyframes rlTwinkle{0%,100%{transform:rotate(0) scale(1)}50%{transform:rotate(45deg) scale(.85)}}';
  document.head.appendChild(css);

  var el = document.createElement('div');
  el.id = 'rl';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="rl-track"></div><div class="rl-fill"></div><div class="rl-tip"><svg width="20" height="20" viewBox="0 0 20 20">' +
    '<path fill="' + spark + '" d="M10 1.5 11.9 8.1 18.5 10 11.9 11.9 10 18.5 8.1 11.9 1.5 10 8.1 8.1Z"/></svg></div>';
  var fill = el.querySelector('.rl-fill'), tip = el.querySelector('.rl-tip');
  var root = document.documentElement, queued = false;

  function max() { return Math.max(0, root.scrollHeight - window.innerHeight); }
  function paint() {
    queued = false;
    var m = max();
    el.classList.toggle('rl-off', m < 40);
    var f = m ? Math.min(1, Math.max(0, window.scrollY / m)) : 0;
    var y = f * el.clientHeight;
    fill.style.height = y + 'px';
    tip.style.top = y + 'px';
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(paint); } }

  function jump(clientY) {
    var r = el.getBoundingClientRect();
    var f = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    window.scrollTo(0, f * max());
  }
  var dragging = false;
  el.addEventListener('pointerdown', function (e) {
    dragging = true; el.classList.add('rl-drag'); el.setPointerCapture(e.pointerId); jump(e.clientY); e.preventDefault();
  });
  el.addEventListener('pointermove', function (e) { if (dragging) jump(e.clientY); });
  function end() { dragging = false; el.classList.remove('rl-drag'); }
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);

  function start() {
    document.body.appendChild(el);
    paint();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    // page height changes as the .dc.html pages render and images/videos load
    if ('ResizeObserver' in window) new ResizeObserver(queue).observe(document.body);
    else setInterval(queue, 1000);
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
