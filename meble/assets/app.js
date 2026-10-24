/* Słoje: wspólny skrypt serwisu demo (bez bibliotek). */
(function(){
  'use strict';
  var doc=document, root=doc.documentElement, body=doc.body;
  var BASE=body.getAttribute('data-base')||'';
  var PROG_DOSTAWY=3000, KOSZT_DOSTAWY=149;
  var bezRuchu=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Pamięć przeglądarki zawsze w try/catch (tryb prywatny, zablokowane dane). */
  function czytaj(klucz,domyslne){try{var v=localStorage.getItem(klucz);return v?JSON.parse(v):domyslne}catch(e){return domyslne}}
  function zapisz(klucz,wartosc){try{localStorage.setItem(klucz,JSON.stringify(wartosc))}catch(e){}}

  function zl(n){
    var s=String(Math.round(n)),o='';
    while(s.length>3){o=' '+s.slice(-3)+o;s=s.slice(0,-3)}
    return s+o+' zł';
  }
  function $(sel,ctx){return (ctx||doc).querySelector(sel)}
  function $$(sel,ctx){return Array.prototype.slice.call((ctx||doc).querySelectorAll(sel))}

  /* Nagłówek */
  var naglowek=$('#naglowek');
  function onScroll(){naglowek.classList.toggle('przewiniety',window.scrollY>8)}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  var mt=$('#menu-toggle');
  function zamknijMenu(){naglowek.classList.remove('menu-otwarte');mt.setAttribute('aria-expanded','false');mt.setAttribute('aria-label','Otwórz menu')}
  mt.addEventListener('click',function(){
    var o=naglowek.classList.toggle('menu-otwarte');
    mt.setAttribute('aria-expanded',o);mt.setAttribute('aria-label',o?'Zamknij menu':'Otwórz menu');
  });
  $$('#menu a').forEach(function(a){a.addEventListener('click',zamknijMenu)});
  doc.addEventListener('keydown',function(e){if(e.key==='Escape'&&naglowek.classList.contains('menu-otwarte')){zamknijMenu();mt.focus()}});

  var st=$('#szukaj-toggle');
  st.addEventListener('click',function(){
    var o=naglowek.classList.toggle('szukaj-otwarte');st.setAttribute('aria-expanded',o);
    st.setAttribute('aria-label',o?'Ukryj wyszukiwarkę':'Pokaż wyszukiwarkę');
    if(o)$('#pole-szukaj').focus();
  });
  $('#szukaj').addEventListener('submit',function(e){e.preventDefault();pokazToast('To wersja demonstracyjna, wyszukiwarka niczego nie wyszukuje.')});

  /* Toast */
  var toast=$('#toast'),tt=$('#toast-tekst'),tTimer;
  function pokazToast(t){tt.textContent=t;toast.classList.add('widoczny');clearTimeout(tTimer);tTimer=setTimeout(function(){toast.classList.remove('widoczny')},3200)}

  function puls(el){el.classList.remove('puls');void el.offsetWidth;el.classList.add('puls')}

  /* Koszyk: [{k,id,nazwa,wariant,cena,img,url,ilosc}] */
  var koszyk=czytaj('sloje-koszyk',[]);
  if(!Array.isArray(koszyk))koszyk=[];
  /* Ścieżki z pamięci przeglądarki trafiają do HTML, więc dopuszczamy tylko bezpieczne znaki. */
  function sciezka(s){s=String(s||'');return /^[a-z0-9\-\/.#]+$/i.test(s)&&s.indexOf('//')<0?s:'index.html'}
  koszyk=koszyk.filter(function(p){return p&&p.id&&p.nazwa&&isFinite(p.cena)&&p.ilosc>0}).map(function(p){p.url=sciezka(p.url);p.img=sciezka(p.img);p.cena=Number(p.cena);p.ilosc=Math.min(20,Math.max(1,parseInt(p.ilosc,10)||1));return p});
  function liczbaSztuk(){return koszyk.reduce(function(a,p){return a+p.ilosc},0)}
  function wartosc(){return koszyk.reduce(function(a,p){return a+p.cena*p.ilosc},0)}
  function odswiezLicznik(animuj){
    var n=liczbaSztuk(),l=$('#licznik-koszyk');
    l.textContent=n;l.setAttribute('data-zero',n===0);
    $('#koszyk-link').setAttribute('aria-label','Koszyk, liczba produktów: '+n);
    if(animuj)puls(l);
  }
  function zapiszKoszyk(){zapisz('sloje-koszyk',koszyk);odswiezLicznik(false)}

  function dodajDoKoszyka(d,ilosc){
    var k=d.id+'|'+(d.wariant||'');
    var p=koszyk.filter(function(x){return x.k===k})[0];
    if(p){p.ilosc=Math.min(p.ilosc+ilosc,20)}
    else koszyk.push({k:k,id:d.id,nazwa:d.nazwa,wariant:d.wariant||'',cena:Number(d.cena),img:sciezka(d.img),url:sciezka(d.url),ilosc:ilosc});
    zapiszKoszyk();
  }

  /* Mikrointerakcja: miniatura produktu leci do ikony koszyka, licznik podskakuje. */
  function lotDoKoszyka(zrodlo,gotowe){
    var cel=$('#koszyk-link');
    if(bezRuchu||!zrodlo||!zrodlo.getBoundingClientRect){gotowe();return}
    var a=zrodlo.getBoundingClientRect(),b=cel.getBoundingClientRect();
    if(a.width===0||a.bottom<0||a.top>window.innerHeight){gotowe();return}
    var r=Math.min(a.width,a.height,160);
    var img=doc.createElement('img');img.src=zrodlo.currentSrc||zrodlo.src;img.alt='';img.className='lot';
    var x=a.left+a.width/2-r/2,y=a.top+a.height/2-r/2;
    img.style.cssText='left:'+x+'px;top:'+y+'px;width:'+r+'px;height:'+r+'px';
    body.appendChild(img);
    var dx=b.left+b.width/2-(x+r/2),dy=b.top+b.height/2-(y+r/2);
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      img.style.transform='translate('+dx+'px,'+dy+'px) scale(.12)';img.style.opacity='.4';
    })});
    var koniec=false;
    function fin(){if(koniec)return;koniec=true;img.remove();gotowe()}
    img.addEventListener('transitionend',fin);setTimeout(fin,800);
  }

  doc.addEventListener('click',function(e){
    var b=e.target.closest('.dodaj');
    if(!b||b.disabled)return;
    var d={id:b.dataset.id,nazwa:b.dataset.nazwa,wariant:b.dataset.wariant,cena:b.dataset.cena,img:b.dataset.img,url:b.dataset.url};
    if(!d.id)return;
    var poleIl=b.dataset.ilosc?$(b.dataset.ilosc):null;
    var ilosc=poleIl?Math.max(1,Math.min(20,parseInt(poleIl.value,10)||1)):1;
    dodajDoKoszyka(d,ilosc);
    var dod=b.dataset.dodatek?$(b.dataset.dodatek):null,zDod='';
    if(dod&&dod.checked){dodajDoKoszyka({id:dod.dataset.id,nazwa:dod.dataset.nazwa,wariant:'',cena:dod.dataset.cena,img:dod.dataset.img,url:dod.dataset.url},1);zDod=' i '+dod.dataset.nazwa.toLowerCase()}
    doc.dispatchEvent(new CustomEvent('koszyk-zmiana'));
    var kont=b.closest('.produkt,.pdp');
    var foto=b.dataset.foto?$(b.dataset.foto):(kont?kont.querySelector('img'):null);
    var html=b.innerHTML;b.classList.add('dodano');b.disabled=true;
    b.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path class="ok-check" pathLength="1" d="m5 12.5 4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Dodano';
    lotDoKoszyka(foto,function(){odswiezLicznik(true)});
    setTimeout(function(){b.classList.remove('dodano');b.innerHTML=html;b.disabled=false},1600);
    pokazToast(d.nazwa+(d.wariant?' ('+d.wariant+')':'')+zDod+' w koszyku. Sztuk w koszyku: '+liczbaSztuk()+'.');
  });

  /* Ulubione */
  var ulubione=czytaj('sloje-ulubione',[]);
  if(!Array.isArray(ulubione))ulubione=[];
  function odswiezUlubione(animuj){
    var l=$('#licznik-ulubione'),n=ulubione.length;
    l.textContent=n;l.setAttribute('data-zero',n===0);
    $('#ulubione-link').setAttribute('aria-label','Ulubione, liczba produktów: '+n);
    if(animuj)puls(l);
    $$('[data-ulubione]').forEach(function(s){s.setAttribute('aria-pressed',ulubione.indexOf(s.dataset.ulubione)>-1)});
    var ul=$('#ulubione-lista');
    if(ul){var w=0;$$('li[data-ulub]',ul).forEach(function(li){var on=ulubione.indexOf(li.dataset.ulub)>-1;li.hidden=!on;if(on)w++});
      $('#ulubione-pusto').hidden=w>0;$('#ulubione-wynik').textContent=w?('Zapisane meble: '+w):''}
  }
  doc.addEventListener('click',function(e){
    var s=e.target.closest('[data-ulubione]');if(!s)return;
    var id=s.dataset.ulubione,i=ulubione.indexOf(id);
    if(i>-1)ulubione.splice(i,1);else ulubione.push(id);
    zapisz('sloje-ulubione',ulubione);odswiezUlubione(true);
  });

  odswiezLicznik(false);odswiezUlubione(false);

  /* Punkty na aranżacji */
  $$('.punkt').forEach(function(p){
    p.addEventListener('click',function(){
      var o=p.getAttribute('aria-expanded')!=='true';
      $$('.punkt').forEach(function(x){x.setAttribute('aria-expanded','false')});
      p.setAttribute('aria-expanded',o);
    });
  });

  /* Formularze demo (walidacja przeglądarki, potem komunikat) */
  $$('form[data-demo]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var k=f.querySelector('.komunikat')||doc.getElementById(f.dataset.komunikat);
      if(k)k.textContent='To wersja demonstracyjna, formularz niczego nie wysyła.';
    });
  });

  /* Liczniki statystyk: domyślnie wartość końcowa, odliczanie tylko z JS i bez reduced motion */
  function odliczaj(el){
    var cel=parseFloat(el.dataset.licz),sufiks=el.dataset.sufiks||'',start=null,czas=1200;
    function fmt(v){return v>=10000?String(v).replace(/\B(?=(\d{3})+(?!\d))/g,' '):String(v)}
    function krok(t){if(!start)start=t;var p=Math.min((t-start)/czas,1),e=1-Math.pow(1-p,3);
      el.textContent=fmt(Math.round(cel*e))+sufiks;if(p<1)requestAnimationFrame(krok)}
    el.textContent='0'+sufiks;requestAnimationFrame(krok);
  }

  /* Wejścia sekcji, rysowanie ikon, oś procesu */
  var anim=$$('.wejscie,[data-anim]');
  if('IntersectionObserver' in window&&!bezRuchu){
    var io=new IntersectionObserver(function(en){en.forEach(function(x){
      if(x.isIntersecting){x.target.classList.add('widoczne');
        $$('[data-licz]',x.target).forEach(odliczaj);
        if(x.target.hasAttribute('data-licz'))odliczaj(x.target);
        io.unobserve(x.target)}
    })},{threshold:.15,rootMargin:'0px 0px -40px 0px'});
    anim.forEach(function(x){io.observe(x)});
  }else anim.forEach(function(x){x.classList.add('widoczne')});

  /* ===== Kategoria: filtry i sortowanie ===== */
  var listing=$('#listing');
  if(listing){
    var formF=$('#filtry-form'),sort=$('#sortuj'),wynik=$('#wynik'),pusto=$('#pusto');
    var karty=$$('li[data-cena]',listing),promo=$('#kafel-promo');
    function filtruj(){
      var kolory=$$('input[name="kolor"]:checked',formF).map(function(i){return i.value});
      var rodzaje=$$('input[name="rodzaj"]:checked',formF).map(function(i){return i.value});
      var szer=(formF.querySelector('input[name="szer"]:checked')||{}).value||'';
      var cenaMax=parseInt((formF.querySelector('input[name="cena"]:checked')||{}).value||'0',10);
      var n=0;
      karty.forEach(function(k){
        var ok=true,kk=k.dataset.kolory.split(' '),sz=k.dataset.szer.split(' ').map(Number);
        if(kolory.length&&!kolory.some(function(c){return kk.indexOf(c)>-1}))ok=false;
        if(rodzaje.length&&rodzaje.indexOf(k.dataset.rodzaj)<0)ok=false;
        if(szer){var r=szer.split('-').map(Number);if(!sz.some(function(v){return v>=r[0]&&v<=r[1]}))ok=false}
        if(cenaMax&&Number(k.dataset.cena)>cenaMax)ok=false;
        k.hidden=!ok;if(ok)n++;
      });
      var tryb=sort.value;
      karty.slice().sort(function(a,b){
        if(tryb==='cena-rosnaco')return a.dataset.cena-b.dataset.cena;
        if(tryb==='cena-malejaco')return b.dataset.cena-a.dataset.cena;
        if(tryb==='ocena')return b.dataset.ocena-a.dataset.ocena;
        return a.dataset.polecane-b.dataset.polecane;
      }).forEach(function(k){listing.appendChild(k)});
      if(promo)listing.appendChild(promo);
      wynik.textContent=n===1?'1 model':(n>1&&n<5?n+' modele':n+' modeli');
      pusto.hidden=n>0;
    }
    var fd=$('#filtry');if(fd&&window.matchMedia('(max-width: 900px)').matches)fd.open=false;
    try{var rp=new URLSearchParams(location.search).get('rodzaj');if(rp){var rc=formF.querySelector('input[name="rodzaj"][value="'+rp.replace(/[^a-z]/g,'')+'"]');if(rc)rc.checked=true}}catch(e){}
    formF.addEventListener('change',filtruj);sort.addEventListener('change',filtruj);
    formF.addEventListener('reset',function(){setTimeout(filtruj,0)});
    formF.addEventListener('submit',function(e){e.preventDefault()});
    $('#pusto-reset').addEventListener('click',function(){formF.reset();$('#filtry-form input').focus()});
    filtruj();
  }

  /* ===== Karta produktu ===== */
  var pdp=$('#pdp');
  if(pdp){
    var glowne=$('#foto-glowne'),podpis=$('#foto-podpis');
    function pokazFoto(src,alt,opis){
      if(!glowne||glowne.getAttribute('src')===src)return;
      glowne.classList.add('zmiana');
      setTimeout(function(){glowne.src=src;glowne.alt=alt;podpis.textContent=opis||'';glowne.classList.remove('zmiana')},bezRuchu?0:150);
      $$('.miniatury button').forEach(function(m){m.setAttribute('aria-current',m.dataset.src===src)});
    }
    $$('.miniatury button').forEach(function(m){
      m.addEventListener('click',function(){pokazFoto(m.dataset.src,m.dataset.alt,m.dataset.opis)});
    });
    var btns=$$('.dodaj[data-pdp]');
    function aktualizuj(){
      var cena=Number(pdp.dataset.cena),przed=0,wariant=[],img=null;
      $$('.wybor input:checked',pdp).forEach(function(i){
        cena+=Number(i.dataset.doplata||0);
        if(i.dataset.cena)cena=Number(i.dataset.cena);
        if(i.dataset.przed)przed=Number(i.dataset.przed);
        wariant.push(i.dataset.etykieta||i.value);
        if(i.dataset.img)img=i;
        if(i.dataset.w)doc.dispatchEvent(new CustomEvent('galeria-wariant',{detail:i.dataset.w}));
        var leg=i.closest('fieldset').querySelector('legend span');if(leg)leg.textContent=i.dataset.etykieta||i.value;
      });
      $('#cena-teraz').textContent=zl(cena);
      var s=$('#cena-przed');if(s){s.hidden=!przed;$('#cena-przed-wart').textContent=przed?zl(przed):''}
      var om=$('#omnibus');if(om){om.hidden=!przed;$('#omnibus-wart').textContent=przed?zl(przed):''}
      var raty=$('#raty');if(raty)raty.textContent=(cena/20).toFixed(2).replace('.',',')+'\u00a0zł';
      $('#sticky-cena').textContent=zl(cena);
      var w=wariant.join(', ');
      btns.forEach(function(b){b.dataset.cena=cena;b.dataset.wariant=w;if(img)b.dataset.img=img.dataset.img});
      if(img&&glowne)pokazFoto(BASE+img.dataset.img,img.dataset.alt,img.dataset.opis);
    }
    $$('.wybor input',pdp).forEach(function(i){i.addEventListener('change',aktualizuj)});
    aktualizuj();
    var il=$('#ilosc');
    $$('[data-krok]').forEach(function(b){b.addEventListener('click',function(){
      il.value=Math.max(1,Math.min(20,(parseInt(il.value,10)||1)+Number(b.dataset.krok)));
    })});
    if($('.sticky-kup'))body.classList.add('ma-sticky');
  }

  /* ===== Koszyk ===== */
  var lista=$('#pozycje');
  if(lista){
    var pustyK=$('#koszyk-pusty'),pelnyK=$('#koszyk-pelny'),ogl=$('#koszyk-ogloszenie');
    function render(){
      lista.innerHTML='';
      if(!koszyk.length){pustyK.hidden=false;pelnyK.hidden=true;body.classList.remove('ma-sticky');return}
      pustyK.hidden=true;pelnyK.hidden=false;body.classList.add('ma-sticky');
      var up=$('.upsell');if(up)up.hidden=koszyk.some(function(p){return p.id==='zestaw-olej'});
      koszyk.forEach(function(p,i){
        var li=doc.createElement('li');li.className='pozycja';
        var idIl='il-'+i;
        li.innerHTML='<a class="pozycja-foto" href="'+BASE+p.url+'" tabindex="-1" aria-hidden="true"><img src="'+BASE+p.img+'" alt="" width="110" height="110"></a>'+
          '<div><h2><a href="'+BASE+p.url+'"></a></h2><p class="w"></p><p>Cena za sztukę: '+zl(p.cena)+'</p>'+
          '<div class="pozycja-akcje"><div class="ilosc"><button type="button" data-i="'+i+'" data-d="-1" aria-label="Zmniejsz ilość">−</button>'+
          '<label class="sr-only" for="'+idIl+'">Ilość</label><input id="'+idIl+'" type="number" min="1" max="20" inputmode="numeric" value="'+p.ilosc+'" data-i="'+i+'">'+
          '<button type="button" data-i="'+i+'" data-d="1" aria-label="Zwiększ ilość">+</button></div>'+
          '<button type="button" class="usun" data-usun="'+i+'">Usuń<span class="sr-only"> '+''+'</span></button></div></div>'+
          '<div class="pozycja-suma">'+zl(p.cena*p.ilosc)+'</div>';
        li.querySelector('h2 a').textContent=p.nazwa;
        li.querySelector('.w').textContent=p.wariant?'Wariant: '+p.wariant:'';
        li.querySelector('.usun .sr-only').textContent=p.nazwa;
        lista.appendChild(li);
      });
      /* Duże meble jadą z wniesieniem (149 zł), krzesła, stoliki, lampy i dodatki kurierem (29 zł).
         Rabat 10% od 4 krzeseł Wita lub Pola. Od 3 000 zł dostawa gratis. */
      var DUZE=['sofa-lena','sofa-ola','sofa-lino','sofa-mila','fotel-lena','stol-dlugi','biurko-kat'],KRZESLA=['krzeslo-wita','krzeslo-pola'];
      var w=wartosc(),maDuze=koszyk.some(function(p){return DUZE.indexOf(p.id)>-1});
      var krz=koszyk.filter(function(p){return KRZESLA.indexOf(p.id)>-1}),nKrz=krz.reduce(function(a,p){return a+p.ilosc},0);
      var rabat=nKrz>=4?Math.round(krz.reduce(function(a,p){return a+p.cena*p.ilosc},0)*.1):0;
      var poRabacie=w-rabat,brak=Math.max(0,PROG_DOSTAWY-poRabacie),dost=brak>0?(maDuze?KOSZT_DOSTAWY:29):0;
      $('#suma-produkty').textContent=zl(w);
      $('#rabat-etykieta').hidden=$('#suma-rabat').hidden=!rabat;$('#suma-rabat').textContent='-'+zl(rabat);
      $('#dostawa-etykieta').textContent=maDuze?'Dostawa z wniesieniem':'Kurier';
      $('#suma-dostawa').textContent=dost?zl(dost):'0 zł, gratis';
      $('#suma-razem').textContent=zl(poRabacie+dost);$('#sticky-razem').textContent=zl(poRabacie+dost);
      var prog=$('#prog');prog.classList.toggle('osiagniety',brak===0);
      $('#prog-tekst').textContent=brak>0?'Brakuje '+zl(brak)+' do darmowej dostawy.':(maDuze?'Masz darmową dostawę z wniesieniem i montażem.':'Masz darmową dostawę kurierem.');
      $('#prog-pasek b').style.transform='scaleX('+Math.min(1,poRabacie/PROG_DOSTAWY)+')';
      $('#prog-pasek').setAttribute('aria-valuenow',Math.round(Math.min(100,poRabacie/PROG_DOSTAWY*100)));
    }
    lista.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      if(b.dataset.usun!==undefined){var n=koszyk[b.dataset.usun].nazwa;koszyk.splice(Number(b.dataset.usun),1);zapiszKoszyk();render();
        ogl.textContent='Usunięto z koszyka: '+n+'.';var f=$('#pozycje .usun')||$('#kontynuuj');if(f)f.focus();return}
      if(b.dataset.d){var p=koszyk[b.dataset.i];p.ilosc=Math.max(1,Math.min(20,p.ilosc+Number(b.dataset.d)));zapiszKoszyk();render();
        ogl.textContent=p.nazwa+', ilość: '+p.ilosc+'.';var nb=lista.querySelector('button[data-i="'+b.dataset.i+'"][data-d="'+b.dataset.d+'"]');if(nb)nb.focus()}
    });
    lista.addEventListener('change',function(e){
      var i=e.target.dataset.i;if(i===undefined)return;
      koszyk[i].ilosc=Math.max(1,Math.min(20,parseInt(e.target.value,10)||1));zapiszKoszyk();render();
      ogl.textContent=koszyk[i].nazwa+', ilość: '+koszyk[i].ilosc+'.';
    });
    $('#kasa-form').addEventListener('submit',function(e){
      e.preventDefault();
      $('#kasa-komunikat').textContent='To wersja demonstracyjna, zamówienie nie zostało złożone i nic nie zapłacono.';
    });
    doc.addEventListener('koszyk-zmiana',render);
    render();
  }

  /* ===== Blog: filtr kategorii ===== */
  var bf=$$('.blog-filtry button');
  if(bf.length){
    bf.forEach(function(b){b.addEventListener('click',function(){
      bf.forEach(function(x){x.setAttribute('aria-pressed',x===b)});
      var kat=b.dataset.kat,n=0;
      $$('.wpisy>li').forEach(function(li){var ok=kat?li.dataset.kat===kat:!li.classList.contains('dubel');li.hidden=!ok;if(ok)n++});
      $('#blog-wynik').textContent='Widoczne wpisy: '+n+'.';
    })});
  }

  /* ===== Cookies (przykład) ===== */
  var ck=$('#cookies');
  if(ck){
    if(!czytaj('sloje-cookies',null))ck.hidden=false;
    $$('[data-cookies]',ck).forEach(function(b){b.addEventListener('click',function(){zapisz('sloje-cookies',b.dataset.cookies);ck.hidden=true})});
    var zc=$('#zarzadzaj-cookies');
    if(zc)zc.addEventListener('click',function(){ck.hidden=false;ck.querySelector('button').focus()});
  }
})();

