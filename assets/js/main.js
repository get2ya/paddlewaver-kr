/* PaddleWaver Korea — interactions
   Mobile ~767 / Pad 768~1279 / PC 1280~ */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- Header state + active nav ---------- */
  const header = document.querySelector('.header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const current = document.body.dataset.page;
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('is-active', a.dataset.nav === current));

  /* ---------- Mobile menu ---------- */
  const menu = document.getElementById('mobileMenu');
  const openBtn = document.getElementById('menuOpen');
  const closeBtn = document.getElementById('menuClose');
  if (menu && openBtn && closeBtn) {
    const setOpen = open => {
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      openBtn.setAttribute('aria-expanded', String(open));
    };
    openBtn.addEventListener('click', () => setOpen(true));
    closeBtn.addEventListener('click', () => setOpen(false));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  }

  /* ---------- Marquee: duplicate items for seamless loop ---------- */
  document.querySelectorAll('.marquee__track').forEach(track => {
    track.innerHTML += track.innerHTML;
    Array.from(track.children).slice(track.children.length / 2).forEach(el => el.setAttribute('aria-hidden', 'true'));
  });

  if (!hasGsap || reduce) {
    document.querySelectorAll('.words__stage span').forEach((s, i) => s.classList.toggle('is-active', i === 0));
    document.querySelectorAll('.feature').forEach(f => f.classList.add('is-active'));
    initFeatureFallback();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(el, { offset: 0 }) : el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- Reveal on scroll ---------- */
  gsap.set('[data-reveal]', { autoAlpha: 0, y: 40 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: els => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 })
  });

  /* ---------- Count up ---------- */
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(obj, {
        v: end, duration: 1.6, ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('en-US') + suffix; }
      })
    });
  });

  const mm = gsap.matchMedia();
  const MOBILE = '(max-width: 767px)';
  const PAD_UP = '(min-width: 768px)';

  /* ---------- Hero: word swap ---------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    const words = gsap.utils.toArray('.words__stage span');
    const steps = gsap.utils.toArray('.steps li');
    const show = i => {
      words.forEach((w, k) => {
        if (k === i) gsap.to(w, { yPercent: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out', overwrite: true });
        else gsap.to(w, { yPercent: k < i ? -100 : 100, autoAlpha: 0, duration: 0.45, ease: 'power3.in', overwrite: true });
      });
      steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    };
    gsap.set(words, { yPercent: 100, autoAlpha: 0 });
    show(0);

    // Pad / PC: 히어로 고정 후 스크롤 진행도로 단어 교체
    mm.add(PAD_UP, () => {
      let last = 0;
      const st = ScrollTrigger.create({
        trigger: hero, start: 'top top', end: '+=180%', pin: true, scrub: true,
        onUpdate: self => {
          const p = self.progress;
          const i = Math.min(words.length - 1, Math.floor(p * words.length));
          steps.forEach((s, k) => {
            const local = Math.max(0, Math.min(1, p * words.length - k));
            s.style.setProperty('--p', (local * 100) + '%');
          });
          if (i !== last) { last = i; show(i); }
        }
      });
      gsap.to('.hero__visual img', { scale: 1.06, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '+=180%', scrub: true } });
      return () => { st.kill(); steps.forEach(s => s.style.removeProperty('--p')); show(0); };
    });

    // Mobile: 고정 없이 자동 순환 (모바일 주소창 리사이즈로 핀이 튀는 문제 회피)
    mm.add(MOBILE, () => {
      let i = 0;
      steps.forEach(s => s.style.setProperty('--p', '0%'));
      const tick = () => {
        i = (i + 1) % words.length;
        show(i);
        steps.forEach((s, k) => s.style.setProperty('--p', k <= i ? '100%' : '0%'));
      };
      steps[0] && steps[0].style.setProperty('--p', '100%');
      const id = setInterval(tick, 2200);
      return () => clearInterval(id);
    });
  }

  /* ---------- Horizontal scroll section ---------- */
  const hs = document.querySelector('.hs');
  if (hs) {
    const track = hs.querySelector('.hs__track');
    const bar = hs.querySelector('.hs__progress i');

    mm.add(PAD_UP, () => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: {
          trigger: hs, start: 'top top', end: () => '+=' + distance(),
          pin: true, scrub: 1, invalidateOnRefresh: true,
          onUpdate: self => bar && gsap.set(bar, { scaleX: self.progress })
        }
      });
      return () => tween.scrollTrigger && tween.scrollTrigger.kill();
    });

    // Mobile: 네이티브 스와이프 + 진행 바
    mm.add(MOBILE, () => {
      const vp = hs.querySelector('.hs__viewport');
      const update = () => {
        const max = vp.scrollWidth - vp.clientWidth;
        bar && gsap.set(bar, { scaleX: max > 0 ? vp.scrollLeft / max : 0 });
      };
      vp.addEventListener('scroll', update, { passive: true });
      update();
      return () => vp.removeEventListener('scroll', update);
    });
  }

  /* ---------- Sticky features (sub pages) ---------- */
  const features = gsap.utils.toArray('.feature');
  const mediaImgs = gsap.utils.toArray('.features__media img');
  const counter = document.querySelector('.features__counter');
  if (features.length && mediaImgs.length) {
    const setActive = i => {
      features.forEach((f, k) => f.classList.toggle('is-active', k === i));
      mediaImgs.forEach((m, k) => m.classList.toggle('is-active', k === i));
      if (counter) counter.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(features.length).padStart(2, '0');
    };
    setActive(0);
    mm.add(PAD_UP, () => {
      const triggers = features.map((f, i) => ScrollTrigger.create({
        trigger: f, start: 'top 55%', end: 'bottom 55%',
        onToggle: self => self.isActive && setActive(i)
      }));
      return () => triggers.forEach(t => t.kill());
    });
    mm.add(MOBILE, () => { features.forEach(f => f.classList.add('is-active')); });
  }

  // 폰트/이미지 로드 후 위치 재계산
  window.addEventListener('load', () => ScrollTrigger.refresh());

  function initFeatureFallback() {
    document.querySelectorAll('.features__media img').forEach((m, k) => m.classList.toggle('is-active', k === 0));
  }
})();
