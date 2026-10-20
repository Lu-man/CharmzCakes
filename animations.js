const revealElements = document.querySelectorAll('[data-reveal]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (revealElements.length && !reduceMotion && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion-ready');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -4% 0px'
  });

  revealElements.forEach((element) => revealObserver.observe(element));
}
