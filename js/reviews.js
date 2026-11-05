/* StarNex Studio: the reviews' entrance runs once. Without this script, or with reduced motion, they are simply there. */
(function () {
  var section = document.querySelector('.reviews');
  if (!section || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  section.classList.add('arm');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .2 });
  io.observe(section.querySelector('.rv-list'));
  section.querySelectorAll('.rv').forEach(function (r) { io.observe(r); });
})();
