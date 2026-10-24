/* Obsydian, studio detailingu (demo Webly Mate). Wspolny JS serwisu. */
(function(){
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){return null;}}

  // naglowek i dolny pasek mobile
  var header=document.querySelector('.header');
  var mbar=document.getElementById('mbar');
  var anchor=document.querySelector('[data-mbar-anchor]');
  var target=document.getElementById('wycena');
  var heroBg=document.querySelector('.hero-bg');
  function onScroll(){
    var y=window.scrollY;
    header.classList.toggle('scrolled',y>10);
    if(mbar){
      var show=anchor?anchor.getBoundingClientRect().bottom<0:y>420;
      if(show&&target&&anchor!==target){var r=target.getBoundingClientRect();if(r.top<window.innerHeight&&r.bottom>0)show=false;}
      mbar.classList.toggle('show',show);
      mbar.setAttribute('aria-hidden',show?'false':'true');
      mbar.querySelectorAll('a').forEach(function(a){a.tabIndex=show?0:-1;});
    }
    if(heroBg&&!reduce&&y<900)heroBg.style.transform='translate3d(0,'+(y*0.18).toFixed(1)+'px,0)';
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  // menu mobilne
  var burger=document.querySelector('.burger'),mob=document.getElementById('mobile-menu');
  function setMenu(open){
    mob.classList.toggle('open',open);
    burger.setAttribute('aria-expanded',open?'true':'false');
    burger.setAttribute('aria-label',open?'Zamknij menu':'Otwórz menu');
  }
  if(burger&&mob){
    burger.addEventListener('click',function(){setMenu(!mob.classList.contains('open'));});
    mob.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){setMenu(false);});});
  }

  // podmenu Uslugi (desktop)
  var subBtn=document.querySelector('.sub-btn'),sub=document.getElementById('sub-uslugi');
  function setSub(open){if(!subBtn)return;sub.hidden=!open;subBtn.setAttribute('aria-expanded',open?'true':'false');}
  if(subBtn&&sub){
    subBtn.addEventListener('click',function(){setSub(sub.hidden);});
    subBtn.parentNode.addEventListener('focusout',function(e){if(!subBtn.parentNode.contains(e.relatedTarget))setSub(false);});
    document.addEventListener('click',function(e){if(!subBtn.parentNode.contains(e.target))setSub(false);});
  }
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    if(mob&&mob.classList.contains('open')){setMenu(false);burger.focus();}
    if(sub&&!sub.hidden){setSub(false);subBtn.focus();}
  });

  // formularze demo: prosta walidacja i komunikat
  document.querySelectorAll('.demo-form').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var m=f.querySelector('.form-msg'),bad=null;
      f.querySelectorAll('[required]').forEach(function(el){
        var ok=el.type==='checkbox'?el.checked:el.value.trim()!=='';
        el.setAttribute('aria-invalid',ok?'false':'true');
        if(!ok&&!bad)bad=el;
      });
      if(bad){
        var lab=bad.type==='checkbox'?'zgoda na kontakt':(f.querySelector('label[for="'+bad.id+'"]')||{}).textContent;
        m.textContent='Uzupełnij pole: '+(lab||'').replace('(opcjonalnie)','').trim().replace(/[?.:]+$/,'')+'.';
        bad.focus();return;
      }
      m.textContent='To wersja demonstracyjna, formularz niczego nie wysyła.';
    });
  });

  // suwaki przed/po
  document.querySelectorAll('.ba').forEach(function(ba){
    var range=ba.querySelector('input');
    function setPos(v){
      v=Math.max(0,Math.min(100,v));
      ba.style.setProperty('--pos',v+'%');
      range.value=Math.round(v);
      range.setAttribute('aria-valuetext',Math.round(v)+' procent widoku przed');
    }
    range.addEventListener('input',function(){setPos(+range.value);});
    var drag=false;
    function fromEvent(e){var r=ba.getBoundingClientRect();setPos((e.clientX-r.left)/r.width*100);}
    ba.addEventListener('pointerdown',function(e){drag=true;fromEvent(e);});
    window.addEventListener('pointermove',function(e){if(drag)fromEvent(e);});
    window.addEventListener('pointerup',function(){drag=false;});
    window.addEventListener('pointercancel',function(){drag=false;});
  });

  // teraz otwarte / zamkniete
  var now=new Date(),d=now.getDay(),h=now.getHours()+now.getMinutes()/60,open=false,next='';
  if(d>=1&&d<=5)open=h>=8&&h<18; else if(d===6)open=h>=9&&h<14;
  if(!open){
    if(d>=1&&d<=4)next=h<8?'dziś o 8:00':'jutro o 8:00';
    else if(d===5)next=h<8?'dziś o 8:00':'w sobotę o 9:00';
    else if(d===6)next=h<9?'dziś o 9:00':'w poniedziałek o 8:00';
    else next='jutro o 8:00';
  }
  document.querySelectorAll('[data-open-now]').forEach(function(on){
    on.hidden=false;
    if(open){on.textContent='Teraz otwarte, zapraszamy';on.classList.remove('closed');}
    else{on.textContent='Teraz zamknięte, otwieramy '+next;on.classList.add('closed');}
  });

  // filtry (realizacje, blog)
  document.querySelectorAll('[data-filter-group]').forEach(function(g){
    var list=document.getElementById(g.getAttribute('data-filter-group'));
    var status=document.getElementById(g.getAttribute('data-status'));
    var btns=g.querySelectorAll('button');
    btns.forEach(function(b){
      b.addEventListener('click',function(){
        var f=b.getAttribute('data-filter'),n=0;
        btns.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});
        list.querySelectorAll('[data-cat]').forEach(function(it){
          var show=f==='all'||it.getAttribute('data-cat').split(' ').indexOf(f)>-1;
          it.hidden=!show;if(show){n++;it.classList.add('in');}
        });
        if(status)status.textContent='Pokazujemy: '+n+' z '+list.querySelectorAll('[data-cat]').length+'.';
      });
    });
  });

  /* baner zgod: wm-zgody (assets/wm-zgody, _narzedzia/wm-zgody-demo.py) */

  // liczniki
  function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
  function count(el){
    var to=+el.getAttribute('data-to'),t0=null,dur=1300;
    if(reduce){el.textContent=fmt(to);return;}
    function step(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=fmt(Math.round(to*e));if(p<1)requestAnimationFrame(step);}
    el.textContent='0';requestAnimationFrame(step);
  }

  // wejscia sekcji, ilustracje, liczniki (raz)
  var els=document.querySelectorAll('.reveal,.anim');
  if(reduce||!('IntersectionObserver' in window)){els.forEach(function(el){el.classList.add('in');});return;}
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting)return;
      en.target.classList.add('in');
      en.target.querySelectorAll('[data-to]').forEach(count);
      io.unobserve(en.target);
    });
  },{rootMargin:'0px 0px -8% 0px',threshold:.15});
  els.forEach(function(el){io.observe(el);});
})();