/* ===== Etap 3: głębia, orbity, konfigurator, strona produktu jako landing ===== */
(function(){
  'use strict';
  var doc=document,body=doc.body;
  var BASE=body.getAttribute('data-base')||'';
  var mq=function(q){return window.matchMedia&&window.matchMedia(q).matches};
  var bezRuchu=mq('(prefers-reduced-motion: reduce)');
  var precyzyjny=mq('(hover: hover) and (pointer: fine)');
  function $(s,c){return (c||doc).querySelector(s)}
  function $$(s,c){return Array.prototype.slice.call((c||doc).querySelectorAll(s))}
  function ogranicz(v,a,b){return Math.max(a,Math.min(b,v))}
  var szeroki=function(){return mq('(min-width: 901px)')};

  /* Parallax warstw sceny (etap 4): kursor przez JS z wygładzaniem, przewijanie przez CSS scroll-driven
     (zamiennik JS z lerp tylko bez animation-timeline). Amplituda kursora = data-glebia w px (maks. 14). */
  var cssPrzewijanie=window.CSS&&CSS.supports&&CSS.supports('animation-timeline: scroll()');
  if(!bezRuchu){
    $$('[data-scena]').forEach(function(sc){
      var kursor=$$('[data-glebia]',sc).map(function(el){return{el:el,g:Math.min(14,Number(el.dataset.glebia)||0),x:0,y:0}});
      var przew=cssPrzewijanie?[]:$$('.par-y',sc).map(function(el){return{el:el,py:parseFloat(getComputedStyle(el).getPropertyValue('--py'))||0,y:0}});
      var cx=0,cy=0,cel=0,ramka=0,rect=null;
      function zmierz(){rect=sc.getBoundingClientRect();rect={left:rect.left,top:rect.top+scrollY,width:rect.width,height:rect.height}}
      function petla(){
        ramka=0;var ruch=false;
        kursor.forEach(function(k){var tx=cx*k.g,ty=cy*k.g*.6;k.x+=(tx-k.x)*.1;k.y+=(ty-k.y)*.1;
          if(Math.abs(tx-k.x)>.05||Math.abs(ty-k.y)>.05)ruch=true;
          k.el.style.transform='translate3d('+k.x.toFixed(2)+'px,'+k.y.toFixed(2)+'px,0)'});
        przew.forEach(function(p){var ty=p.py*cel;p.y+=(ty-p.y)*.1;if(Math.abs(ty-p.y)>.05)ruch=true;
          p.el.style.transform='translate3d(0,'+p.y.toFixed(2)+'px,0)'});
        if(ruch)ramka=requestAnimationFrame(petla);else body.classList.remove('ruch-aktywny');
      }
      function start(){if(!ramka){body.classList.add('ruch-aktywny');ramka=requestAnimationFrame(petla)}}
      zmierz();window.addEventListener('resize',zmierz);
      if(precyzyjny&&kursor.length){
        sc.addEventListener('pointermove',function(e){if(!rect)zmierz();cx=(e.clientX-rect.left)/rect.width-.5;cy=(e.clientY-(rect.top-scrollY))/rect.height-.5;start()});
        sc.addEventListener('pointerleave',function(){cx=0;cy=0;start()});
      }
      if(przew.length)window.addEventListener("scroll",function(){cel=szeroki()?ogranicz(scrollY/innerHeight,0,1):0;start()},{passive:true});
    });
  }

  /* Pauza ruchu (marquee i unoszący się plaster) */
  var pauza=$('#ruch-pauza');
  if(pauza){pauza.addEventListener('click',function(){
    var on=body.classList.toggle('ruch-pauza');pauza.setAttribute('aria-pressed',on);
    $('span',pauza).textContent=on?'Wznów ruch':'Zatrzymaj ruch';
    $('use',pauza).setAttribute('href',on?'#i-odtworz':'#i-pauza');
  })}

  /* Orbitujące karty: przesunięcie zależne od przewinięcia */
  var orb=$('[data-orbita]');
  if(orb&&!bezRuchu){
    var karty=$$('[data-orb]',orb).map(function(k){var v=k.dataset.orb.split(' ').map(Number);return{el:k,dx:v[0],dy:v[1],r:v[2],s:v[3]}});
    var rOrb=0;
    function orbituj(){rOrb=0;
      if(!szeroki()){karty.forEach(function(k){k.el.style.transform=''});return}
      var r=orb.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
      var p=ogranicz(((r.top+r.height/2)-innerHeight/2)/innerHeight,-1,1);
      karty.forEach(function(k){k.el.style.transform='translate('+(k.dx*p).toFixed(1)+'px,'+(k.dy*p).toFixed(1)+'px) rotate('+(k.r*p).toFixed(2)+'deg) scale('+(k.s+(1-k.s)*Math.abs(p)*.5).toFixed(3)+')'});
    }
    window.addEventListener('scroll',function(){if(!rOrb)rOrb=requestAnimationFrame(orbituj)},{passive:true});
    window.addEventListener('resize',orbituj);orbituj();
  }

  /* Konfigurator na stronie głównej */
  var konf=$('#konfigurator');
  if(konf){
    var foto=$('#konf-foto'),cena=$('#konf-cena'),probki=[],dymek=$('#konf-dymek'),dT;
    var stan={tk:'Rdzawy',sz:'220 cm'};
    function zl(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' zł'}
    function alt(){foto.alt='Sofa Lena w tkaninie '+stan.tk.toLowerCase()+'j, szerokość '+stan.sz;foto.alt=foto.alt.replace('rdzawyj','rdzawej').replace('piaskowyj','piaskowej')}
    $$('.konf-chipy button',konf).forEach(function(b){b.addEventListener('click',function(){
      $$('button',b.parentNode).forEach(function(x){x.setAttribute('aria-pressed',x===b)});
      if(b.dataset.konfTk){stan.tk=b.dataset.konfTk;$('#konf-probka-nazwa').textContent=stan.tk;
        var src=BASE+b.dataset.img;if(foto.getAttribute('src')!==src){foto.classList.add('zmiana');setTimeout(function(){foto.src=src;foto.classList.remove('zmiana')},bezRuchu?0:220)}}
      if(b.dataset.konfSz){stan.sz=b.dataset.konfSz;cena.textContent=zl(Number(b.dataset.cena))}
      alt();
    })});
    $('#konf-dodaj').addEventListener('click',function(){
      var nowa=probki.indexOf(stan.tk)<0;if(nowa&&probki.length<6)probki.push(stan.tk);
      $('#konf-status').textContent='Paczka próbek: '+probki.length+' z 6 ('+probki.join(', ').toLowerCase()+'), wysyłka gratis';
      dymek.textContent=nowa?'Dodano próbkę: '+stan.tk:'Ta próbka jest już w paczce';
      dymek.classList.add('widoczny');clearTimeout(dT);dT=setTimeout(function(){dymek.classList.remove('widoczny')},1800);
    });
  }

  /* Adnotacje: przyciski z aria-expanded, linie rysowane do etykiet */
  $$('[data-adn]').forEach(function(sek){
    if(sek.tagName!=='SECTION')return;
    var uklad=$('.adn-uklad',sek),svg=$('.adn-linie',sek);
    $$('.adn-opis',sek).forEach(function(o){o.hidden=true});
    function przelacz(id){
      var opis=doc.getElementById(id),otw=opis.hidden;
      opis.hidden=!otw;
      $$('[aria-controls="'+id+'"]',sek).forEach(function(b){b.setAttribute('aria-expanded',otw)});
      linie();
    }
    $$('[aria-controls]',sek).forEach(function(b){b.addEventListener('click',function(){przelacz(b.getAttribute('aria-controls'))})});
    function linie(){
      if(!szeroki()){svg.innerHTML='';return}
      var u=uklad.getBoundingClientRect(),h='';
      $$('.adn-lista li',sek).forEach(function(li){
        var id=$('.adn-etyk',li).getAttribute('aria-controls'),pk=$('.adn-punkt[aria-controls="'+id+'"]',sek),et=$('.adn-etyk',li);
        if(!pk)return;
        var a=pk.getBoundingClientRect(),b=et.getBoundingClientRect(),lewa=li.parentNode.classList.contains('adn-lewa');
        var x1=a.left+a.width/2-u.left,y1=a.top+a.height/2-u.top,x2=(lewa?b.right:b.left)-u.left,y2=b.top+24-u.top;
        var xm=x2+(lewa?24:-24);
        h+='<path pathLength="1" d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+'L'+xm.toFixed(1)+' '+y2.toFixed(1)+'H'+x2.toFixed(1)+'"/><circle cx="'+x2.toFixed(1)+'" cy="'+y2.toFixed(1)+'" r="3"/>';
      });
      svg.innerHTML=h;
    }
    var img=$('.adn-foto img',sek);if(img&&!img.complete)img.addEventListener('load',linie);
    window.addEventListener('resize',linie);linie();
    if('IntersectionObserver' in window&&!bezRuchu){
      var io=new IntersectionObserver(function(e){if(e[0].isIntersecting){linie();sek.classList.add('widoczne');io.disconnect()}},{threshold:.25});io.observe(sek);
    }else sek.classList.add('widoczne');
  });

  /* Widok rozłożony: warstwy rozsuwają się przy przewijaniu */
  var roz=$('[data-rozklad]');
  var cssWidok=window.CSS&&CSS.supports&&CSS.supports('animation-timeline: view()');
  if(roz&&!bezRuchu&&!cssWidok){
    var ws=$('.warstwy',roz),rR=0,rTop=0,rH=0,pCel=1,pTeraz=1;
    function rozMierz(){var r=roz.getBoundingClientRect();rTop=r.top+scrollY;rH=r.height}
    function rozCel(){if(!szeroki()){ws.style.removeProperty('--p');return}
      var droga=rH-(innerHeight-138);pCel=ogranicz((scrollY+138-rTop)/(droga*.7),0,1);if(!rR)rR=requestAnimationFrame(rozsun)}
    function rozsun(){rR=0;pTeraz+=(pCel-pTeraz)*.12;if(Math.abs(pCel-pTeraz)<.001)pTeraz=pCel;
      ws.style.setProperty('--p',pTeraz.toFixed(4));if(pTeraz!==pCel)rR=requestAnimationFrame(rozsun)}
    window.addEventListener('scroll',rozCel,{passive:true});
    window.addEventListener('resize',function(){rozMierz();rozCel()});rozMierz();pTeraz=-1;rozCel();
  }

  /* Obrót: przeciąganie i suwak */
  $$('[data-obrot]').forEach(function(o){
    var ramka=$('.obrot-ramka',o),zdj=$$('img',ramka),suw=$('input[type="range"]',o),nazwa=$('[data-obrot-nazwa]',o),i=0;
    function pokaz(n){i=(n+zdj.length)%zdj.length;zdj.forEach(function(z,k){z.classList.toggle('aktywne',k===i)});
      suw.value=i;var t=zdj[i].dataset.nazwa;suw.setAttribute('aria-valuetext',t);nazwa.textContent=t}
    suw.addEventListener('input',function(){pokaz(Number(suw.value))});
    var x0=null,krok=70;
    ramka.addEventListener('pointerdown',function(e){x0=e.clientX;if(ramka.setPointerCapture)ramka.setPointerCapture(e.pointerId)});
    ramka.addEventListener('pointermove',function(e){if(x0===null)return;var d=e.clientX-x0;if(Math.abs(d)>=krok){pokaz(i+(d<0?1:-1));x0=e.clientX}});
    ['pointerup','pointercancel','pointerleave'].forEach(function(t){ramka.addEventListener(t,function(){x0=null})});
  });

  /* Lupa: soczewka przy kursorze, przycisk powiększenia dla dotyku i klawiatury */
  $$('[data-lupa]').forEach(function(l){
    var okno=$('.lupa-okno',l),img=$('img',okno),sz=$('.lupa-szklo',okno),btn=$('[data-lupa-przycisk]',l),Z=2.6;
    if(precyzyjny){
      okno.addEventListener('pointermove',function(e){
        if(okno.classList.contains('powiekszone'))return;
        var r=okno.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
        okno.classList.add('aktywna');
        sz.style.left=x+'px';sz.style.top=y+'px';
        sz.style.backgroundImage='url("'+(img.currentSrc||img.src)+'")';
        sz.style.backgroundSize=(r.width*Z)+'px '+(r.height*Z)+'px';
        sz.style.backgroundPosition=(-(x*Z-95))+'px '+(-(y*Z-95))+'px';
      });
      okno.addEventListener('pointerleave',function(){okno.classList.remove('aktywna')});
    }else{var pm=$('.lupa-pomoc',l);if(pm)pm.textContent='Użyj przycisku, aby powiększyć zdjęcie i przesuwać je palcem.'}
    btn.addEventListener('click',function(){
      var on=okno.classList.toggle('powiekszone');okno.classList.remove('aktywna');
      btn.setAttribute('aria-pressed',on);btn.lastChild.textContent=on?'Pomniejsz detal':'Powiększ detal';
      if(on){okno.scrollLeft=(okno.scrollWidth-okno.clientWidth)/2;okno.scrollTop=(okno.scrollHeight-okno.clientHeight)/2;okno.focus()}
    });
  });

  /* Karty kategorii: lekki tilt 3D */
  if(precyzyjny&&!bezRuchu){
    $$('.produkt[data-tilt]').forEach(function(k){
      k.addEventListener('pointermove',function(e){var r=k.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        k.style.transform='perspective(900px) rotateX('+(-y*7).toFixed(2)+'deg) rotateY('+(x*9).toFixed(2)+'deg)'});
      k.addEventListener('pointerleave',function(){k.style.transform=''});
    });
  }

  /* ===== Etap 4: galeria strony produktu, warianty, powiększenie ===== */
  $$('[data-galeria]').forEach(function(g){
    var slajdy=$$('.gs',g),mini=$$('.gal-mini li',g),lista=$('.gal-slajdy',g),nr=$('[data-gal-nr]',g),ile=$('[data-gal-ile]',g);
    var akt=0,wariant=(slajdy[0]&&slajdy[0].dataset.w)||'*';
    function widoczne(){return slajdy.map(function(s,i){return i}).filter(function(i){return !slajdy[i].hidden})}
    function pokaz(i){
      var w=widoczne();if(!w.length)return;if(w.indexOf(i)<0)i=w[0];akt=i;
      slajdy.forEach(function(s,k){s.classList.toggle('aktywny',k===i)});
      mini.forEach(function(m,k){var b=$('button',m);if(k===i)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});
      nr.textContent=w.indexOf(i)+1;ile.textContent=w.length;
      var b=$('button',mini[i]);if(b&&b.scrollIntoView&&mini[i].parentNode.scrollHeight>mini[i].parentNode.clientHeight+4){var ul=mini[i].parentNode,o=mini[i].offsetTop-ul.offsetTop;if(o<ul.scrollTop||o>ul.scrollTop+ul.clientHeight-70)ul.scrollTop=o-10}
    }
    function krok(d){var w=widoczne(),p=w.indexOf(akt);pokaz(w[(p+d+w.length)%w.length])}
    function ustawWariant(k){
      wariant=k;var maW=slajdy.some(function(s){return s.dataset.w===k});if(!maW)return;
      slajdy.forEach(function(s,i){var ok=s.dataset.w==='*'||s.dataset.w===k;s.hidden=!ok;mini[i].hidden=!ok});
      pokaz(widoczne()[0]);
    }
    mini.forEach(function(m,i){$('button',m).addEventListener('click',function(){pokaz(i)})});
    $('.gal-wstecz',g).addEventListener('click',function(){krok(-1)});
    $('.gal-dalej',g).addEventListener('click',function(){krok(1)});
    lista.addEventListener('keydown',function(e){
      if(e.key==='ArrowRight'){e.preventDefault();krok(1)}else if(e.key==='ArrowLeft'){e.preventDefault();krok(-1)}
      else if(e.key==='Enter'||e.key===' '){e.preventDefault();otworz()}});
    var x0=null,y0=0,przes=false;
    lista.addEventListener('pointerdown',function(e){x0=e.clientX;y0=e.clientY;przes=false});
    lista.addEventListener('pointermove',function(e){if(x0!==null&&Math.abs(e.clientX-x0)>8)przes=true});
    lista.addEventListener('pointerup',function(e){if(x0===null)return;var dx=e.clientX-x0,dy=e.clientY-y0;x0=null;
      if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy))krok(dx<0?1:-1);else if(!przes)otworz()});
    lista.addEventListener('pointercancel',function(){x0=null});
    doc.addEventListener('galeria-wariant',function(e){if(e.detail!==wariant)ustawWariant(e.detail)});

    /* Lightbox: natywny <dialog> (Esc zamyka, fokus zostaje w środku) */
    var lb=$('#lb'),okno=lb&&$('.lb-okno',lb),zoom=lb&&$('.lb-zoom',lb),licz=lb&&$('.lb-licznik',lb),powrot=null;
    function wypelnij(){
      var s=slajdy[akt],kl=s.cloneNode(true);kl.classList.add('aktywny');kl.removeAttribute('hidden');
      $$('img',kl).forEach(function(im){im.setAttribute('sizes','100vw');im.removeAttribute('loading')});
      okno.innerHTML='';okno.appendChild(kl);
      var w=widoczne(),obraz=/gs-(pack|zbl|ctx|wyc)/.test(s.className);
      licz.textContent='Zdjęcie '+(w.indexOf(akt)+1)+' z '+w.length;
      zoom.hidden=!obraz;lb.classList.remove('zoom');zoom.setAttribute('aria-pressed','false');$('span',zoom).textContent='Powiększ';
    }
    function otworz(){if(!lb||!lb.showModal)return;powrot=doc.activeElement;wypelnij();lb.showModal();$('.lb-zamknij',lb).focus()}
    if(lb&&lb.showModal){
      $('.gal-powieksz',g).addEventListener('click',otworz);
      $('.lb-zamknij',lb).addEventListener('click',function(){lb.close()});
      lb.addEventListener('close',function(){okno.innerHTML='';if(powrot&&powrot.focus)powrot.focus()});
      $('.lb-wstecz',lb).addEventListener('click',function(){krok(-1);wypelnij()});
      $('.lb-dalej',lb).addEventListener('click',function(){krok(1);wypelnij()});
      lb.addEventListener('keydown',function(e){if(e.key==='ArrowRight'&&!lb.classList.contains('zoom')){krok(1);wypelnij()}else if(e.key==='ArrowLeft'&&!lb.classList.contains('zoom')){krok(-1);wypelnij()}});
      function przelaczZoom(ex,ey){var on=lb.classList.toggle('zoom');zoom.setAttribute('aria-pressed',on);$('span',zoom).textContent=on?'Pomniejsz':'Powiększ';
        if(on){var im=$('img',okno);var ustaw=function(){okno.scrollLeft=(okno.scrollWidth-okno.clientWidth)*(ex==null?.5:ex);okno.scrollTop=(okno.scrollHeight-okno.clientHeight)*(ey==null?.5:ey)};if(im&&!im.complete)im.addEventListener('load',ustaw,{once:true});ustaw();okno.focus()}}
      zoom.addEventListener('click',function(){przelaczZoom()});
      okno.addEventListener('click',function(e){if(zoom.hidden)return;var im=$('img',okno);if(!im)return;var r=im.getBoundingClientRect();
        przelaczZoom(ogranicz((e.clientX-r.left)/r.width,0,1),ogranicz((e.clientY-r.top)/r.height,0,1))});
    }else{var pw=$('.gal-powieksz',g);if(pw)pw.hidden=true}
    pokaz(0);
  });
})();
