/* Złotnicza 7: wspolny JS serwisu demo (menu, podmenu, wejscia sekcji, liczniki, adnotacje, formularze, filtr bloga, cookies).
   Etap 4: bez parallaxu, marquee i orbity; strona ma byc spokojna. */
(function(){
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnim=('IntersectionObserver' in window)&&!reduce;
  if(canAnim)document.documentElement.classList.add('js-anim');

  function store(k,v){try{if(v===undefined)return window.localStorage.getItem(k);window.localStorage.setItem(k,v)}catch(e){return null}}

  /* naglowek sticky */
  var header=document.getElementById('naglowek');
  if(header){
    var onScroll=function(){header.classList.toggle('scrolled',window.scrollY>40||nav.classList.contains('open'))};
    var nav=header.querySelector('.nav'),burger=header.querySelector('.burger');
    onScroll();window.addEventListener('scroll',onScroll,{passive:true});
    function setMenu(open){
      nav.classList.toggle('open',open);
      burger.setAttribute('aria-expanded',open?'true':'false');
      burger.setAttribute('aria-label',open?'Zamknij menu':'Otwórz menu');
      onScroll();
    }
    burger.addEventListener('click',function(){setMenu(!nav.classList.contains('open'))});
    header.querySelectorAll('.mobile-menu a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});

    /* podmenu obszarow praktyki */
    var subBtn=header.querySelector('.sub-btn'),sub=subBtn&&document.getElementById(subBtn.getAttribute('aria-controls'));
    function setSub(open){if(!subBtn)return;subBtn.setAttribute('aria-expanded',open?'true':'false');sub.classList.toggle('open',open)}
    if(subBtn){
      subBtn.addEventListener('click',function(e){e.stopPropagation();setSub(subBtn.getAttribute('aria-expanded')!=='true')});
      document.addEventListener('click',function(e){if(!subBtn.parentNode.contains(e.target))setSub(false)});
      subBtn.parentNode.addEventListener('focusout',function(e){if(!subBtn.parentNode.contains(e.relatedTarget))setSub(false)});
    }
    document.addEventListener('keydown',function(e){
      if(e.key!=='Escape')return;
      if(subBtn&&subBtn.getAttribute('aria-expanded')==='true'){setSub(false);subBtn.focus();return}
      if(nav.classList.contains('open')){setMenu(false);burger.focus()}
    });
  }

  /* liczniki: wartosc koncowa jest w HTML, skrypt tylko odlicza */
  function countUp(el){
    var target=parseFloat(el.getAttribute('data-count')),suffix=el.getAttribute('data-suffix')||'',start=null,dur=700;
    if(isNaN(target))return;
    function step(t){if(!start)start=t;var p=Math.min((t-start)/dur,1),e=1-Math.pow(1-p,3);el.textContent=Math.round(target*e)+suffix;if(p<1)requestAnimationFrame(step)}
    el.textContent='0'+suffix;requestAnimationFrame(step);
  }

  /* wejscia sekcji, kreslenie ikon, schemat procesu: raz przy wejsciu w widok */
  var targets=document.querySelectorAll('.reveal,.draw,.timeline,.docs,.illu,[data-count],.annot,.mock');
  if(canAnim){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting)return;
        var el=en.target;
        if(el.hasAttribute('data-count'))countUp(el);else el.classList.add('in');
        io.unobserve(el);
      });
    },{threshold:.2,rootMargin:'0px 0px -40px 0px'});
    targets.forEach(function(el){io.observe(el)});
  }


  /* zdjecie z adnotacjami: przyciski rozwijaja opisy */
  document.querySelectorAll('.annot').forEach(function(an){
    var btns=an.querySelectorAll('.hot');
    function set(b,open){var d=document.getElementById(b.getAttribute('aria-controls'));b.setAttribute('aria-expanded',open?'true':'false');if(d)d.hidden=!open}
    btns.forEach(function(b,i){
      set(b,i===0);
      b.addEventListener('click',function(){var open=b.getAttribute('aria-expanded')!=='true';btns.forEach(function(x){set(x,false)});set(b,open)});
      b.addEventListener('mouseenter',function(){btns.forEach(function(x){set(x,x===b)})});
    });
  });

  /* formularze demo */
  document.querySelectorAll('form[data-demo]').forEach(function(form){
    var msg=form.querySelector('.form-msg');
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(!form.checkValidity()){form.reportValidity();return}
      msg.hidden=false;
      msg.textContent='To wersja demonstracyjna, formularz niczego nie wysyła.';
    });
  });

  /* filtr kategorii bloga */
  var filters=document.querySelectorAll('.filters button');
  if(filters.length){
    var cards=document.querySelectorAll('[data-cat]'),live=document.getElementById('filtr-status');
    filters.forEach(function(b){
      b.addEventListener('click',function(){
        var cat=b.getAttribute('data-filter'),n=0;
        filters.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
        cards.forEach(function(c){var show=cat==='all'||c.getAttribute('data-cat')===cat;c.hidden=!show;if(show)n++});
        if(live)live.textContent='Widoczne wpisy: '+n;
      });
    });
  }

  /* baner cookies (przyklad) */
  var cookie=document.getElementById('cookie');
  if(cookie){
    var saved=store('z7-cookies');
    if(!saved)cookie.hidden=false;
    function close(val){store('z7-cookies',val);cookie.hidden=true}
    cookie.querySelector('[data-c="yes"]').addEventListener('click',function(){close('all')});
    cookie.querySelector('[data-c="no"]').addEventListener('click',function(){close('none')});
    cookie.querySelector('[data-c="save"]').addEventListener('click',function(){close('custom')});
    document.querySelectorAll('[data-cookies]').forEach(function(b){b.addEventListener('click',function(){cookie.hidden=false;cookie.querySelector('button').focus()})});
  }
})();
