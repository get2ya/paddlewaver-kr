/* PaddleWaver Korea — 시안 3 interactions
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

  /* ---------- Marquee: 자동 흐름, 마우스 올리면 느려짐, 드래그·가로 휠로 이동 ---------- */
  document.querySelectorAll('[data-marquee]').forEach(box => {
    const track = box.querySelector('.marquee__track');
    const items = Array.from(track.children);
    const speed = reduce ? 0 : parseFloat(box.dataset.marquee); // px/s
    let setW = 0, x = 0, cur = speed, hover = false, drag = null, last = performance.now(), boxW = 0;
    const build = () => {
      if (box.clientWidth === boxW) return;
      boxW = box.clientWidth;
      track.querySelectorAll('[data-clone]').forEach(el => el.remove());
      setW = track.scrollWidth;
      const copies = Math.ceil(boxW / setW) + 1;
      for (let i = 0; i < copies; i++) items.forEach(el => {
        const cl = el.cloneNode(true); cl.dataset.clone = ''; cl.setAttribute('aria-hidden', 'true'); track.appendChild(cl);
      });
    };
    build();
    window.addEventListener('resize', build);
    const tick = now => {
      const dt = Math.min((now - last) / 1000, 0.1); last = now;
      cur += ((drag ? 0 : hover ? speed * 0.3 : speed) - cur) * Math.min(dt * 6, 1);
      if (!drag) x -= cur * dt;
      x = ((x % setW) + setW) % setW - setW;
      track.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    box.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
    box.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hover = false; });
    box.addEventListener('pointerdown', e => { drag = { sx: e.clientX, x0: x }; box.setPointerCapture(e.pointerId); box.classList.add('is-drag'); });
    box.addEventListener('pointermove', e => { if (drag) x = drag.x0 + e.clientX - drag.sx; });
    const end = () => { drag = null; box.classList.remove('is-drag'); };
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    box.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); x -= e.deltaX; }
    }, { passive: false });
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

  /* ---------- Pillars: 고정 + 가로 스크롤 (시안 1 방식) ---------- */
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
