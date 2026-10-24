/* Kadr Wyprawy: wspolny skrypt serwisu demo (Webly Mate). Bez bibliotek. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, val);
    } catch (e) { return null; }
    return null;
  }

  /* Naglowek: tlo po przewinieciu */
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Menu mobilne */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('menu-glowne');
  if (toggle && nav) {
    var useEl = toggle.querySelector('use');
    function setMenu(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
      nav.classList.toggle('open', open);
      header.classList.toggle('menu-open', open);
      if (useEl) useEl.setAttribute('href', open ? '#i-close' : '#i-menu');
    }
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }

  /* Wejscia sekcji, rysowanie ikon i tras: stan koncowy widoczny bez JS, klase .pre dodaje skrypt */
  var animated = document.querySelectorAll('.reveal, .draw, .route-svg, .anno');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          en.target.classList.remove('pre');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
    animated.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) { el.classList.add('in'); return; }
      el.classList.add('pre');
      io.observe(el);
    });
  }

  /* Liczniki statystyk */
  function format(n, dec) {
    var s = dec ? n.toFixed(dec).replace('.', ',') : Math.round(n).toString();
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased, dec) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduce && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* Karuzela kierunkow w hero */
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = hero.querySelectorAll('.hero-slide');
    var tabs = hero.querySelectorAll('.hero-tab');
    var word = hero.querySelector('.hero-word span');
    var wordWrap = hero.querySelector('.hero-word');
    var caption = hero.querySelector('.hero-slide-caption');
    var link = hero.querySelector('[data-hero-link]');
    var nextBtn = hero.querySelector('[data-hero-next]');
    var nextImg = nextBtn ? nextBtn.querySelector('img') : null;
    var nextLabel = nextBtn ? nextBtn.querySelector('[data-next-label]') : null;
    var pauseBtn = hero.querySelector('[data-hero-pause]');
    var status = hero.querySelector('[data-hero-status]');
    var current = 0, timer = null, playing = !reduce, userPaused = reduce, hoverPause = false;
    var DELAY = 7000;

    function loadSlide(i) {
      var img = slides[i].querySelector('img[data-src]');
      if (img) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); }
      slides[i].querySelectorAll('image[data-href]').forEach(function (im) {
        im.setAttribute('href', im.getAttribute('data-href'));
        im.removeAttribute('data-href');
      });
    }
    function show(i, announce) {
      current = (i + slides.length) % slides.length;
      loadSlide(current);
      var nxt = (current + 1) % slides.length;
      slides.forEach(function (s, k) {
        var on = k === current;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      tabs.forEach(function (t, k) {
        t.setAttribute('aria-selected', k === current ? 'true' : 'false');
        t.tabIndex = k === current ? 0 : -1;
      });
      var d = slides[current].dataset;
      if (wordWrap && word) {
        wordWrap.classList.add('swap');
        window.setTimeout(function () { word.textContent = d.word; wordWrap.classList.remove('swap'); }, reduce ? 0 : 260);
      }
      if (caption) {
        var strong = document.createElement('strong');
        strong.textContent = d.name + '.';
        caption.textContent = '';
        caption.appendChild(strong);
        caption.appendChild(document.createTextNode(' ' + d.caption));
      }
      if (link) { link.href = d.href; link.querySelector('[data-link-label]').textContent = 'Zobacz wyprawę: ' + d.name; }
      var seats = parseInt(d.seats || '0', 10);
      var setTxt = function (sel, val) { var el = hero.querySelector(sel); if (el) el.textContent = val; };
      setTxt('[data-term-name]', d.name);
      setTxt('[data-term-date]', d.term || '');
      setTxt('[data-term-days]', d.days || '');
      setTxt('[data-term-price]', d.price || '');
      setTxt('[data-term-seats]', seats === 1 ? '1 wolne miejsce' : (seats >= 2 && seats <= 4 ? seats + ' wolne miejsca' : seats + ' wolnych miejsc'));
      hero.querySelectorAll('[data-term-meter] i').forEach(function (dot, k) { dot.classList.toggle('free', k >= 10 - seats); });
      if (nextBtn) {
        var nd = slides[nxt].dataset;
        if (nextImg) { nextImg.src = nd.thumb; }
        if (nextLabel) nextLabel.textContent = nd.name;
        nextBtn.setAttribute('aria-label', 'Następny kierunek: ' + nd.name);
      }
      if (announce && status) status.textContent = 'Kierunek ' + (current + 1) + ' z ' + slides.length + ': ' + d.name;
    }
    function schedule() {
      window.clearTimeout(timer);
      if (playing && !hoverPause) {
        timer = window.setTimeout(function () { preloadNext(); timer = window.setTimeout(function () { show(current + 1, false); schedule(); }, 1000); }, DELAY - 1000);
      }
    }
    function setPlaying(p) {
      playing = p;
      hero.classList.toggle('paused', !p);
      if (pauseBtn) {
        pauseBtn.setAttribute('aria-label', p ? 'Zatrzymaj przewijanie kierunków i animacje' : 'Wznów przewijanie kierunków i animacje');
        pauseBtn.setAttribute('aria-pressed', p ? 'false' : 'true');
        var u = pauseBtn.querySelector('use');
        if (u) u.setAttribute('href', p ? '#i-pause' : '#i-play');
      }
      schedule();
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { show(k, true); schedule(); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = k + 1;
        if (e.key === 'ArrowLeft') n = k - 1;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) {
          e.preventDefault();
          n = (n + tabs.length) % tabs.length;
          show(n, true); tabs[n].focus(); schedule();
        }
      });
    });
    hero.querySelectorAll('[data-hero-step]').forEach(function (b) {
      b.addEventListener('click', function () { show(current + parseInt(b.getAttribute('data-hero-step'), 10), true); schedule(); });
    });
    if (nextBtn) nextBtn.addEventListener('click', function () { show(current + 1, true); schedule(); });
    if (pauseBtn) pauseBtn.addEventListener('click', function () { userPaused = playing; setPlaying(!playing); });
    /* Pauza, gdy uzytkownik czyta lub obsluguje karuzele */
    hero.addEventListener('mouseenter', function () { hoverPause = true; schedule(); });
    hero.addEventListener('mouseleave', function () { hoverPause = false; schedule(); });
    hero.addEventListener('focusin', function () { hoverPause = true; schedule(); });
    hero.addEventListener('focusout', function (e) { if (!hero.contains(e.relatedTarget)) { hoverPause = false; schedule(); } });
    document.addEventListener('visibilitychange', function () { if (document.hidden) window.clearTimeout(timer); else schedule(); });
    show(0, false);
    setPlaying(!userPaused);
    /* Wczytaj kolejne zdjecia po zaladowaniu strony */
    /* Kolejny slajd wczytujemy dopiero przed jego pokazaniem (1 s wczesniej) albo po interakcji z karuzela */
    var preloadNext = function () { loadSlide((current + 1) % slides.length); };
    hero.addEventListener('pointerenter', preloadNext, { once: true });
    hero.addEventListener('focusin', preloadNext, { once: true });
  }

  /* Glebia hero. Przewijanie: CSS scroll-driven animations (watek kompozytora).
     Zamiennik bez animation-timeline: rAF z wygladzaniem (lerp), wymiary liczone przy resize.
     Kursor: tylko napis i kompas, najwyzej 12 px, lerp 0,1, tylko mysz. */
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var scrollCss = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
  var heroBox = document.querySelector('.hero--stage, .page-hero--stage, .page-hero');
  if (!reduce && heroBox) {
    if (!scrollCss) {
      doc.classList.add('no-sda');
      var layers = heroBox.querySelectorAll('.hero-slides, .page-hero > .scene, .page-hero > img[data-par]');
      var cines = document.querySelectorAll('img[data-par]:not(.page-hero > img)');
      var cineBoxes = [];
      var heroH = heroBox.offsetHeight, vh = window.innerHeight;
      var measure = function () {
        heroH = heroBox.offsetHeight; vh = window.innerHeight;
        cineBoxes = Array.prototype.map.call(cines, function (img) {
          var r = img.parentElement.getBoundingClientRect();
          return { el: img, top: r.top + window.scrollY, h: r.height };
        });
      };
      var sCur = 0, sLoop = false;
      var sTick = function () {
        var y = window.scrollY;
        sCur += (y - sCur) * 0.1;
        if (Math.abs(y - sCur) < 0.3) sCur = y;
        var p = Math.min(Math.max(sCur / heroH, 0), 1);
        layers.forEach(function (el) { el.style.translate = '0 ' + (p * 60).toFixed(2) + 'px'; });
        heroBox.style.setProperty('--sp', p.toFixed(4));
        cineBoxes.forEach(function (c) {
          if (c.top + c.h < sCur - 100 || c.top > sCur + vh + 100) return;
          var q = ((sCur + vh) - c.top) / (vh + c.h) - 0.5;
          c.el.style.translate = '0 ' + (q * -60).toFixed(2) + 'px';
        });
        if (sCur !== y) window.requestAnimationFrame(sTick); else sLoop = false;
      };
      var onS = function () { if (!sLoop) { sLoop = true; window.requestAnimationFrame(sTick); } };
      measure();
      window.addEventListener('scroll', onS, { passive: true });
      window.addEventListener('resize', function () { measure(); onS(); }, { passive: true });
      window.addEventListener('load', measure);
      onS();
    }
    if (finePointer) {
      var cur = { x: 0, y: 0 }, aim = { x: 0, y: 0 }, looping = false, hb = heroBox.getBoundingClientRect();
      var pointerLoop = function () {
        cur.x += (aim.x - cur.x) * 0.1;
        cur.y += (aim.y - cur.y) * 0.1;
        heroBox.style.setProperty('--mx', cur.x.toFixed(4));
        heroBox.style.setProperty('--my', cur.y.toFixed(4));
        if (Math.abs(aim.x - cur.x) > 0.001 || Math.abs(aim.y - cur.y) > 0.001) window.requestAnimationFrame(pointerLoop);
        else looping = false;
      };
      heroBox.addEventListener('pointerenter', function () { hb = heroBox.getBoundingClientRect(); });
      heroBox.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        aim.x = (e.clientX - hb.left) / hb.width - 0.5;
        aim.y = (e.clientY - hb.top) / hb.height - 0.5;
        if (!looping) { looping = true; window.requestAnimationFrame(pointerLoop); }
      });
      heroBox.addEventListener('pointerleave', function () {
        aim.x = 0; aim.y = 0;
        if (!looping) { looping = true; window.requestAnimationFrame(pointerLoop); }
      });
    }
  }

  /* Orbitujace karty: CSS scroll-driven (view timeline sekcji); zamiennik: rAF z lerp */
  var orbit = document.querySelector('[data-orbit]');
  if (orbit && !reduce && !scrollCss) {
    var oCards = Array.prototype.slice.call(orbit.querySelectorAll('.orbit-card'));
    var wide = window.matchMedia('(min-width: 1000px)');
    var oTop = 0, oH = 0, oVh = window.innerHeight, oCur = -1, oLoop = false;
    var oMeasure = function () { var r = orbit.getBoundingClientRect(); oTop = r.top + window.scrollY; oH = r.height; oVh = window.innerHeight; };
    var params = oCards.map(function (c) {
      return { el: c, sp: parseFloat(c.getAttribute('data-speed') || '1'), ph: parseFloat(c.getAttribute('data-phase') || '0'), z: parseFloat(c.style.getPropertyValue('--z') || '1') };
    });
    var oTick = function () {
      if (!wide.matches) { oCards.forEach(function (c) { c.style.translate = ''; }); oLoop = false; return; }
      var target = Math.min(Math.max((window.scrollY + oVh - oTop) / (oVh + oH), 0), 1);
      if (oCur < 0) oCur = target;
      oCur += (target - oCur) * 0.1;
      if (Math.abs(target - oCur) < 0.0005) oCur = target;
      params.forEach(function (o) {
        var amp = 10 + o.z * 14;
        var a = o.ph + (oCur - 0.5) * Math.PI * 1.2 * o.sp;
        var dx = (Math.cos(a) - Math.cos(o.ph)) * amp;
        var dy = (Math.sin(a) - Math.sin(o.ph)) * amp * 0.7 + (0.5 - oCur) * 50 * (o.z - 0.9);
        o.el.style.translate = dx.toFixed(2) + 'px ' + dy.toFixed(2) + 'px';
      });
      if (oCur !== target) window.requestAnimationFrame(oTick); else oLoop = false;
    };
    var onOrbit = function () { if (!oLoop) { oLoop = true; window.requestAnimationFrame(oTick); } };
    oMeasure();
    window.addEventListener('scroll', onOrbit, { passive: true });
    window.addEventListener('resize', function () { oMeasure(); onOrbit(); }, { passive: true });
    window.addEventListener('load', function () { oMeasure(); onOrbit(); });
    onOrbit();
  }

  /* Galeria kierunku: miniatury, strzalki, klawiatura, przesuwanie palcem, lightbox */
  document.querySelectorAll('[data-gallery]').forEach(function (gal) {
    var thumbs = Array.prototype.slice.call(gal.querySelectorAll('.gal-thumb'));
    var main = gal.querySelector('[data-gal-img]');
    var cap = gal.querySelector('[data-gal-cap]');
    var count = gal.querySelector('[data-gal-count]');
    var openBtn = gal.querySelector('[data-gal-open]');
    var idx = 0;
    function show(i, focusThumb) {
      idx = (i + thumbs.length) % thumbs.length;
      var t = thumbs[idx];
      var w = +t.getAttribute('data-w');
      main.srcset = t.getAttribute('data-mid') + ' ' + t.getAttribute('data-mw') + 'w, ' + t.getAttribute('data-full') + ' ' + w + 'w';
      main.src = t.getAttribute('data-full');
      main.alt = t.getAttribute('data-alt');
      if (cap) cap.textContent = t.getAttribute('data-alt');
      if (count) count.textContent = (idx + 1) + ' / ' + thumbs.length;
      if (openBtn) openBtn.setAttribute('aria-label', 'Powiększ zdjęcie: ' + t.getAttribute('data-alt'));
      thumbs.forEach(function (b, k) { if (k === idx) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      if (focusThumb) t.focus();
    }
    thumbs.forEach(function (b, k) {
      b.addEventListener('click', function () { show(k); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); show(idx + 1, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); show(idx - 1, true); }
      });
    });
    gal.querySelectorAll('[data-gal-step]').forEach(function (b) {
      b.addEventListener('click', function () { show(idx + parseInt(b.getAttribute('data-gal-step'), 10)); });
    });
    var sx = null;
    var stage = gal.querySelector('.gal-stage');
    stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });

    /* Lightbox z powiekszeniem: dialog modalny, Esc zamyka, fokus w srodku */
    var box = null, last = null;
    function setup() {
      box = document.createElement('div');
      box.className = 'lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Powiększone zdjęcie');
      box.innerHTML = '<div class="lb-frame"><img alt=""></div>' +
        '<p class="lb-cap"></p>' +
        '<button type="button" class="icon-btn lb-prev" aria-label="Poprzednie zdjęcie"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-chev-left"/></svg></button>' +
        '<button type="button" class="icon-btn lb-next" aria-label="Następne zdjęcie"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-chev-right"/></svg></button>' +
        '<button type="button" class="lb-zoom" aria-pressed="false">Powiększ</button>' +
        '<button type="button" class="icon-btn lb-close" aria-label="Zamknij powiększenie"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-close"/></svg></button>';
      document.body.appendChild(box);
      var img = box.querySelector('img'), frame = box.querySelector('.lb-frame'), zoom = box.querySelector('.lb-zoom');
      function canZoom() {
        var r = img.getBoundingClientRect();
        return img.naturalWidth / (window.devicePixelRatio || 1) > r.width * 1.15;
      }
      function setZoom(on, ex, ey) {
        if (on && !canZoom()) on = false;
        frame.classList.toggle('zoomed', on);
        zoom.setAttribute('aria-pressed', on ? 'true' : 'false');
        zoom.textContent = on ? 'Pomniejsz' : 'Powiększ do 100%';
        if (on) {
          /* rozmiar CSS = piksele pliku / gestosc ekranu, czyli ostro, bez powiekszania */
          img.style.width = (img.naturalWidth / (window.devicePixelRatio || 1)) + 'px';
          if (ex !== undefined) {
            frame.scrollLeft = ex * frame.scrollWidth - frame.clientWidth / 2;
            frame.scrollTop = ey * frame.scrollHeight - frame.clientHeight / 2;
          } else {
            frame.scrollLeft = (frame.scrollWidth - frame.clientWidth) / 2;
            frame.scrollTop = (frame.scrollHeight - frame.clientHeight) / 2;
          }
        } else {
          img.style.width = '';
        }
      }
      img.addEventListener('load', function () { zoom.hidden = !canZoom(); });
      box.fill = function () {
        var t = thumbs[idx];
        img.src = t.getAttribute('data-full'); img.alt = t.getAttribute('data-alt');
        box.querySelector('.lb-cap').textContent = t.getAttribute('data-alt') + ' (' + (idx + 1) + ' / ' + thumbs.length + ')';
        setZoom(false);
      };
      zoom.addEventListener('click', function () { setZoom(!frame.classList.contains('zoomed')); });
      img.addEventListener('click', function (e) {
        var r = img.getBoundingClientRect();
        if (frame.classList.contains('zoomed')) { setZoom(false); return; }
        setZoom(true, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
      });
      box.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); box.fill(); });
      box.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); box.fill(); });
      box.querySelector('.lb-close').addEventListener('click', close);
      box.addEventListener('click', function (e) { if (e.target === box) close(); });
      box.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        if (e.key === 'ArrowRight') { show(idx + 1); box.fill(); }
        if (e.key === 'ArrowLeft') { show(idx - 1); box.fill(); }
        if (e.key === 'Tab') {
          var f = box.querySelectorAll('button');
          var first = f[0], lastB = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastB.focus(); }
          else if (!e.shiftKey && document.activeElement === lastB) { e.preventDefault(); first.focus(); }
        }
      });
    }
    function open() {
      if (!box) setup();
      last = document.activeElement;
      box.fill();
      box.classList.add('open');
      document.body.classList.add('lb-lock');
      box.querySelector('.lb-close').focus();
    }
    function close() {
      box.classList.remove('open');
      document.body.classList.remove('lb-lock');
      if (last) last.focus();
    }
    if (openBtn) openBtn.addEventListener('click', open);
  });

  /* Pasek marquee: pauza przyciskiem (WCAG 2.2.2), najechanie i fokus zatrzymuja go w CSS */
  document.querySelectorAll('[data-marquee]').forEach(function (mq) {
    var b = mq.querySelector('[data-mq-pause]');
    if (!b) return;
    b.addEventListener('click', function () {
      var paused = mq.classList.toggle('paused');
      b.setAttribute('aria-pressed', paused ? 'true' : 'false');
      b.setAttribute('aria-label', paused ? 'Wznów przewijany pasek' : 'Zatrzymaj przewijany pasek');
      var u = b.querySelector('use');
      if (u) u.setAttribute('href', paused ? '#i-play' : '#i-pause');
    });
  });

  /* Adnotacje na zdjeciu: opisy widoczne bez JS, skrypt zwija je do przyciskow */
  document.querySelectorAll('.anno-btn').forEach(function (btn) {
    var more = document.getElementById(btn.getAttribute('aria-controls'));
    if (!more) return;
    var set = function (b, m, open) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); m.hidden = !open; };
    set(btn, more, false);
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      var list = btn.closest('.anno-list');
      if (open && list && window.matchMedia('(min-width: 1000px)').matches) {
        list.querySelectorAll('.anno-btn[aria-expanded="true"]').forEach(function (o) {
          var m = document.getElementById(o.getAttribute('aria-controls'));
          if (o !== btn && m) set(o, m, false);
        });
      }
      set(btn, more, open);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var item = document.activeElement && document.activeElement.closest ? document.activeElement.closest('.anno-item') : null;
    var b = item ? item.querySelector('.anno-btn[aria-expanded="true"]') : null;
    if (b) { b.click(); b.focus(); }
  });

  /* Opinie: przycisk "Pokaz kolejne" w wersji demo */
  document.querySelectorAll('[data-demo-more]').forEach(function (b) {
    var out = document.querySelector('[data-demo-more-msg]');
    b.addEventListener('click', function () { if (out) out.textContent = 'To wersja demonstracyjna, pokazujemy tylko wybrane opinie.'; });
  });

  /* Karty terminow: wybor terminu zaznacza go w formularzu rezerwacji */
  document.querySelectorAll('[data-pick]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var field = document.getElementById(a.getAttribute('data-pick'));
      if (!field) return;
      e.preventDefault();
      field.value = a.getAttribute('data-value');
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      field.focus({ preventScroll: true });
    });
  });

  /* Filtry (kierunki, opinie, blog) */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var target = document.getElementById(group.getAttribute('data-filter-group'));
    var countEl = document.querySelector('[data-filter-count="' + group.getAttribute('data-filter-group') + '"]');
    if (!target) return;
    var state = {};
    function apply() {
      var shown = 0;
      target.querySelectorAll('[data-tags]').forEach(function (item) {
        var tags = item.getAttribute('data-tags').split(' ');
        var ok = Object.keys(state).every(function (k) { return state[k] === 'all' || tags.indexOf(state[k]) !== -1; });
        item.hidden = !ok;
        if (ok) shown++;
      });
      if (countEl) countEl.textContent = shown === 0 ? 'Brak wyników dla wybranych filtrów. Wybierz „Wszystkie”, aby zobaczyć pełną listę.' : 'Pokazujemy: ' + shown;
    }
    group.querySelectorAll('[data-filter-key]').forEach(function (row) {
      var key = row.getAttribute('data-filter-key');
      state[key] = 'all';
      row.querySelectorAll('button[data-value]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          row.querySelectorAll('button[data-value]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
          btn.setAttribute('aria-pressed', 'true');
          state[key] = btn.getAttribute('data-value');
          apply();
        });
      });
    });
  });

  /* Formularze demo: niczego nie wysylaja */
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    var msg = form.querySelector('.form-msg');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (msg) {
        msg.classList.add('ok');
        msg.textContent = 'To wersja demonstracyjna, formularz niczego nie wysyła.';
      }
    });
  });

  /* Wybor terminu: podpowiedz w formularzu rezerwacji */
  document.querySelectorAll('[data-term-summary]').forEach(function (out) {
    var form = out.closest('form');
    if (!form) return;
    form.addEventListener('change', function (e) {
      if (e.target.name === 'termin') out.textContent = 'Wybrany termin: ' + e.target.getAttribute('data-label') + '.';
    });
  });

  /* baner zgod: wm-zgody (assets/wm-zgody, _narzedzia/wm-zgody-demo.py) */

  /* Rok w stopce */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
