/* Prosto. szkola online: wspolny skrypt serwisu demo */
(function(){
  var doc=document.documentElement;
  doc.classList.add('js');
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var base=document.body.getAttribute('data-base')||'';

  /* --- dane kursow (koszyk) --- */
  var COURSES={
    grafika:{name:'Grafika do social mediów bez grafika',price:349,url:'kurs-grafika.html',img:'img/kurs-grafika.jpg',meta:'Kurs, 24 lekcje'},
    excel:{name:'Excel z AI, który liczy za Ciebie',price:299,url:'kurs-excel.html',img:'img/kurs-excel.jpg',meta:'Kurs, 18 lekcji'},
    marketing:{name:'Plan marketingu na 90 dni dla małej firmy',price:379,url:'kurs-marketing.html',img:'img/kurs-marketing.jpg',meta:'Kurs, 21 lekcji'},
    ai:{name:'AI w codziennej pracy biurowej',price:249,url:'kurs-ai.html',img:'img/kurs-ai.jpg',meta:'Kurs, 15 lekcji'},
    identyfikacja:{name:'Identyfikacja wizualna dla własnej marki',price:489,url:'kurs-identyfikacja.html',img:'img/kurs-identyfikacja.jpg',meta:'Kurs, 28 lekcji'},
    rolki:{name:'Rolki i krótkie wideo, które sprzedają',price:279,url:'kurs-rolki.html',img:'img/kurs-rolki.jpg',meta:'Kurs, 16 lekcji'},
    'plus-rok':{name:'Abonament Prosto+ roczny',price:590,url:'abonament.html',img:'',meta:'Wszystkie kursy przez 12 miesięcy'},
    'plus-mies':{name:'Abonament Prosto+ miesięczny',price:69,url:'abonament.html',img:'',meta:'Płatność co miesiąc, anulujesz w każdej chwili'}
  };
  var KEY='prosto-koszyk';
  function readCart(){try{var v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(function(id){return COURSES[id]}):[]}catch(e){return []}}
  function saveCart(c){try{localStorage.setItem(KEY,JSON.stringify(c))}catch(e){}}
  var memCart=readCart();
  function zl(n){return n.toLocaleString('pl-PL')+' zł'}

  var live=document.getElementById('live');
  function say(t){if(!live)return;live.textContent='';setTimeout(function(){live.textContent=t},60)}

  function updateCount(bump){
    var n=memCart.length;
    document.querySelectorAll('.cart-count').forEach(function(el){
      el.textContent=n;el.setAttribute('data-n',n);
      if(bump&&!reduce){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')}
    });
    document.querySelectorAll('.cart-link').forEach(function(a){a.setAttribute('aria-label','Koszyk, '+n+' '+(n===1?'pozycja':(n>=2&&n<=4?'pozycje':'pozycji')))});
  }
  function markButtons(){
    document.querySelectorAll('[data-add]').forEach(function(b){
      var inCart=memCart.indexOf(b.getAttribute('data-add'))>-1;
      if(!b.dataset.label)b.dataset.label=b.innerHTML;
      if(inCart){b.classList.add('added');b.innerHTML='W koszyku, przejdź do koszyka';}
      else{b.classList.remove('added');b.innerHTML=b.dataset.label;}
    });
  }
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-add]');
    if(!b)return;
    var id=b.getAttribute('data-add');
    if(memCart.indexOf(id)>-1){window.location.href=base+'koszyk.html';return}
    var swap='';
    if(id.indexOf('plus-')===0){memCart=memCart.filter(function(x){if(x.indexOf('plus-')===0&&x!==id){swap=COURSES[x].name;return false}return true})}
    memCart.push(id);saveCart(memCart);updateCount(true);markButtons();
    say('Dodano do koszyka: '+COURSES[id].name+'.'+(swap?' Zastąpił wariant: '+swap+'.':'')+' W koszyku: '+memCart.length+'.');
  });
  updateCount(false);markButtons();

  /* --- strona koszyka --- */
  var cartRoot=document.getElementById('cart-root');
  function renderCart(){
    if(!cartRoot)return;
    var list=document.getElementById('cart-list'),empty=document.getElementById('cart-empty'),grid=document.getElementById('cart-grid');
    if(!memCart.length){grid.hidden=true;empty.hidden=false;return}
    grid.hidden=false;empty.hidden=true;
    list.innerHTML='';var sum=0;
    memCart.forEach(function(id){
      var c=COURSES[id];sum+=c.price;
      var li=document.createElement('li');li.className='cart-item';
      var pic=id.indexOf('plus-')===0?'<span class="ph ph-plus" aria-hidden="true">P+</span>':c.img?'<a href="'+c.url+'" tabindex="-1" aria-label="'+c.name+'"><img src="'+c.img+'" alt="'+c.name+'" width="96" height="72"></a>':'<span class="ph" aria-hidden="true"></span>';
      li.innerHTML=pic+'<div><a href="'+c.url+'">'+c.name+'</a><div class="meta">'+c.meta+', dostęp od razu po płatności</div><button type="button" class="link-btn" data-remove="'+id+'">Usuń<span class="sr-only"> '+c.name+'</span></button></div><div class="pr">'+zl(c.price)+'</div>';
      list.appendChild(li);
    });
    document.getElementById('cart-sum').textContent=zl(sum);
    document.getElementById('cart-total').textContent=zl(sum);
    document.getElementById('cart-n').textContent=memCart.length;
  }
  if(cartRoot){
    renderCart();
    cartRoot.addEventListener('click',function(e){
      var r=e.target.closest('[data-remove]');
      if(!r)return;
      var id=r.getAttribute('data-remove');
      memCart=memCart.filter(function(x){return x!==id});saveCart(memCart);updateCount(false);renderCart();
      say('Usunięto z koszyka: '+COURSES[id].name+'.');
      var h=document.getElementById('cart-h');if(h)h.focus();
    });
  }

  /* --- naglowek i menu --- */
  var header=document.querySelector('.header');
  var onScroll=function(){header.classList.toggle('scrolled',window.scrollY>8)};
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  var btn=document.querySelector('.menu-btn'),nav=document.getElementById('nav');
  function closeMenu(){nav.classList.remove('open');document.body.classList.remove('menu-open');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Otwórz menu')}
  if(btn&&nav){
    btn.addEventListener('click',function(){
      var open=nav.classList.toggle('open');document.body.classList.toggle('menu-open',open);
      btn.setAttribute('aria-expanded',open?'true':'false');
      btn.setAttribute('aria-label',open?'Zamknij menu':'Otwórz menu');
    });
    nav.addEventListener('click',function(e){if(e.target.closest('a'))closeMenu()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();btn.focus()}});
  }

  /* --- filtr i wyszukiwarka kursow (katalog) --- */
  function odmiana(n){if(n===1)return'kurs';var r10=n%10,r100=n%100;return(r10>=2&&r10<=4&&(r100<12||r100>14))?'kursy':'kursów'}
  var grid=document.getElementById('courses');
  if(grid&&document.querySelector('.filters')){
    var chips=document.querySelectorAll('.filters .chip'),cards=grid.querySelectorAll('.course'),status=document.getElementById('filter-status');
    var q=document.getElementById('q'),sortSel=document.getElementById('sort'),empty=document.getElementById('empty'),cur='wszystkie';
    function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ł/g,'l')}
    function apply(){
      var term=norm(q?q.value.trim():''),n=0;
      cards.forEach(function(card){
        var okCat=cur==='wszystkie'||card.dataset.cat===cur;
        var okQ=!term||norm(card.textContent+' '+(card.getAttribute('data-kw')||'')).indexOf(term)>-1;
        var show=okCat&&okQ;card.hidden=!show;if(show)n++;
      });
      var activeChip=document.querySelector('.filters .chip[aria-pressed="true"]');
      var label=cur==='wszystkie'?'':' w kategorii '+activeChip.childNodes[0].textContent.trim();
      var qlabel=term?' dla frazy „'+q.value.trim()+'”':'';
      status.textContent='Pokazujemy '+n+' '+odmiana(n)+label+qlabel+'.';
      if(empty)empty.hidden=n>0;
    }
    chips.forEach(function(chip){
      chip.addEventListener('click',function(){
        cur=chip.dataset.filter;
        chips.forEach(function(c){c.setAttribute('aria-pressed',c===chip?'true':'false')});
        apply();
      });
    });
    if(q){q.addEventListener('input',apply)}
    var form=document.getElementById('search-form');
    if(form)form.addEventListener('submit',function(e){e.preventDefault();apply()});
    var reset=document.getElementById('reset');
    if(reset)reset.addEventListener('click',function(){q.value='';cur='wszystkie';chips.forEach(function(c){c.setAttribute('aria-pressed',c.dataset.filter==='wszystkie'?'true':'false')});apply();q.focus()});
    if(sortSel){
      sortSel.addEventListener('change',function(){
        var arr=Array.prototype.slice.call(cards),v=sortSel.value;
        arr.sort(function(a,b){
          if(v==='cena')return +a.dataset.price - +b.dataset.price;
          if(v==='ocena')return +b.dataset.rating - +a.dataset.rating;
          return +a.dataset.order - +b.dataset.order;
        });
        arr.forEach(function(c){grid.appendChild(c)});
        status.textContent='Posortowano: '+sortSel.options[sortSel.selectedIndex].text+'. '+status.textContent.replace(/^Posortowano: [^.]*\. /,'');
      });
    }
  }

  /* --- filtr bloga --- */
  var bf=document.getElementById('blog-filters');
  if(bf){
    var bchips=bf.querySelectorAll('.chip'),posts=document.querySelectorAll('[data-post-cat]'),bstatus=document.getElementById('blog-status');
    bchips.forEach(function(chip){
      chip.addEventListener('click',function(){
        var f=chip.dataset.filter,n=0;
        bchips.forEach(function(c){c.setAttribute('aria-pressed',c===chip?'true':'false')});
        posts.forEach(function(p){var s=f==='wszystkie'||p.getAttribute('data-post-cat')===f;p.hidden=!s;if(s)n++});
        bstatus.textContent='Pokazujemy '+n+' '+(n===1?'wpis':(n>=2&&n<=4?'wpisy':'wpisów'))+(f==='wszystkie'?'':' w kategorii '+chip.textContent.trim())+'.';
      });
    });
  }

  /* --- formularze demo --- */
  document.querySelectorAll('form[data-demo]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var msg=f.querySelector('.form-msg');
      if(msg)msg.textContent='To wersja demonstracyjna, formularz niczego nie wysyła.';
    });
  });
  var checkout=document.getElementById('checkout');
  if(checkout)checkout.addEventListener('submit',function(e){
    e.preventDefault();
    var m=checkout.querySelector('.form-msg');
    m.textContent='To wersja demonstracyjna, płatność nie zostanie uruchomiona.';
  });

  /* --- przykladowa lekcja (strona kursu) --- */
  document.querySelectorAll('[data-free-lesson]').forEach(function(b){
    b.addEventListener('click',function(){
      var t=document.getElementById(b.getAttribute('aria-controls'));
      var note=document.getElementById(b.getAttribute('data-free-lesson'));
      if(t){t.hidden=false}
      b.setAttribute('aria-expanded','true');
      if(note)note.textContent='W wersji demonstracyjnej nie odtwarzamy wideo. Poniżej odsłoniliśmy zapis tej lekcji.';
    });
  });

  /* --- program: rozwin wszystkie --- */
  document.querySelectorAll('[data-expand-all]').forEach(function(b){
    b.addEventListener('click',function(){
      var mods=document.querySelectorAll(b.getAttribute('data-expand-all')+' details');
      var open=b.getAttribute('aria-pressed')!=='true';
      mods.forEach(function(d){d.open=open});
      b.setAttribute('aria-pressed',open?'true':'false');
      b.textContent=open?'Zwiń wszystkie moduły':'Rozwiń wszystkie moduły';
    });
  });

  /* --- sticky CTA na mobile --- */
  var sticky=document.querySelector('.sticky-buy'),buyBox=document.getElementById('buy-box');
  if(sticky&&buyBox&&'IntersectionObserver' in window){
    document.body.classList.add('has-sticky');
    sticky.setAttribute('aria-hidden','true');sticky.querySelectorAll('a,button').forEach(function(x){x.tabIndex=-1});
    new IntersectionObserver(function(en){
      var hidden=en[0].isIntersecting;
      sticky.classList.toggle('show',!hidden);
      sticky.setAttribute('aria-hidden',hidden?'true':'false');
      sticky.querySelectorAll('a,button').forEach(function(x){x.tabIndex=hidden?-1:0});
    }).observe(buyBox);
  }

  /* --- pasek postepu kursu przy przewijaniu --- */
  var prog=document.querySelector('.course-progress i');
  if(prog){
    var target=document.querySelector(prog.parentNode.getAttribute('data-target'))||document.body,ticking=false;
    var upd=function(){
      ticking=false;
      var r=target.getBoundingClientRect(),h=r.height-window.innerHeight*.6;
      var p=Math.max(0,Math.min(1,(-r.top+window.innerHeight*.3)/(h>0?h:1)));
      prog.style.transform='scaleX('+p.toFixed(3)+')';
    };
    window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(upd)}},{passive:true});
    window.addEventListener('resize',upd);upd();
  }

  /* --- liczniki --- */
  function fmt(v,dec){return v.toLocaleString('pl-PL',{minimumFractionDigits:dec,maximumFractionDigits:dec})}
  function runCount(el){
    var to=parseFloat(el.getAttribute('data-to')),dec=parseInt(el.getAttribute('data-dec')||'0',10),suf=el.getAttribute('data-suf')||'';
    if(reduce){el.textContent=fmt(to,dec)+suf;return}
    var t0=null,dur=1200;
    function step(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=fmt(to*e,dec)+suf;if(k<1)requestAnimationFrame(step)}
    requestAnimationFrame(step);
  }

  /* --- wejscia sekcji, rysowanie ikon, makieta, liczniki --- */
  var els=Array.prototype.slice.call(document.querySelectorAll('.reveal,.draw-in,.count,.rating-sum,.timeline,.anno,.ex-layer'));
  document.querySelectorAll('svg.draw').forEach(function(s){if(!s.closest('.reveal,.draw-in'))els.push(s)});
  var batch=0;
  if('IntersectionObserver' in window && !reduce){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting)return;
        var t=en.target;
        if(t.classList.contains('reveal')){t.style.transitionDelay=(batch++*0.075).toFixed(3)+'s';setTimeout(function(){batch=0},0)}
        t.classList.add('in');
        if(t.classList.contains('count'))runCount(t);
        io.unobserve(t);
      });
    },{rootMargin:'0px 0px -40px 0px',threshold:0.15});
    els.forEach(function(el){io.observe(el)});
  } else {els.forEach(function(el){el.classList.add('in')})}


  /* ===== ETAP 3 ===== */
  var fine=window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

  /* --- ETAP 4: parallax warstw hero ---
     Kursor: tylko warstwy bez data-nocursor, wygladzanie lerp, amplituda maks. 12 px.
     Przewijanie: CSS scroll-driven (animation-timeline), tu tylko zamiennik z lerp, gdy przegladarka go nie zna. */
  var scrollTL=window.CSS&&CSS.supports&&CSS.supports('animation-timeline: scroll()');
  if(!reduce){
    document.querySelectorAll('[data-parallax]').forEach(function(st){
      var layers=Array.prototype.slice.call(st.querySelectorAll('[data-depth]')).map(function(l){
        return {el:l,d:Math.min(1,parseFloat(l.getAttribute('data-depth'))||0),cur:!l.hasAttribute('data-nocursor'),sc:parseFloat(l.getAttribute('data-scroll')||'0')}});
      var tx=0,ty=0,cx=0,cy=0,ts=0,cs=0,raf=0,top0=0,rw=1,rh=1,rl=0,rt=0;
      function measure(){var r=st.getBoundingClientRect();top0=r.top+window.scrollY;rw=r.width||1;rh=r.height||1;rl=r.left;rt=top0}
      function frame(){
        raf=0;
        cx+=(tx-cx)*.1;cy+=(ty-cy)*.1;cs+=(ts-cs)*.1;
        layers.forEach(function(o){
          var x=o.cur?cx*o.d*12:0,y=(o.cur?cy*o.d*10:0)+(scrollTL?0:-cs*o.sc);
          o.el.style.transform='translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0)';
        });
        if(Math.abs(tx-cx)>.002||Math.abs(ty-cy)>.002||Math.abs(ts-cs)>.1)raf=requestAnimationFrame(frame);
      }
      function go(){if(!raf)raf=requestAnimationFrame(frame)}
      measure();window.addEventListener('resize',measure);window.addEventListener('load',measure);
      if(fine){
        st.addEventListener('pointermove',function(e){tx=(e.clientX-rl)/rw-.5;ty=(e.pageY-rt)/rh-.5;go()});
        st.addEventListener('pointerleave',function(){tx=0;ty=0;go()});
      }
      if(!scrollTL){window.addEventListener('scroll',function(){ts=clamp(window.scrollY-top0,0,600)/10;go()},{passive:true})}
    });
  }
  /* --- marquee: pauza --- */
  document.querySelectorAll('.mq-toggle').forEach(function(b){
    var m=b.closest('.marquee'),lab=b.querySelector('.sr-only');
    b.addEventListener('click',function(){
      var on=b.getAttribute('aria-pressed')!=='true';
      b.setAttribute('aria-pressed',on?'true':'false');m.classList.toggle('paused',on);
      lab.textContent=on?'Wznów przewijanie paska umiejętności':'Zatrzymaj przewijanie paska umiejętności';
    });
  });

  /* --- orbitujace karty: CSS scroll-driven (view timeline), zamiennik JS z lerp --- */
  var orbit=document.querySelector('[data-orbit]');
  if(orbit&&!reduce&&!scrollTL){
    var ocs=Array.prototype.slice.call(orbit.querySelectorAll('.oc')).map(function(c){
      var cs=getComputedStyle(c);return {el:c,dx:parseFloat(cs.getPropertyValue('--dx'))||0,dy:parseFloat(cs.getPropertyValue('--dy'))||0,r:parseFloat(cs.getPropertyValue('--rot'))||0,s:parseFloat(cs.getPropertyValue('--s'))||1}});
    var mqo=window.matchMedia('(min-width: 901px)'),oTop=0,oH=1,op=0,ot=0,oraf=0;
    function om(){var r=orbit.getBoundingClientRect();oTop=r.top+window.scrollY;oH=r.height}
    function oframe(){
      oraf=0;op+=(ot-op)*.1;
      ocs.forEach(function(o){o.el.style.transform=mqo.matches?'translate3d('+(o.dx*op).toFixed(2)+'px,'+(o.dy*op).toFixed(2)+'px,0) rotate('+(o.r*op).toFixed(2)+'deg) scale('+o.s+')':''});
      if(Math.abs(ot-op)>.001)oraf=requestAnimationFrame(oframe);
    }
    function otarget(){var vh=window.innerHeight;ot=clamp((window.scrollY+vh-oTop)/(vh+oH),0,1)*2-1;if(!oraf)oraf=requestAnimationFrame(oframe)}
    om();window.addEventListener('resize',function(){om();otarget()});window.addEventListener('load',function(){om();otarget()});
    window.addEventListener('scroll',otarget,{passive:true});otarget();
  }
  /* --- zakladki (ARIA tabs) --- */
  document.querySelectorAll('[data-tabs]').forEach(function(box,bi){
    var tabs=Array.prototype.slice.call(box.querySelectorAll('.tab')),list=box.querySelector('.tab-list');
    var target=document.querySelector(box.getAttribute('data-target'));
    list.setAttribute('role','tablist');list.setAttribute('aria-label','Etapy nauki');
    box.classList.add('on');
    tabs.forEach(function(t,i){
      var pid=t.getAttribute('data-tab'),pan=document.getElementById(pid);
      t.id='tab-'+bi+'-'+i;t.setAttribute('role','tab');t.setAttribute('aria-controls',pid);
      pan.setAttribute('role','tabpanel');pan.setAttribute('aria-labelledby',t.id);pan.tabIndex=0;
    });
    function select(i,focus){
      tabs.forEach(function(t,j){
        var on=j===i;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1;t.classList.toggle('done',j<i);
        document.getElementById(t.getAttribute('data-tab')).hidden=!on;
      });
      if(target)target.setAttribute('data-step',i+1);
      if(focus)tabs[i].focus();
    }
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){select(i)});
      t.addEventListener('keydown',function(e){
        var k=e.key,n=tabs.length,j=null;
        if(k==='ArrowRight')j=(i+1)%n;else if(k==='ArrowLeft')j=(i-1+n)%n;else if(k==='Home')j=0;else if(k==='End')j=n-1;
        if(j!==null){e.preventDefault();select(j,true)}
      });
    });
    select(0);
  });

  /* --- adnotacje na zrzucie lekcji --- */
  document.querySelectorAll('[data-anno]').forEach(function(box){
    var svg=box.querySelector('.anno-lines'),hs=Array.prototype.slice.call(box.querySelectorAll('.hs'));
    hs.forEach(function(h){
      var d=document.getElementById(h.getAttribute('aria-controls'));
      if(d)d.hidden=true;
      h.addEventListener('click',function(){
        var open=h.getAttribute('aria-expanded')!=='true';
        h.setAttribute('aria-expanded',open?'true':'false');if(d)d.hidden=!open;
        var lab=box.querySelector('[data-for="'+h.id+'"]');if(lab)lab.classList.toggle('active',open);
        draw();
      });
    });
    function draw(){
      if(!svg)return;
      var br=box.getBoundingClientRect();
      svg.setAttribute('viewBox','0 0 '+br.width.toFixed(0)+' '+br.height.toFixed(0));
      var out='';
      hs.forEach(function(h,i){
        var lab=box.querySelector('[data-for="'+h.id+'"]');
        if(!lab||!lab.offsetParent)return;
        var a=h.getBoundingClientRect(),l=lab.getBoundingClientRect();
        var x1=a.left+a.width/2-br.left,y1=a.top+a.height/2-br.top;
        var left=l.left+l.width/2<x1+br.left;
        var x2=(left?l.right:l.left)-br.left,y2=l.top+22-br.top;
        var mxp=x2+(left?24:-24);
        out+='<path class="ln" style="transition-delay:'+(i*0.12)+'s" pathLength="1" d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' L'+mxp.toFixed(1)+' '+y2.toFixed(1)+' L'+x2.toFixed(1)+' '+y2.toFixed(1)+'"/><circle cx="'+x2.toFixed(1)+'" cy="'+y2.toFixed(1)+'" r="3.5"/>';
      });
      svg.innerHTML=out;
    }
    draw();window.addEventListener('resize',draw);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);
    window.addEventListener('load',draw);
  });

  /* --- widok rozlozony kursu: CSS scroll-driven, zamiennik JS z lerp --- */
  document.querySelectorAll('[data-explode]').forEach(function(sec){
    if(reduce||scrollTL)return;
    var mqe=window.matchMedia('(min-width: 901px)'),eTop=0,eH=1,p=1,t=1,raf=0;
    sec.classList.add('ex-js');
    function m(){var r=sec.getBoundingClientRect();eTop=r.top+window.scrollY;eH=r.height}
    function f(){raf=0;p+=(t-p)*.1;sec.style.setProperty('--p',p.toFixed(4));if(Math.abs(t-p)>.0005)raf=requestAnimationFrame(f)}
    function tg(){
      if(!mqe.matches){t=1;p=1;sec.style.removeProperty('--p');return}
      var h=eH-window.innerHeight;t=clamp((window.scrollY-eTop+window.innerHeight*.15)/(h>0?h*.8:1),0,1);if(!raf)raf=requestAnimationFrame(f);
    }
    m();window.addEventListener('resize',function(){m();tg()});window.addEventListener('load',function(){m();tg()});
    window.addEventListener('scroll',tg,{passive:true});tg();
  });

  /* --- galeria kursu z lightboxem --- */
  document.querySelectorAll('[data-gallery]').forEach(function(g){
    var slides=Array.prototype.slice.call(g.querySelectorAll('.gal-slide')),thumbs=Array.prototype.slice.call(g.querySelectorAll('.gal-thumbs button'));
    var cnt=g.querySelector('.gal-count'),main=g.querySelector('.gal-main'),i=0,n=slides.length;
    g.classList.add('gal-on');
    function show(k,focusThumb){
      i=(k+n)%n;
      slides.forEach(function(s,j){s.classList.toggle('on',j===i);s.setAttribute('aria-hidden',j===i?'false':'true')});
      thumbs.forEach(function(t,j){if(j===i)t.setAttribute('aria-current','true');else t.removeAttribute('aria-current')});
      if(cnt)cnt.textContent=(i+1)+' z '+n;
      if(focusThumb&&thumbs[i])thumbs[i].focus();
      var th=thumbs[i];if(th&&th.parentNode&&th.parentNode.parentNode.scrollTo){var ul=th.parentNode.parentNode;ul.scrollTo({left:th.parentNode.offsetLeft-ul.clientWidth/2+th.parentNode.clientWidth/2,behavior:reduce?'auto':'smooth'})}
    }
    thumbs.forEach(function(t,j){t.addEventListener('click',function(){show(j)})});
    g.querySelector('.gal-prev').addEventListener('click',function(){show(i-1)});
    g.querySelector('.gal-next').addEventListener('click',function(){show(i+1)});
    g.addEventListener('keydown',function(e){
      if(e.target.closest('input,textarea,select'))return;
      var tb=thumbs.indexOf(e.target),at=tb>-1?tb:i;
      if(e.key==='ArrowRight'){e.preventDefault();show(at+1,tb>-1)}
      else if(e.key==='ArrowLeft'){e.preventDefault();show(at-1,tb>-1)}
    });
    var sx=null,sy0=0;
    main.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse')return;sx=e.clientX;sy0=e.clientY});
    main.addEventListener('pointerup',function(e){if(sx===null)return;var dx=e.clientX-sx,dy=e.clientY-sy0;sx=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy))show(dx<0?i+1:i-1)});
    main.addEventListener('pointercancel',function(){sx=null});
    /* lightbox */
    var dlg=document.getElementById('lightbox');
    if(!dlg||!dlg.showModal){var zb=g.querySelector('.gal-zoom');if(zb)zb.hidden=true;return}
    var box=dlg.querySelector('.lb-stage'),lcnt=dlg.querySelector('.lb-count'),opener=null,li=0;
    function lshow(k){
      li=(k+n)%n;var s=slides[li];box.innerHTML='';box.classList.remove('zoomed');
      var img=s.querySelector('img.gal-img');
      if(img){var c=document.createElement('img');c.src=img.getAttribute('data-full')||img.currentSrc||img.src;c.alt=img.alt;c.className='lb-img';box.appendChild(c);box.setAttribute('data-zoomable','1')}
      else{var h=s.querySelector('.gal-html');if(h){var cl=h.cloneNode(true);cl.querySelectorAll('[id]').forEach(function(x){x.removeAttribute('id')});cl.querySelectorAll('[data-depth]').forEach(function(x){x.removeAttribute('data-depth');x.style.transform=''});box.appendChild(cl)}box.removeAttribute('data-zoomable')}
      lcnt.textContent=(li+1)+' z '+n+': '+(s.getAttribute('data-caption')||'');
    }
    g.querySelectorAll('.gal-zoom,.gal-open').forEach(function(b){b.addEventListener('click',function(){opener=b;lshow(i);dlg.showModal();dlg.querySelector('.lb-close').focus()})});
    dlg.querySelector('.lb-close').addEventListener('click',function(){dlg.close()});
    dlg.querySelector('.lb-prev').addEventListener('click',function(){lshow(li-1)});
    dlg.querySelector('.lb-next').addEventListener('click',function(){lshow(li+1)});
    dlg.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();lshow(li+1)}else if(e.key==='ArrowLeft'){e.preventDefault();lshow(li-1)}});
    dlg.addEventListener('close',function(){show(li);if(opener)opener.focus()});
    dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
    box.addEventListener('click',function(e){
      if(!box.hasAttribute('data-zoomable'))return;
      var im=box.querySelector('.lb-img');if(!im)return;
      var r=im.getBoundingClientRect();
      im.style.transformOrigin=((e.clientX-r.left)/r.width*100).toFixed(1)+'% '+((e.clientY-r.top)/r.height*100).toFixed(1)+'%';
      box.classList.toggle('zoomed');
    });
    var zt=dlg.querySelector('.lb-zoom');
    if(zt)zt.addEventListener('click',function(){if(box.hasAttribute('data-zoomable')){var im=box.querySelector('.lb-img');if(im)im.style.transformOrigin='50% 50%';box.classList.toggle('zoomed')}});
    show(0);
  });
  /* --- porownanie przed / po (suwak) --- */
  document.querySelectorAll('[data-cmp]').forEach(function(c){
    var r=c.querySelector('input[type=range]');
    if(!r)return;
    function set(){c.style.setProperty('--pos',r.value+'%');r.setAttribute('aria-valuetext',r.value<50?'Więcej widać wersji po kursie':(r.value>50?'Więcej widać wersji przed kursem':'Po połowie przed i po kursie'))}
    r.addEventListener('input',set);set();
  });

  /* --- informacja o cookies (przyklad) --- */
  var CK='prosto-cookies';
  function getCk(){try{return localStorage.getItem(CK)}catch(e){return null}}
  function setCk(v){try{localStorage.setItem(CK,v)}catch(e){}}
  function showCookies(focus){
    if(document.getElementById('cookies'))return;
    var d=document.createElement('section');d.className='cookies';d.id='cookies';d.setAttribute('aria-labelledby','ck-h');
    d.innerHTML='<h2 id="ck-h">Pliki cookies (przykład)</h2><p>Analityczne i marketingowe włączymy tylko za Twoją zgodą. <a href="'+base+'polityka-prywatnosci.html#cookies">Szczegóły</a></p><div class="row"><button type="button" class="btn btn-ghost" data-ck="odrzucone">Odrzucam</button><button type="button" class="btn btn-ghost" data-ck="zaakceptowane">Akceptuję</button></div>';
    document.body.appendChild(d);
    d.addEventListener('click',function(e){var b=e.target.closest('[data-ck]');if(!b)return;setCk(b.getAttribute('data-ck'));d.remove();say('Zapisano wybór dotyczący plików cookies.')});
    if(focus){var f=d.querySelector('button');if(f)f.focus()}
  }
  if(!getCk())showCookies(false);
  document.querySelectorAll('[data-cookies]').forEach(function(b){b.addEventListener('click',function(){showCookies(true)})});
})();
