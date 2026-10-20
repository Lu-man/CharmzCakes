const showcaseCategories = document.querySelectorAll('.showcase-category');

showcaseCategories.forEach((category) => {
  const track = category.querySelector('.showcase-track');
  const previousButton = category.querySelector('[data-scroll="previous"]');
  const nextButton = category.querySelector('[data-scroll="next"]');

  if (!track || !previousButton || !nextButton) {
    return;
  }

  const originals = Array.from(track.querySelectorAll('.gallery-item'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 600;
  let base = 0;
  let setWidth = 0;
  let slideStep = 0;
  let builtWidth = 0;
  let animation = null;

  if (!originals.length) {
    return;
  }

  // Clones on both sides keep the edge fade filled and let the track loop endlessly.
  const build = () => {
    track.querySelectorAll('.is-clone').forEach((clone) => clone.remove());

    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const padding = Number.parseFloat(getComputedStyle(track).paddingLeft) || 0;
    slideStep = originals[0].getBoundingClientRect().width + gap;
    const copies = Math.ceil((track.clientWidth + slideStep * 2) / (slideStep * originals.length)) + 1;

    const makeSet = () => originals.map((item) => {
      const clone = item.cloneNode(true);
      clone.classList.add('is-clone');
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelector('img')?.setAttribute('loading', 'eager');
      return clone;
    });

    for (let index = 0; index < copies; index += 1) {
      track.prepend(...makeSet());
      track.append(...makeSet());
    }

    base = originals[0].offsetLeft - padding;
    setWidth = slideStep * originals.length;
    builtWidth = track.clientWidth;
    track.classList.add('is-animating');
    track.scrollLeft = base;
    track.classList.remove('is-animating');
  };

  const normalize = () => {
    let shift = 0;

    if (track.scrollLeft < base - 1) {
      shift = setWidth;
    } else if (track.scrollLeft >= base + setWidth - 1) {
      shift = -setWidth;
    }

    if (shift) {
      track.scrollLeft += shift;

      if (animation) {
        animation.from += shift;
        animation.to += shift;
      }
    }
  };

  const stopAnimation = () => {
    animation = null;
    track.classList.remove('is-animating');
  };

  const easeOut = (progress) => 1 - (1 - progress) ** 3;

  const frame = (timestamp) => {
    if (!animation) {
      return;
    }

    const progress = Math.min((timestamp - animation.start) / duration, 1);
    track.scrollLeft = animation.from + (animation.to - animation.from) * easeOut(progress);
    normalize();

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      stopAnimation();
    }
  };

  const moveBySlide = (direction) => {
    if (reduceMotion.matches) {
      track.scrollLeft += direction * slideStep;
      normalize();
      return;
    }

    const running = Boolean(animation);
    const from = track.scrollLeft;
    const to = (running ? animation.to : from) + direction * slideStep;
    animation = { from, to, start: performance.now() };
    track.classList.add('is-animating');

    if (!running) {
      requestAnimationFrame(frame);
    }
  };

  previousButton.addEventListener('click', () => moveBySlide(-1));
  nextButton.addEventListener('click', () => moveBySlide(1));

  track.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveBySlide(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });

  ['pointerdown', 'wheel', 'touchstart'].forEach((type) => {
    track.addEventListener(type, stopAnimation, { passive: true });
  });

  // Wrapping mid-swipe interrupts touch momentum and snapping, so only wrap once scrolling has settled.
  let settleTimer = 0;
  track.addEventListener('scroll', () => {
    if (animation) {
      return;
    }

    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(normalize, 150);
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (track.clientWidth !== builtWidth) {
      stopAnimation();
      build();
    }
  });

  build();
});
