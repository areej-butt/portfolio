/* Video previews: turns <div data-video="name" data-alt="..."> into a silent, looping
   video from uploads/video/<name>.mp4, with uploads/video/<name>.jpg as the still frame.
   - Only plays while on screen (saves battery and CPU).
   - Reduced motion: shows the still frame only.
   - Works for elements rendered later (the .dc.html pages render after load). */
(function () {
  var BASE = 'uploads/video/';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tryPlay(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      e.target.__vis = e.isIntersecting;
      var v = e.target.querySelector('video');
      if (!v) return;
      if (e.isIntersecting) tryPlay(v); else v.pause();
    });
  }, { threshold: 0.2 }) : null;

  var css = document.createElement('style');
  css.textContent =
    '[data-video]{position:relative;overflow:hidden;background:#EEE9DF}' +
    '[data-video] img,[data-video] video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit}' +
    '[data-video] video{opacity:0;transition:opacity .4s ease}' +
    '[data-video] video.vp-on{opacity:1}';
  document.head.appendChild(css);

  function init(el) {
    var name = el.getAttribute('data-video');
    if (!name || name.indexOf('{{') !== -1) return;   // template not filled in yet
    if (el.__vp === name) {          // already set up: resume if it was paused by a re-render
      var cur = el.querySelector('video');
      if (cur && el.__vis && cur.paused) tryPlay(cur);
      return;
    }
    if (el.__vp) { if (io) io.unobserve(el); while (el.firstChild) el.removeChild(el.firstChild); }
    el.__vp = name;
    var alt = el.getAttribute('data-alt') || '';
    var img = document.createElement('img');
    img.src = BASE + name + '.jpg'; img.alt = alt; img.decoding = 'async';
    el.appendChild(img);
    if (reduce) return;
    var v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.preload = 'metadata';
    v.src = BASE + name + '.mp4';
    v.addEventListener('playing', function () { v.classList.add('vp-on'); });
    v.addEventListener('canplay', function () { if (el.__vis && v.paused) tryPlay(v); });
    v.addEventListener('pause', function () {   // paused by the page re-rendering, not by scrolling away
      setTimeout(function () { if (el.__vis && v.paused && v.isConnected) tryPlay(v); }, 120);
    });
    el.appendChild(v);
    if (io) io.observe(el); else tryPlay(v);
  }

  function scan(root) {
    if (root.nodeType !== 1) return;
    if (root.hasAttribute && root.hasAttribute('data-video')) init(root);
    var list = root.querySelectorAll ? root.querySelectorAll('[data-video]') : [];
    for (var i = 0; i < list.length; i++) init(list[i]);
  }

  function start() {
    scan(document.body);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        for (var i = 0; i < m.addedNodes.length; i++) scan(m.addedNodes[i]);
        if (m.type === 'attributes') scan(m.target);
      });
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-video'] });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
