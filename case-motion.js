/* Scroll motion for the full case studies (matches the summary pages):
   - .tl timelines draw their line and pop their dots in when they scroll into view
   - each section below the first screen fades up as it arrives
   Content is never hidden without JS, and reduced-motion users get everything at once. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window)) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });

  function watch(el) {
    if (el.__cm) return;
    el.__cm = true;
    if (reduce) { el.classList.add('in'); return; }
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

  function rendered() {
    var dot = document.querySelector('.tl .tl-dot');
    return dot && dot.textContent.indexOf('{{') === -1 && dot.isConnected;
  }
  function setup() {
    if (!rendered()) return;
    var tls = document.querySelectorAll('.tl');
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
