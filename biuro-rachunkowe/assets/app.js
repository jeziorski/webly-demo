/* Klarowna, wspolny skrypt serwisu demo. Bez bibliotek. */
(function(){
  'use strict';
  var doc=document, root=doc.documentElement;
  root.classList.add('js');
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DEMO='To wersja demonstracyjna, formularz niczego nie wysyła.';

  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}

  /* Naglowek: cien po przewinieciu */
  var header=doc.querySelector('.site-header');
  if(header){var onScroll=function(){header.classList.toggle('scrolled',window.scrollY>8)};window.addEventListener('scroll',onScroll,{passive:true});onScroll()}

  /* Menu mobilne */
  var burger=doc.querySelector('.burger'),panel=doc.getElementById('menu-mobilne');
  function setMenu(open){
    if(!burger||!panel)return;
    burger.setAttribute('aria-expanded',open?'true':'false');
    burger.setAttribute('aria-label',open?'Zamknij menu':'Otwórz menu');
    panel.classList.toggle('open',open);
  }
  if(burger&&panel){
    burger.addEventListener('click',function(){setMenu(burger.getAttribute('aria-expanded')!=='true')});
    panel.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
  }

  /* Podmenu Uslugi */
  var subBtn=doc.querySelector('.sub-btn'),sub=subBtn&&doc.getElementById(subBtn.getAttribute('aria-controls'));
  function setSub(open){if(!subBtn||!sub)return;subBtn.setAttribute('aria-expanded',open?'true':'false');sub.classList.toggle('open',open)}
  if(subBtn&&sub){
    subBtn.addEventListener('click',function(e){e.stopPropagation();setSub(subBtn.getAttribute('aria-expanded')!=='true')});
    doc.addEventListener('click',function(e){if(!sub.contains(e.target))setSub(false)});
    sub.addEventListener('focusout',function(e){if(!e.relatedTarget||(!sub.contains(e.relatedTarget)&&e.relatedTarget!==subBtn))setSub(false)});
  }
  doc.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    if(panel&&panel.classList.contains('open')){setMenu(false);burger.focus()}
    if(sub&&sub.classList.contains('open')){setSub(false);subBtn.focus()}
  });

  /* Liczniki: wartosc koncowa jest w HTML, skrypt odlicza od zera przy wejsciu */
  function runCount(el){
    var to=parseFloat(el.getAttribute('data-to'));if(isNaN(to))return;
    var dur=700,start=null;
    function step(t){if(!start)start=t;var p=Math.min((t-start)/dur,1);var e=1-Math.pow(1-p,3);el.textContent=Math.round(to*e);if(p<1)requestAnimationFrame(step);else el.textContent=el.getAttribute('data-final')||to}
    el.setAttribute('data-final',el.textContent);el.textContent='0';requestAnimationFrame(step);
  }

  /* Wejscia sekcji, rysowanie ikon, schematy i wykres: raz przy wejsciu w widok */
  var targets=doc.querySelectorAll('.reveal,.draw,.flow,.vsteps,.month-chart,.count');
  if(reduce||!('IntersectionObserver' in window)){targets.forEach(function(el){el.classList.add('in')})}
  else{
    var io=new IntersectionObserver(function(entries){entries.forEach(function(en){
      if(!en.isIntersecting)return;var el=en.target;el.classList.add('in');
      if(el.classList.contains('count'))runCount(el);
      io.unobserve(el);
    })},{threshold:.25,rootMargin:'0px 0px -40px 0px'});
    targets.forEach(function(el){io.observe(el)});
  }


  /* ETAP 4: parallax warstw hero. Kursor: JS z wygladzaniem (lerp), wlasciwosc translate, maks. 12 px.
     Przewijanie: CSS scroll-driven animation (kompozytor); tu tylko zamiennik dla przegladarek bez animation-timeline. */
  var px=doc.querySelector('[data-parallax]');
  var fine=window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var cssScroll=window.CSS&&CSS.supports&&CSS.supports('animation-timeline: scroll()');
  if(px&&!reduce&&fine){
    var layers=[].slice.call(px.querySelectorAll('[data-depth]')).map(function(l){return {el:l,d:parseFloat(l.getAttribute('data-depth'))||0}});
    var sLayers=cssScroll?[]:[['.h3-tiles',60],['.h3-word',40],['.h3-float',-40],['.h3-phone',28]].map(function(x){return {el:px.querySelector(x[0]),v:x[1]}}).filter(function(x){return x.el});
    var mx=0,my=0,tx=0,ty=0,ts=0,raf=0;
    function target(){return cssScroll?0:Math.min(window.scrollY,800)/800}
    function paint(){
      raf=0;tx+=(mx-tx)*.1;ty+=(my-ty)*.1;var st=target();ts+=(st-ts)*.1;
      layers.forEach(function(l){var cy=(ty*l.d*.6).toFixed(2);
        var extra=0;sLayers.forEach(function(s){if(s.el===l.el)extra=s.v*ts});
        l.el.style.translate=(tx*l.d).toFixed(2)+'px '+(+cy+extra).toFixed(2)+'px'});
      sLayers.forEach(function(s){if(s.el.hasAttribute('data-depth'))return;s.el.style.translate='0px '+(s.v*ts).toFixed(2)+'px'});
      if(Math.abs(mx-tx)>.002||Math.abs(my-ty)>.002||Math.abs(st-ts)>.001)raf=requestAnimationFrame(paint);
    }
    function kick(){if(!raf)raf=requestAnimationFrame(paint)}
    var rect=null;function measure(){rect=px.getBoundingClientRect();rect={left:rect.left,top:rect.top+window.scrollY,width:rect.width,height:rect.height}}
    measure();window.addEventListener('resize',measure);
    px.addEventListener('pointermove',function(e){mx=Math.max(-1,Math.min(1,((e.clientX-rect.left)/rect.width-.5)*2));my=Math.max(-1,Math.min(1,((e.pageY-rect.top)/rect.height-.5)*2));kick()});
    px.addEventListener('pointerleave',function(){mx=0;my=0;kick()});
    if(!cssScroll)window.addEventListener('scroll',kick,{passive:true});
  }

  /* Pasek marquee: przycisk pauzy (WCAG 2.2.2) */
  doc.querySelectorAll('.mq').forEach(function(m){
    var b=m.querySelector('.mq-btn');if(!b)return;
    b.addEventListener('click',function(){
      var on=b.getAttribute('aria-pressed')!=='true';
      b.setAttribute('aria-pressed',on?'true':'false');m.classList.toggle('paused',on);
      b.querySelector('.mq-txt').textContent=b.getAttribute(on?'data-label-on':'data-label-off');
    });
  });

  /* Orbitujace karty: ruch robi CSS (animation-timeline: view()). Zamiennik bez wsparcia:
     rAF z wygladzaniem, pozycje i wymiary liczone przy resize, nie w kazdej klatce. */
  var orb=doc.querySelector('[data-orbit]');
  if(orb&&!reduce&&!(window.CSS&&CSS.supports&&CSS.supports('animation-timeline: view()'))){
    var oc=[].slice.call(orb.querySelectorAll('.oc')).map(function(el){return {el:el,p:el.getAttribute('data-pts').split(',').map(Number)}});
    var oTop=0,oH=0,rx=0,ry=340,on=false,cur=.5,oraf=0;
    function oMeasure(){var r=orb.getBoundingClientRect();oTop=r.top+window.scrollY;oH=r.height;rx=Math.min(520,window.innerWidth*.37);on=window.innerWidth>1100;
      if(!on)oc.forEach(function(c){c.el.style.transform=''});oKick()}
    function oTarget(){var h=window.innerHeight;return Math.max(0,Math.min(1,(window.scrollY+h-oTop)/(h+oH)))}
    function oPaint(){oraf=0;if(!on)return;var t=oTarget();cur+=(t-cur)*.1;
      oc.forEach(function(c){var p=c.p,a=cur<.5?cur*2:(cur-.5)*2,i=cur<.5?0:2;
        var x=p[i]+(p[i+2]-p[i])*a,y=p[i+1]+(p[i+3]-p[i+1])*a;
        c.el.style.transform='translate(-50%,-50%) translate3d('+(x*rx).toFixed(1)+'px,'+(y*ry).toFixed(1)+'px,0)'});
      if(Math.abs(t-cur)>.0005)oraf=requestAnimationFrame(oPaint)}
    function oKick(){if(!oraf)oraf=requestAnimationFrame(oPaint)}
    window.addEventListener('scroll',oKick,{passive:true});window.addEventListener('resize',oMeasure);oMeasure();
  }

  /* Zakladki funkcji z paskiem postepu i makieta panelu */
  doc.querySelectorAll('[data-tabs]').forEach(function(box){
    var tabs=[].slice.call(box.querySelectorAll('[role="tab"]')),win=doc.querySelector('.app3 .win'),toast=win&&win.querySelector('.toast');
    var pause=box.querySelector('.t3-pause'),auto=false,visible=false;
    function select(t,focus,user){
      tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on?'true':'false');x.tabIndex=on?0:-1;
        var pn=doc.getElementById(x.getAttribute('aria-controls'));if(pn)pn.hidden=!on});
      if(win)win.setAttribute('data-view',t.getAttribute('data-view'));
      if(toast&&!reduce){toast.textContent=t.getAttribute('data-toast');toast.classList.remove('again');void toast.offsetWidth;toast.classList.add('again')}
      else if(toast){toast.textContent=t.getAttribute('data-toast')}
      if(focus)t.focus();
      if(user)stopAuto();
    }
    function stopAuto(){auto=false;box.classList.remove('auto','hold');if(pause)pause.hidden=true}
    select(tabs[0],false,false);
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){select(t,false,true)});
      t.addEventListener('keydown',function(e){var n=null;
        if(e.key==='ArrowRight')n=tabs[(i+1)%tabs.length];else if(e.key==='ArrowLeft')n=tabs[(i-1+tabs.length)%tabs.length];
        else if(e.key==='Home')n=tabs[0];else if(e.key==='End')n=tabs[tabs.length-1];
        if(n){e.preventDefault();select(n,true,true)}});
      var bar=t.querySelector('.t3-prog i');
      if(bar)bar.addEventListener('animationend',function(){if(!auto)return;select(tabs[(i+1)%tabs.length],false,false)});
    });
    if(!reduce&&'IntersectionObserver' in window){
      auto=true;box.classList.add('auto','hold');if(pause)pause.hidden=false;
      new IntersectionObserver(function(en){visible=en[0].isIntersecting;if(auto&&pause.getAttribute('aria-pressed')!=='true')box.classList.toggle('hold',!visible)},{threshold:.3}).observe(box);
      if(pause)pause.addEventListener('click',function(){
        var on=pause.getAttribute('aria-pressed')!=='true';pause.setAttribute('aria-pressed',on?'true':'false');
        pause.textContent=on?'Wznów automatyczne przełączanie':'Zatrzymaj automatyczne przełączanie';
        box.classList.toggle('hold',on||!visible);
      });
      box.addEventListener('focusin',function(){if(auto)box.classList.add('hold')});
      box.addEventListener('focusout',function(){if(auto&&visible&&pause.getAttribute('aria-pressed')!=='true')box.classList.remove('hold')});
    }
  });

  /* Formularze demo: komunikat w tresci, bez wysylki */
  doc.querySelectorAll('form[data-demo]').forEach(function(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(form.checkValidity&&!form.checkValidity()){form.reportValidity();return}
      var msg=form.querySelector('.form-msg');
      if(msg){msg.hidden=false;msg.setAttribute('tabindex','-1');msg.focus()}
    });
  });
  doc.querySelectorAll('form[data-newsl]').forEach(function(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(form.checkValidity&&!form.checkValidity()){form.reportValidity();return}
      var out=doc.getElementById(form.getAttribute('data-newsl'));
      if(out)out.textContent=DEMO;
    });
  });

  /* Blog: filtr kategorii */
  var filters=doc.querySelector('.filters');
  if(filters){
    var cards=doc.querySelectorAll('[data-cat]'),count=doc.getElementById('filter-count');
    filters.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      filters.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
      var cat=b.getAttribute('data-filter'),n=0;
      cards.forEach(function(c){var show=cat==='all'||c.getAttribute('data-cat')===cat;c.hidden=!show;if(show)n++});
      if(count)count.textContent='Widoczne wpisy: '+n;
    });
  }

  /* Wycena: formularz kwalifikujacy, wynik bez kwot */
  var calc=doc.getElementById('kwalifikacja');
  if(calc){
    var out=doc.getElementById('zakres'),svc=doc.getElementById('zakres-usluga'),kadryL=doc.getElementById('zakres-kadry');
    var forms={jdg:'Księga przychodów i rozchodów albo ewidencja ryczałtu',zoo:'Pełna księgowość i sprawozdanie roczne',osobowa:'Księgowość spółki osobowej, rodzaj ksiąg ustalimy na rozmowie',start:'Pakiet startowy: forma opodatkowania, rejestracje i pierwsze rozliczenia'};
    var docsTxt={d1:'Mała liczba dokumentów, jeden opiekun wystarczy',d2:'Średnia liczba dokumentów, opiekun i stały termin raportu',d3:'Duża liczba dokumentów, opiekun z drugą osobą do uzgodnień',d4:'Bardzo duża liczba dokumentów, import danych zamiast ręcznego księgowania'};
    var staff={p0:null,p1:'Kadry i płace dla zespołu do 5 osób',p2:'Kadry i płace dla zespołu od 6 do 20 osób',p3:'Kadry i płace dla zespołu powyżej 20 osób'};
    var links={jdg:['ksiegowosc-jdg.html','Zobacz księgowość dla JDG'],zoo:['pelna-ksiegowosc.html','Zobacz pełną księgowość'],osobowa:['pelna-ksiegowosc.html','Zobacz pełną księgowość'],start:['ksiegowosc-jdg.html','Zobacz księgowość dla JDG']};
    function val(n){var el=calc.querySelector('input[name="'+n+'"]:checked');return el?el.value:null}
    function update(){
      var f=val('forma'),d=val('dokumenty'),p=val('pracownicy'),v=val('vat');
      var items=[];
      if(f)items.push(forms[f]);
      if(v==='tak')items.push('Rozliczenia VAT i pliki JPK co miesiąc');
      if(v==='nie-wiem')items.push('Sprawdzimy, czy VAT dotyczy Twojej firmy');
      if(p&&staff[p])items.push(staff[p]);
      if(calc.querySelector('#x-sklep:checked'))items.push('Uzgadnianie bramek płatności i marketplace’ów');
      if(calc.querySelector('#x-zagranica:checked'))items.push('Sprzedaż i zakupy zagraniczne');
      if(calc.querySelector('#x-ksef:checked'))items.push('Podłączenie KSeF i nadanie uprawnień');
      if(d)items.push(docsTxt[d]);
      out.innerHTML='';
      items.forEach(function(t){var li=doc.createElement('li');li.innerHTML='<svg class="ico" aria-hidden="true"><use href="#i-check"></use></svg><span></span>';li.lastChild.textContent=t;out.appendChild(li)});
      if(!items.length){var li=doc.createElement('li');li.textContent='Zaznacz odpowiedzi po lewej, a tu pojawi się zakres obsługi.';out.appendChild(li)}
      var key=calc.querySelector('#x-sklep:checked')?'sklep':(p&&p!=='p0'&&f!=='jdg'&&f!=='start'?'kadry':f);
      var l=key==='sklep'?['ksiegowosc-e-commerce.html','Zobacz księgowość dla e-commerce']:key==='kadry'?['kadry-i-place.html','Zobacz kadry i płace']:(links[f]||null);
      if(svc){if(l){svc.href=l[0];svc.textContent=l[1];svc.hidden=false}else{svc.hidden=true}}
      if(kadryL)kadryL.hidden=!(p&&p!=='p0'&&!(l&&l[0]==='kadry-i-place.html'));
    }
    calc.addEventListener('change',update);update();
  }

  /* Wzor wypowiedzenia: kopiowanie tresci */
  var copyBtn=doc.getElementById('kopiuj-wzor');
  if(copyBtn){
    copyBtn.addEventListener('click',function(){
      var src=doc.getElementById('wzor-tekst'),st=doc.getElementById('kopiuj-status');
      var txt=src?src.innerText.replace(/\n{3,}/g,'\n\n'):'';
      function ok(){st.textContent='Skopiowano wzór. Wklej go do edytora i uzupełnij zaznaczone pola.'}
      function fail(){st.textContent='Nie udało się skopiować automatycznie. Zaznacz tekst wzoru i skopiuj go ręcznie.'}
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(ok,fail)}else{fail()}
    });
  }

  /* Baner cookies (przyklad): rowne przyciski, zmiana zgody w stopce */
  var ck=doc.getElementById('cookie');
  if(ck){
    if(!store('klarowna-cookies'))ck.hidden=false;
    ck.querySelectorAll('[data-cookie]').forEach(function(b){b.addEventListener('click',function(){store('klarowna-cookies',b.getAttribute('data-cookie'));ck.hidden=true})});
    doc.querySelectorAll('[data-cookie-open]').forEach(function(b){b.addEventListener('click',function(){ck.hidden=false;var f=ck.querySelector('button');if(f)f.focus()})});
  }
})();
