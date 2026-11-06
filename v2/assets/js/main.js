/* PaddleWaver Korea — 시안 2 interactions
   Mobile ~767 / Pad 768~1279 / PC 1280~ */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- Active nav ---------- */
  const current = document.body.dataset.page;
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('is-active', a.dataset.nav === current));

  /* ---------- Menu ---------- */
  const menu = document.getElementById('menu');
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
  }

  /* ---------- Ticker: duplicate for loop ---------- */
  document.querySelectorAll('.ticker__track').forEach(t => {
    const clone = t.innerHTML;
    t.insertAdjacentHTML('beforeend', clone);
    Array.from(t.children).slice(t.children.length / 2).forEach(el => el.setAttribute('aria-hidden', 'true'));
  });

  /* ---------- Manifesto: split words ---------- */
  const manifestoText = document.querySelector('.manifesto__text');
  let words = [];
  if (manifestoText) {
    const html = manifestoText.innerHTML.trim();
    // <em> 안 단어는 강조색
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const out = [];
    tmp.childNodes.forEach(node => {
      const hl = node.nodeType === 1;
      node.textContent.split(/(\s+)/).forEach(tok => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) out.push(' ');
        else out.push(`<span class="w${hl ? ' hl' : ''}">${tok}</span>`);
      });
    });
    manifestoText.innerHTML = out.join('');
    words = Array.from(manifestoText.querySelectorAll('.w'));
  }

  /* ---------- Sub page index list ---------- */
  const ixItems = Array.from(document.querySelectorAll('.ix-item'));
  const ixList = Array.from(document.querySelectorAll('.index-list li'));
  const setIx = i => ixList.forEach((li, k) => li.classList.toggle('is-active', k === i));
  setIx(0);

  if (!hasGsap || reduce) {
    words.forEach(w => w.classList.add('on'));
    ixList.forEach((li, i) => li.querySelector('button').addEventListener('click', () => ixItems[i].scrollIntoView()));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis ---------- */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToEl = el => lenis ? lenis.scrollTo(el, { offset: -80 }) : el.scrollIntoView({ behavior: 'smooth' });
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const el = document.querySelector(a.getAttribute('href'));
    if (el) { e.preventDefault(); scrollToEl(el); }
  }));
  if (menu) menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('is-open')));

  /* ---------- Intro: line mask reveal ---------- */
  const introLines = gsap.utils.toArray('[data-intro] .line > span');
  gsap.from(introLines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.1 });
  gsap.from('[data-intro-fade]', { autoAlpha: 0, y: 16, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.5 });

  /* ---------- Signal line draw ---------- */
  const signal = document.querySelector('.signal .data');
  if (signal) {
    const len = signal.getTotalLength();
    gsap.set(signal, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(signal, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', delay: 0.6 });
  }

  /* ---------- Generic reveals ---------- */
  gsap.utils.toArray('[data-reveal]').forEach(el => {
    gsap.from(el, { autoAlpha: 0, y: 48, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  gsap.utils.toArray('[data-lines]').forEach(el => {
    gsap.from(el.querySelectorAll('.line > span'), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  /* ---------- Count up ---------- */
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '', obj = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(obj, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('en-US') + suffix; } }) });
  });

  const mm = gsap.matchMedia();
  const PAD_UP = '(min-width: 768px)';
  const MOBILE = '(max-width: 767px)';

  /* ---------- Expand image (sticky, pad+) ---------- */
  const expand = document.querySelector('.expand');
  if (expand) {
    mm.add(PAD_UP, () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: expand, start: 'top top', end: 'bottom bottom', scrub: 1 } });
      tl.fromTo('.expand__media', { clipPath: 'inset(22% 26% 22% 26% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 })
        .fromTo('.expand__media img', { scale: 1.25 }, { scale: 1, ease: 'none', duration: 1 }, 0)
        .from('.expand__text > *', { autoAlpha: 0, y: 40, stagger: 0.1, duration: 0.3 }, 0.75);
      return () => tl.scrollTrigger && tl.scrollTrigger.kill();
    });
  }

  /* ---------- Manifesto word fill ---------- */
  if (words.length) {
    const fill = p => {
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    };
    mm.add(PAD_UP, () => {
      const st = ScrollTrigger.create({ trigger: '.manifesto', start: 'top top', end: 'bottom bottom', onUpdate: s => fill(s.progress) });
      return () => st.kill();
    });
    mm.add(MOBILE, () => {
      const st = ScrollTrigger.create({ trigger: '.manifesto__text', start: 'top 80%', end: 'bottom 40%', onUpdate: s => fill(s.progress) });
      return () => st.kill();
    });
  }

  /* ---------- Stacking panels: 이전 패널이 살짝 작아지며 어두워짐 ---------- */
  const panels = gsap.utils.toArray('.panel');
  if (panels.length) {
    mm.add(PAD_UP, () => {
      const tws = panels.slice(0, -1).map((p, i) => gsap.to(p.querySelector('.panel__inner'), {
        scale: 0.92, autoAlpha: 0.35, ease: 'none',
        scrollTrigger: { trigger: panels[i + 1], start: 'top bottom', end: 'top top', scrub: true }
      }));
      return () => tws.forEach(t => t.scrollTrigger && t.scrollTrigger.kill());
    });
  }

  /* ---------- Services: cursor image preview (PC hover) ---------- */
  const cursor = document.querySelector('.cursor-img');
  if (cursor) {
    mm.add('(hover: hover) and (min-width: 1280px)', () => {
      const xTo = gsap.quickTo(cursor, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(cursor, 'y', { duration: 0.6, ease: 'power3' });
      const imgs = cursor.querySelectorAll('img');
      const move = e => { xTo(e.clientX); yTo(e.clientY); };
      window.addEventListener('mousemove', move);
      const rows = document.querySelectorAll('.svc');
      rows.forEach((row, i) => {
        row.addEventListener('mouseenter', () => {
          imgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
          gsap.to(cursor, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power3.out' });
        });
        row.addEventListener('mouseleave', () => gsap.to(cursor, { autoAlpha: 0, scale: 0.8, duration: 0.3 }));
      });
      return () => window.removeEventListener('mousemove', move);
    });
  }

  /* ---------- Sub page: sticky index ---------- */
  if (ixItems.length) {
    ixList.forEach((li, i) => li.querySelector('button').addEventListener('click', () => scrollToEl(ixItems[i])));
    mm.add(PAD_UP, () => {
      const sts = ixItems.map((it, i) => ScrollTrigger.create({ trigger: it, start: 'top 50%', end: 'bottom 50%', onToggle: s => s.isActive && setIx(i) }));
      return () => sts.forEach(s => s.kill());
    });
  }

  /* ---------- Image parallax inside frames ---------- */
  gsap.utils.toArray('[data-parallax] img').forEach(img => {
    gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
