/* StarNex Studio: service pages. Smooth scroll, menu, scroll reveals and the particle hero. */
(() => {
'use strict';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!RM && window.Lenis) {
  lenis = new Lenis({ lerp: .09, smoothWheel: true });
  document.documentElement.classList.add('lenis');
  if (window.gsap && window.ScrollTrigger) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const id = a.getAttribute('href').slice(1); const el = id ? $(id) : null; if (!el) return;
  e.preventDefault(); setMenu(false);
  if (lenis) lenis.scrollTo(el, { duration: 1.4, offset: id === 'top' ? 0 : -10 }); else el.scrollIntoView();
});

/* ---------- header + menu ---------- */
const hdr = $('hdr'), btn = $('menuBtn'), ov = $('overlay');
function setMenu(o) { btn.setAttribute('aria-expanded', o); ov.classList.toggle('open', o); if (lenis) { o ? lenis.stop() : lenis.start(); } }
btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
ov.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
const onScroll = () => hdr.classList.toggle('scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------- statement: split into words ---------- */
const st = document.querySelector('.statement p');
if (st) st.innerHTML = st.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');

/* ---------- scroll choreography ---------- */
if (window.gsap && window.ScrollTrigger && !RM) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false }); // the same script runs on pages without every section
  gsap.from('#heroCopy > *', { y: 18, duration: .9, ease: 'power3.out', stagger: .07 });
  gsap.to('#heroCopy', { y: -60, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.s-hero', start: '50% top', end: 'bottom top', scrub: true } });
  if (st) gsap.to('.statement .w', { opacity: 1, stagger: .08, ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top 75%', end: 'bottom 60%', scrub: true } });
  gsap.utils.toArray('.sec-head, .fit h2, .faq .head, .cta h2, .steps .side').forEach(el =>
    gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } }));
  gsap.utils.toArray('.inc').forEach((el, i) =>
    gsap.from(el, { y: 40, opacity: 0, duration: .9, ease: 'power3.out', delay: (i % 3) * .08, scrollTrigger: { trigger: el, start: 'top 90%' } }));
  gsap.utils.toArray('.svc').forEach(el => gsap.from(el.children, { y: 30, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } }));
  gsap.utils.toArray('.prow').forEach(el => gsap.from(el, { y: 22, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 94%' } }));
  gsap.from('.tag', { y: 20, opacity: 0, duration: .7, stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: '.tags', start: 'top 85%' } });
  gsap.utils.toArray('.qa details').forEach((el, i) =>
    gsap.from(el, { y: 24, opacity: 0, duration: .8, ease: 'power3.out', delay: i * .06, scrollTrigger: { trigger: '.qa', start: 'top 85%' } }));
  gsap.utils.toArray('.case').forEach(c => {
    const flip = c.classList.contains('flip');
    c.querySelector('.browser') && gsap.from(c.querySelector('.browser'), { y: 60, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 80%' } });
    c.querySelector('.phone') && gsap.from(c.querySelector('.phone'), { y: 120, opacity: 0, duration: 1.3, delay: .15, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 80%' } });
    c.querySelector('.phone') && gsap.fromTo(c.querySelector('.phone'), { yPercent: 6 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from(c.querySelectorAll('.info > *'), { x: innerWidth > 900 ? (flip ? -30 : 30) : 0, y: innerWidth > 900 ? 0 : 24, opacity: 0, duration: .9, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 75%' } });
  });
  gsap.utils.toArray('.fact').forEach((el, i) =>
    gsap.from(el, { y: 36, opacity: 0, duration: 1, delay: i * .08, ease: 'power3.out', scrollTrigger: { trigger: '.facts', start: 'top 85%' } }));
  gsap.utils.toArray('.pcard').forEach(el =>
    gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  gsap.utils.toArray('.post-hero > *').forEach((el, i) =>
    gsap.from(el, { y: 28, opacity: 0, duration: 1.1, delay: .3 + i * .08, ease: 'power3.out' }));
  gsap.from('.next .t', { xPercent: -12, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.next', start: 'top 85%' } });
}
// steps light up as they reach the middle of the screen
const steps = [...document.querySelectorAll('.step')];
if (steps.length) {
  const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('on', e.isIntersecting)), { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(s => io.observe(s));
}

/* ---------- particle hero: starts after the page has loaded; skipped on weak devices or with data saver ---------- */
const LOW = (navigator.connection && navigator.connection.saveData) || (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
const startHero = () => {
const canvas = $('svcGL');
if (!canvas || !window.THREE) return;

// Draw the service symbol on a small 2D canvas, then sample its pixels into particles.
const SZ = 520;
function drawShape(g, kind) {
  const W = '#fff', R = '#E0002B';
  g.lineCap = 'round'; g.lineJoin = 'round';
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); };
  if (kind === 'website') {
    g.strokeStyle = W; g.lineWidth = 16; rr(40, 80, 440, 340, 26); g.stroke();
    g.beginPath(); g.moveTo(40, 146); g.lineTo(480, 146); g.lineWidth = 10; g.stroke();
    g.fillStyle = R; g.beginPath(); g.arc(84, 113, 12, 0, 7); g.fill();
    g.fillStyle = W; [124, 164].forEach(x => { g.beginPath(); g.arc(x, 113, 12, 0, 7); g.fill(); });
    g.fillStyle = W; rr(84, 186, 230, 26, 13); g.fill(); rr(84, 230, 170, 18, 9); g.fill();
    g.fillStyle = R; rr(84, 276, 120, 40, 20); g.fill();
    g.strokeStyle = W; g.lineWidth = 9; rr(340, 186, 100, 130, 14); g.stroke();
    g.fillStyle = W; [84, 214, 344].forEach(x => { rr(x, 350, 96, 34, 10); g.fill(); });
  } else if (kind === 'uiux') {
    g.strokeStyle = W; g.lineWidth = 16; rr(150, 40, 220, 440, 40); g.stroke();
    g.fillStyle = W; rr(225, 66, 70, 12, 6); g.fill();
    rr(186, 110, 148, 100, 16); g.fill();
    rr(186, 232, 148, 16, 8); g.fill(); rr(186, 262, 104, 16, 8); g.fill();
    g.lineWidth = 8; g.strokeStyle = W; rr(186, 304, 148, 42, 21); g.stroke();
    rr(186, 362, 148, 42, 21); g.fillStyle = W; g.fill();
    // cursor
    g.fillStyle = R; g.save(); g.translate(330, 300); g.rotate(-0.25);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 150); g.lineTo(38, 116); g.lineTo(64, 172); g.lineTo(88, 160); g.lineTo(62, 106); g.lineTo(110, 102); g.closePath(); g.fill(); g.restore();
  } else if (kind === 'dev') {
    g.strokeStyle = W; g.lineWidth = 34;
    g.beginPath(); g.moveTo(170, 140); g.lineTo(60, 260); g.lineTo(170, 380); g.stroke();
    g.beginPath(); g.moveTo(350, 140); g.lineTo(460, 260); g.lineTo(350, 380); g.stroke();
    g.strokeStyle = R; g.beginPath(); g.moveTo(300, 110); g.lineTo(220, 410); g.stroke();
  } else if (kind === 'store') {
    g.strokeStyle = W; g.lineWidth = 16;
    g.beginPath(); g.moveTo(110, 170); g.lineTo(410, 170); g.lineTo(440, 470); g.lineTo(80, 470); g.closePath(); g.stroke();
    g.beginPath(); g.arc(260, 170, 78, Math.PI, 0); g.stroke();
    g.fillStyle = W; [182, 338].forEach(x => { g.beginPath(); g.arc(x, 226, 12, 0, 7); g.fill(); });
    g.fillStyle = R; g.beginPath(); g.arc(420, 150, 52, 0, 7); g.fill();
    g.fillStyle = '#000'; g.font = '700 64px Figtree, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1', 420, 154);
    g.fillStyle = W; [[150, 330, 220], [150, 380, 150]].forEach(([x, y, w]) => { rr(x, y, w, 20, 10); g.fill(); });
  } else if (kind === 'emblem' && window.SN_GEO) { // the StarNex mark
    const G = window.SN_GEO, k = 460 / G.H, ox = (SZ - G.W * k) / 2, oy = (SZ - G.H * k) / 2;
    const poly = pl => pl.forEach((p, i) => i ? g.lineTo(ox + p[0] * k, oy + p[1] * k) : g.moveTo(ox + p[0] * k, oy + p[1] * k));
    g.beginPath(); poly(G.outer); g.closePath(); poly(G.hole); g.closePath(); g.fillStyle = W; g.fill('evenodd');
    g.beginPath(); poly(G.tip); g.closePath(); g.fillStyle = R; g.fill();
  } else if (kind === 'price') { // a price tag with a red euro sign
    g.strokeStyle = W; g.lineWidth = 16; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(250, 40); g.lineTo(450, 40); g.lineTo(470, 60); g.lineTo(470, 260); g.lineTo(240, 490); g.lineTo(30, 280); g.closePath(); g.stroke();
    g.fillStyle = W; g.beginPath(); g.arc(395, 115, 26, 0, 7); g.fill();
    g.fillStyle = R; g.font = '700 190px Figtree, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('€', 236, 280);
  } else if (kind === 'blog') { // a written page and a red pen
    g.strokeStyle = W; g.lineWidth = 14;
    g.beginPath(); g.moveTo(90, 50); g.lineTo(330, 50); g.lineTo(400, 120); g.lineTo(400, 470); g.lineTo(90, 470); g.closePath(); g.stroke();
    g.lineWidth = 10; g.beginPath(); g.moveTo(330, 50); g.lineTo(330, 120); g.lineTo(400, 120); g.stroke();
    g.fillStyle = W; rr(130, 150, 170, 24, 12); g.fill();
    [205, 245, 285, 325, 365, 405].forEach((y, i) => { rr(130, y, i % 3 === 2 ? 150 : 230, 12, 6); g.fill(); });
    g.save(); g.translate(400, 320); g.rotate(0.55); g.fillStyle = R;
    rr(-18, -170, 36, 190, 8); g.fill();
    g.beginPath(); g.moveTo(-18, 26); g.lineTo(18, 26); g.lineTo(0, 70); g.closePath(); g.fill(); g.restore();
  } else if (kind === 'seo') { // magnifier over rising bars
    g.fillStyle = W; [[70, 330, 60], [150, 280, 110], [230, 230, 160]].forEach(([x, y, h]) => { rr(x, y, 54, h, 10); g.fill(); });
    g.fillStyle = R; rr(310, 160, 54, 230, 10); g.fill();
    g.strokeStyle = W; g.lineWidth = 16; g.beginPath(); g.arc(300, 170, 110, 0, 7); g.stroke();
    g.lineWidth = 30; g.beginPath(); g.moveTo(380, 252); g.lineTo(468, 340); g.stroke();
    g.lineWidth = 8; g.beginPath(); g.moveTo(50, 430); g.lineTo(470, 430); g.stroke();
  } else if (kind === 'ads') { // megaphone with signal waves
    g.fillStyle = W;
    g.beginPath(); g.moveTo(70, 210); g.lineTo(150, 210); g.lineTo(330, 110); g.lineTo(330, 410); g.lineTo(150, 310); g.lineTo(70, 310); g.closePath(); g.fill();
    g.fillStyle = '#000'; rr(92, 232, 46, 56, 8); g.fill();
    g.fillStyle = W; g.beginPath(); g.moveTo(120, 310); g.lineTo(170, 310); g.lineTo(200, 420); g.lineTo(150, 420); g.closePath(); g.fill();
    g.strokeStyle = R; g.lineWidth = 16;
    [60, 110, 160].forEach(r => { g.beginPath(); g.arc(340, 260, r, -0.6, 0.6); g.stroke(); });
  } else if (kind === 'menu') { // phone showing a menu, with a QR code
    g.strokeStyle = W; g.lineWidth = 14; rr(60, 50, 210, 420, 34); g.stroke();
    g.fillStyle = W; rr(105, 100, 120, 20, 10); g.fill();
    [150, 200, 250, 300, 350].forEach((y, i) => { rr(100, y, 90, 12, 6); g.fill(); rr(205, y, 28, 12, 6); g.fill(); });
    g.fillStyle = R; rr(100, 395, 130, 34, 17); g.fill();
    const qx = 300, qy = 150, c = 22; g.fillStyle = W;
    const finder = (x, y) => { g.fillRect(x, y, c * 3, c * 3); g.fillStyle = '#000'; g.fillRect(x + c * .5, y + c * .5, c * 2, c * 2); g.fillStyle = W; g.fillRect(x + c, y + c, c, c); };
    finder(qx, qy); finder(qx + c * 6, qy); finder(qx, qy + c * 6);
    [[4, 0], [4, 2], [3, 4], [5, 4], [7, 4], [4, 6], [6, 6], [8, 7], [5, 8], [7, 8], [8, 5], [6, 3]].forEach(([a, b]) => { g.fillStyle = (a + b) % 5 === 0 ? R : W; g.fillRect(qx + a * c, qy + b * c, c, c); });
  } else if (kind === 'cms') { // settings panel: sliders and a red toggle
    g.strokeStyle = W; g.lineWidth = 14; rr(50, 70, 420, 380, 28); g.stroke();
    g.lineWidth = 8;
    [[150, 300], [230, 180], [310, 360]].forEach(([y, kx]) => {
      g.strokeStyle = W; g.beginPath(); g.moveTo(100, y); g.lineTo(420, y); g.stroke();
      g.fillStyle = W; g.beginPath(); g.arc(kx, y, 20, 0, 7); g.fill();
    });
    g.fillStyle = R; rr(100, 365, 110, 54, 27); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.arc(183, 392, 18, 0, 7); g.fill();
    g.fillStyle = W; rr(240, 380, 180, 18, 9); g.fill();
  } else if (kind === 'brand') { // brand board: logo mark, type specimen, colour swatches
    g.strokeStyle = W; g.lineWidth = 14; rr(40, 50, 440, 420, 30); g.stroke();
    g.fillStyle = W; g.font = '600 150px Figtree, Arial, sans-serif'; g.textBaseline = 'alphabetic'; g.fillText('Aa', 80, 250);
    g.lineWidth = 14; g.beginPath(); g.arc(375, 175, 62, 0, 7); g.stroke();
    g.fillStyle = R; g.beginPath(); g.moveTo(352, 222); g.lineTo(380, 128); g.lineTo(410, 128); g.lineTo(382, 222); g.closePath(); g.fill();
    g.fillStyle = W; rr(80, 290, 360, 8, 4); g.fill();
    g.fillStyle = W; rr(80, 340, 100, 90, 16); g.fill();
    g.strokeStyle = W; g.lineWidth = 10; rr(210, 345, 90, 80, 14); g.stroke();
    g.fillStyle = R; rr(330, 340, 110, 90, 16); g.fill();
  } else if (kind === 'work') { // four project screens, stacked
    const frames = [[40, 60, 0], [150, 150, 0], [70, 250, 1], [200, 330, 0]];
    frames.forEach(([x, y, isRed]) => {
      g.fillStyle = '#000'; rr(x - 8, y - 8, 296, 196, 22); g.fill(); // knock out what's behind
      g.strokeStyle = isRed ? R : W; g.lineWidth = 12; rr(x, y, 280, 180, 16); g.stroke();
      g.lineWidth = 7; g.beginPath(); g.moveTo(x, y + 36); g.lineTo(x + 280, y + 36); g.stroke();
      g.fillStyle = isRed ? R : W; [0, 1, 2].forEach(d => { g.beginPath(); g.arc(x + 22 + d * 20, y + 18, 6, 0, 7); g.fill(); });
      rr(x + 26, y + 62, 130, 18, 9); g.fill(); rr(x + 26, y + 94, 90, 12, 6); g.fill();
    });
  } else { // apps
    g.strokeStyle = W; g.lineWidth = 16; rr(30, 70, 460, 380, 26); g.stroke();
    g.beginPath(); g.moveTo(150, 70); g.lineTo(150, 450); g.lineWidth = 10; g.stroke();
    g.fillStyle = W; [120, 170, 220, 270].forEach((y, i) => { rr(60, y, i === 0 ? 62 : 54, 16, 8); g.fill(); });
    g.fillStyle = R; rr(60, 120, 62, 16, 8); g.fill();
    g.fillStyle = W; rr(186, 110, 120, 60, 12); g.fill(); rr(326, 110, 130, 60, 12); g.fill();
    const bars = [80, 130, 100, 170, 140, 200];
    bars.forEach((h, i) => { g.fillStyle = i === 5 ? R : W; rr(192 + i * 44, 410 - h, 26, h, 8); g.fill(); });
  }
}
function sample(kind, N) {
  const c = document.createElement('canvas'); c.width = c.height = SZ; const g = c.getContext('2d');
  drawShape(g, kind);
  const d = g.getImageData(0, 0, SZ, SZ).data; const pts = [];
  for (let y = 0; y < SZ; y += 2) for (let x = 0; x < SZ; x += 2) {
    const i = (y * SZ + x) * 4; if (d[i + 3] < 140) continue;
    const red = d[i] > 150 && d[i + 1] < 90;
    if (!red && d[i] < 140) continue; // skip the black badge digit
    pts.push([x / SZ * 2 - 1, -(y / SZ * 2 - 1), red]);
  }
  for (let i = pts.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
  return pts.slice(0, N);
}

let r; try { r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
r.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.5 : 2));
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(30, 1, .1, 100); cam.position.set(0, 0, 15);
const kind = canvas.dataset.shape || 'website';
const mobile = innerWidth < 700;
const shape = sample(kind, mobile ? 6500 : 11000);
const HALO = mobile ? 900 : 1600;
const COUNT = shape.length + HALO;
const target = new Float32Array(COUNT * 3), scatter = new Float32Array(COUNT * 3), pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3);
const white = new THREE.Color(0xffffff), red = new THREE.Color(0xE0002B);
for (let i = 0; i < COUNT; i++) {
  let tx, ty, tz, c;
  if (i < shape.length) {
    const [x, y, isRed] = shape[i];
    tx = x + (Math.random() - .5) * .01; ty = y + (Math.random() - .5) * .01; tz = (Math.random() - .5) * .14; c = isRed ? red : white;
  } else {
    const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), rad = 1.35 + Math.random() * .5;
    tx = rad * Math.sin(b) * Math.cos(a); ty = rad * Math.cos(b); tz = rad * Math.sin(b) * Math.sin(a);
    const s = .22 + Math.random() * .3; c = { r: s, g: s, b: s };
  }
  target.set([tx, ty, tz], i * 3);
  const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), rad = 1.6 + Math.random() * 2.4;
  scatter.set([rad * Math.sin(b) * Math.cos(a), rad * Math.cos(b), rad * Math.sin(b) * Math.sin(a)], i * 3);
  col.set([c.r, c.g, c.b], i * 3);
}
pos.set(RM ? target : scatter);
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
const dot = document.createElement('canvas'); dot.width = dot.height = 32;
{ const g = dot.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }
const mat = new THREE.PointsMaterial({ size: .05, map: new THREE.CanvasTexture(dot), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .95 });
const pts = new THREE.Points(geo, mat);
const grp = new THREE.Group(); grp.add(pts); scene.add(grp);

function size() {
  const b = canvas.getBoundingClientRect(); r.setSize(b.width, b.height, false);
  cam.aspect = b.width / Math.max(1, b.height); cam.updateProjectionMatrix();
  const wH = 2 * cam.position.z * Math.tan(cam.fov * Math.PI / 360), wW = wH * cam.aspect;
  if (b.width >= 900) { // symbol on the right, copy on the left
    const s = Math.min(wH * .34, wW * .2); grp.scale.setScalar(s); grp.position.set(wW * .24, wH * .04, 0); mat.size = .05 * (s / 1.4);
  } else { // symbol centred in the space between the header and the copy
    const copy = $('heroCopy'), top = 72, gap = 28;
    const avail = Math.max(160, b.height - copy.offsetHeight - (b.height - copy.getBoundingClientRect().bottom + b.top) - top - gap);
    const cy = top + avail / 2; // px from the top of the hero
    const s = Math.min(wW * .36, (avail / b.height) * wH * .44);
    grp.scale.setScalar(s); grp.position.set(0, (b.height / 2 - cy) / b.height * wH, 0); mat.size = .05 * (s / 1.1);
  }
}
size(); addEventListener('resize', size);

let mx = 0, my = 0, sx = 0, sy = 0, vis = true; const t0 = performance.now();
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(canvas);
const hero = document.querySelector('.s-hero');
const ease = t => 1 - Math.pow(1 - t, 3);
let lastK = -1;
function loop(now) {
  requestAnimationFrame(loop); if (!vis) return;
  const intro = RM ? 1 : ease(clamp((now - t0 - 200) / 2600));
  const sp = RM ? 0 : clamp(scrollY / Math.max(1, hero.offsetHeight));
  const k = intro * (1 - sp * .85);
  if (Math.abs(k - lastK) > .0005) {
    for (let i = 0; i < pos.length; i++) pos[i] = scatter[i] + (target[i] - scatter[i]) * k;
    geo.attributes.position.needsUpdate = true; lastK = k;
  }
  sx += (mx - sx) * .045; sy += (my - sy) * .045;
  const idle = RM ? 0 : Math.sin(now * .0004) * .12;
  pts.rotation.y = idle + sx * .5 + (1 - intro) * 1.2; pts.rotation.x = sy * .25;
  mat.opacity = .95 * (1 - sp * .6);
  r.render(scene, cam);
}
requestAnimationFrame(loop);
};
if (!LOW && window.THREE) { const go = () => ('requestIdleCallback' in window ? requestIdleCallback(startHero, { timeout: 1200 }) : setTimeout(startHero, 200)); document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true }); }
})();