/* Etap 3 i 4: glebia, parallax, marquee, orbita, widok rozlozony, galeria. */
(function(){
  var mq=function(q){return window.matchMedia&&window.matchMedia(q).matches;};
  var reduce=mq('(prefers-reduced-motion: reduce)');
  var fine=mq('(hover: hover) and (pointer: fine)');
  var sdt=window.CSS&&CSS.supports&&CSS.supports('animation-timeline: view()');
  var clamp=function(v,a,b){return Math.max(a,Math.min(b,v));};

  // galeria realizacji: podglad w oknie dialogowym (Esc zamyka, strzalki przelaczaja, przesuniecie palcem)
  var lb=document.querySelector('.lb');
  if(lb&&lb.showModal){
    var opens=[].slice.call(document.querySelectorAll('.lb-open')),cur=0,last=null;
    var li=lb.querySelector('.lb-img'),cap=lb.querySelector('.lb-cap'),cnt=lb.querySelector('.lb-count');
    var vis=function(){return opens.filter(function(b){return !b.closest('[hidden]');});};
    var show=function(i){
      var list=vis();if(!list.length)return;cur=(i+list.length)%list.length;
      var img=list[cur].querySelector('img');
      li.src=img.currentSrc||img.src;li.alt=img.alt;
      li.style.setProperty('--nw',(img.naturalWidth||1600)+'px');
      var t=list[cur].closest('li');var h=t&&t.querySelector('h3');
      cap.textContent=(h?h.textContent+': ':'')+img.alt;
      cnt.textContent='Zdjęcie '+(cur+1)+' z '+list.length;
      lb.classList.toggle('single',list.length<2);
    };
    opens.forEach(function(b){b.addEventListener('click',function(){last=b;show(vis().indexOf(b));lb.showModal();lb.querySelector('.lb-close').focus();});});
    lb.querySelector('.lb-prev').addEventListener('click',function(){show(cur-1);});
    lb.querySelector('.lb-next').addEventListener('click',function(){show(cur+1);});
    lb.querySelector('.lb-close').addEventListener('click',function(){lb.close();});
    lb.addEventListener('close',function(){if(last)last.focus();});
    lb.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){e.preventDefault();show(cur-1);}if(e.key==='ArrowRight'){e.preventDefault();show(cur+1);}});
    lb.addEventListener('click',function(e){if(e.target===lb)lb.close();});
    var sx=null;
    li.addEventListener('pointerdown',function(e){sx=e.clientX;});
    li.addEventListener('pointerup',function(e){if(sx===null)return;var dx=e.clientX-sx;sx=null;if(Math.abs(dx)>40)show(cur+(dx<0?1:-1));});
  }

  // marquee: przycisk pauzy (WCAG 2.2.2)
  document.querySelectorAll('.marq').forEach(function(m){
    var b=m.querySelector('.marq-pause'),t=m.querySelector('.mp-txt');
    if(!b)return;
    b.addEventListener('click',function(){
      var p=b.getAttribute('aria-pressed')!=='true';
      b.setAttribute('aria-pressed',p?'true':'false');
      m.classList.toggle('paused',p);
      t.textContent=p?'Wznów pasek':'Zatrzymaj pasek';
    });
  });

  if(reduce){document.querySelectorAll('.marq-view').forEach(function(v){v.tabIndex=0;v.setAttribute('role','region');v.setAttribute('aria-label','Korzyści, przewijane w poziomie');});return;}

  var hero=document.querySelector('.hero3');
  var depth=hero?[].slice.call(hero.querySelectorAll('[data-depth]')):[];
  var sheen=document.querySelector('.h3-sheen i');
  var orbit=document.querySelector('[data-orbit]');
  var ocs=orbit?[].slice.call(orbit.querySelectorAll('.oc')):[];
  var expls=[].slice.call(document.querySelectorAll('[data-expl]'));
  var ks=ocs.map(function(c){return +getComputedStyle(c).getPropertyValue('--k')||1;});

  // wymiary liczone przy resize, nie w kazdej klatce
  var vh=window.innerHeight,orbTop=0,orbH=1,exTops=[],exHs=[],wideOrb=false,scrolly=false;
  function measure(){
    vh=window.innerHeight;var y=window.scrollY;
    wideOrb=window.innerWidth>=1100;
    if(orbit){var r=orbit.getBoundingClientRect();orbTop=r.top+y;orbH=r.height;}
    scrolly=mq('(min-width: 960px)')&&vh>=640;
    expls.forEach(function(e,i){e.classList.toggle('scrolly',scrolly);var r=e.getBoundingClientRect();exTops[i]=r.top+y;exHs[i]=r.height;});
  }

  // stan biezacy i docelowy (wygladzanie lerp 0,1)
  var mx=0,my=0,cx=0,cy=0,orbT=0,orbC=0,exT=expls.map(function(){return 0;}),exC=exT.slice(),running=false;
  function targets(){
    var y=window.scrollY;
    if(!sdt){
      if(orbit&&wideOrb)orbT=clamp((y+vh-orbTop)/(vh+orbH),0,1)-.5;
      expls.forEach(function(e,i){
        exT[i]=scrolly?clamp((y-exTops[i])/(exHs[i]-vh),0,1):clamp((y+vh*.9-exTops[i]-120)/(vh*.55),0,1);
      });
    }
  }
  function tick(){
    var moving=false,k=.1;
    cx+=(mx-cx)*k;cy+=(my-cy)*k;
    if(Math.abs(mx-cx)>.001||Math.abs(my-cy)>.001)moving=true;
    if(fine&&window.scrollY<vh*1.4)depth.forEach(function(el){
      var d=+el.getAttribute('data-depth');
      el.style.transform='translate3d('+(cx*d*-12).toFixed(2)+'px,'+(cy*d*-8).toFixed(2)+'px,0)';
    });
    if(!sdt){
      orbC+=(orbT-orbC)*k;if(Math.abs(orbT-orbC)>.0005)moving=true;
      if(wideOrb)ocs.forEach(function(c,i){c.style.setProperty('--o',(orbC*48*ks[i]).toFixed(2)+'deg');});
      expls.forEach(function(e,i){exC[i]+=(exT[i]-exC[i])*k;if(Math.abs(exT[i]-exC[i])>.0005)moving=true;e.style.setProperty('--p',exC[i].toFixed(4));});
    }
    if(moving)requestAnimationFrame(tick);else running=false;
  }
  function kick(){if(!running){running=true;requestAnimationFrame(tick);}}
  // zamiennik bez CSS scroll-driven: przewijanie hero w JS (lagodnie, maks. 60 px)
  if(!sdt&&hero){
    window.addEventListener('scroll',function(){
      var y=Math.min(window.scrollY,vh);
      depth.forEach(function(el){el.style.translate='0 '+(-(y/vh)*60*(+getComputedStyle(el).getPropertyValue('--dp')||0)).toFixed(1)+'px';});
    },{passive:true});
  }
  measure();targets();
  expls.forEach(function(e,i){if(!sdt){exC[i]=exT[i];e.style.setProperty('--p',exC[i]);}});
  window.addEventListener('scroll',function(){targets();kick();},{passive:true});
  window.addEventListener('resize',function(){measure();targets();kick();});
  window.addEventListener('load',function(){measure();targets();kick();});
  if(fine&&hero){
    hero.addEventListener('pointermove',function(e){mx=e.clientX/window.innerWidth*2-1;my=e.clientY/window.innerHeight*2-1;kick();});
    hero.addEventListener('pointerleave',function(){mx=0;my=0;kick();});
  }
  kick();
})();
