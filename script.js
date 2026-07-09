// Icons (Lucide)
if (window.lucide) lucide.createIcons();
window.addEventListener('load', () => { if (window.lucide) lucide.createIcons(); });

// Marquee: measure the exact pixel width of one set so the loop point
// (translateX distance) is pixel-perfect — avoids the sub-pixel rounding
// that a plain -50% can hit at certain zoom levels / display scaling,
// which showed up as a visible hitch right at the seam of the loop.
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
  const setMarqueeDistance = () => {
    const half = marqueeTrack.scrollWidth / 2;
    marqueeTrack.style.setProperty('--marquee-distance', `${half}px`);
  };
  setMarqueeDistance();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setMarqueeDistance);
  window.addEventListener('load', setMarqueeDistance);
  window.addEventListener('resize', setMarqueeDistance);
}

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach((el) => revealObserver.observe(el));

// FAQ accordion
document.querySelectorAll('.faq-item').forEach((item) => {
  const question = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');

  question.addEventListener('click', () => {
    const isOpen = question.getAttribute('aria-expanded') === 'true';

    document.querySelectorAll('.faq-question').forEach((q) => {
      q.setAttribute('aria-expanded', 'false');
      q.nextElementSibling.style.maxHeight = null;
    });

    if (!isOpen) {
      question.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// Treatments fan carousel (cards splayed like a hand of cards, GSAP-powered)
(function () {
  const wrap = document.querySelector('.fan-wrap');
  const layout = document.querySelector('.fan-layout');
  if (!layout) return;

  const cards = Array.from(layout.querySelectorAll('.fan-card'));
  if (!cards.length) return;

  function getResponsiveMultiplier(width) {
    if (width < 480) return 0.34;
    if (width < 640) return 0.44;
    if (width < 768) return 0.58;
    if (width < 1024) return 0.8;
    return 1.0;
  }

  // Distributes cards evenly around the center slot (fan math ported from
  // the reference card-fan-carousel component, simplified for a fixed,
  // non-paginated set of cards). Kept close together and mostly level
  // (small y/rotation spread) rather than a wide, dramatic arc.
  function getSlotConfig(total, slot) {
    const center = (total - 1) / 2;
    const distance = center > 0 ? (slot - center) / center : 0;
    const absDistance = Math.abs(distance);
    return {
      rot: distance * 11,
      scale: 1 - 0.13 * absDistance * absDistance,
      x: distance * 17,
      y: absDistance * absDistance * 2,
      zIndex: 10 - Math.round(absDistance * 4),
    };
  }

  let active = null;

  function applyLayout(hovered, animate) {
    const total = cards.length;
    const m = getResponsiveMultiplier(window.innerWidth);

    cards.forEach((card, i) => {
      const base = getSlotConfig(total, i);
      let x = base.x * m;
      let y = base.y * m;
      let rot = base.rot;
      let scale = base.scale;
      let delay = 0;

      if (hovered !== null) {
        const dist = Math.abs(i - hovered);
        delay = dist * 0.02;
        if (i === hovered) {
          y -= 2.6;
          scale *= 1.22;
        } else {
          const push = 4 * (1 + 0.2 * Math.max(0, 3 - dist));
          if (i < hovered) { x -= push * m; rot -= 3 / (dist + 1); }
          else { x += push * m; rot += 3 / (dist + 1); }
        }
      }

      const target = {
        x: `${x}rem`, y: `${y}rem`, rotation: rot, scale, opacity: 1,
        zIndex: hovered === i ? 20 : base.zIndex,
      };

      if (animate) {
        gsap.to(card, { ...target, duration: 0.5, delay, ease: 'elastic.out(1,.75)', overwrite: 'auto' });
      } else {
        gsap.set(card, target);
      }
    });
  }

  function playEntrance() {
    const total = cards.length;
    const m = getResponsiveMultiplier(window.innerWidth);

    cards.forEach((card, i) => {
      const base = getSlotConfig(total, i);
      gsap.set(card, { x: 0, y: '8rem', rotation: 0, scale: 0.6, opacity: 0 });
      gsap.to(card, {
        x: `${base.x * m}rem`, y: `${base.y * m}rem`, rotation: base.rot, scale: base.scale,
        opacity: 1, zIndex: base.zIndex, duration: 1, ease: 'elastic.out(1.05,.78)', delay: 0.15 + i * 0.06,
      });
    });
  }

  function boot() {
    if (!window.gsap) { setTimeout(boot, 50); return; }

    applyLayout(null, false); // resting fan position, visible immediately

    cards.forEach((card, i) => {
      card.addEventListener('mouseenter', () => { active = i; applyLayout(i, true); });
    });
    layout.addEventListener('mouseleave', () => { active = null; applyLayout(null, true); });
    window.addEventListener('resize', () => applyLayout(active, false));

    const entranceObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playEntrance();
          entranceObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    entranceObserver.observe(wrap || layout);
  }

  boot();
})();

// Active nav link based on visible section
const navLinks = document.querySelectorAll('.main-nav a');
const sections = document.querySelectorAll('main section[id]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((link) => link.classList.remove('active'));
      const activeLink = document.querySelector(`.main-nav a[href="#${entry.target.id}"]`);
      if (activeLink) activeLink.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

sections.forEach((section) => sectionObserver.observe(section));
