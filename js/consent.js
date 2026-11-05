/* StarNex Studio: analytics consent. Google Analytics loads only after "Accept" and only on the production domain.
   Sends page views and clicks on contact links. Never sends names, numbers or message text. */
(function () {
  var KEY = 'sn_consent', box = document.getElementById('consent'), me = document.currentScript, id = me && me.dataset.ga, loaded = false;
  if (!box) return;
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function clearCookies() { document.cookie.split(';').forEach(function (c) { var n = c.split('=')[0].trim(); if (/^_ga/.test(n)) ['', '; domain=.' + location.hostname.replace(/^www\./, '')].forEach(function (d) { document.cookie = n + '=; Max-Age=0; path=/' + d; }); }); }
  function load() {
    if (loaded || !id || location.hostname !== 'starnexstudio.com') return; loaded = true;
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', id);
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id; document.head.appendChild(s);
  }
  function decide(v) { set(v); box.hidden = true; if (v === 'granted') load(); else { if (window['ga-disable-' + id] !== true) window['ga-disable-' + id] = true; clearCookies(); } }
  box.addEventListener('click', function (e) { var b = e.target.closest('[data-consent]'); if (b) decide(b.dataset.consent); });
  document.addEventListener('click', function (e) {
    if (e.target.closest('.consent-open')) { box.hidden = false; var f = box.querySelector('button'); if (f) f.focus(); return; }
    var a = e.target.closest('a[href]'); if (!a || !window.gtag) return;
    var h = a.getAttribute('href'), m = /^https:\/\/wa\.me\//.test(h) ? 'whatsapp' : /^tel:/.test(h) ? 'phone' : /^mailto:/.test(h) ? 'email' : /instagram\.com/.test(h) ? 'instagram' : '';
    if (m) gtag('event', 'contact_click', { method: m });
  });
  var c = get(); if (c === 'granted') load(); else if (c !== 'denied') box.hidden = false;
})();
