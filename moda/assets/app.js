/* OSNOWA, wspolny skrypt serwisu demo (etap 2 do 4). Bez bibliotek. */
(function(){
  'use strict';
  var BASE=document.body.getAttribute('data-base')||'';
  var CAT=window.OSNOWA_KATALOG||{};
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FREE=299, SHIP={kurier:14.99,paczkomat:12.99,odbior:0};

  // Pamiec przegladarki: zawsze w try/catch (tryb prywatny, blokada danych)
  var store={
    get:function(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}},
    set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  };
  function zl(n){return n.toFixed(2).replace('.',',').replace(',00','')+' zł'}
  function plural(n){if(n===1)return 'produkt';var d=n%10,h=n%100;return (d>=2&&d<=4&&(h<12||h>14))?'produkty':'produktów'}
  function esc(v){return String(v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
  function $(s,c){return (c||document).querySelector(s)}
  function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}

  // Naglowek
  var header=$('.header');
  if(header){var onScroll=function(){header.classList.toggle('scrolled',window.scrollY>8)};window.addEventListener('scroll',onScroll,{passive:true});onScroll()}

  // Menu mobilne
  var menuBtn=$('#menuBtn'),nav=$('#mobileNav'),closeBtn=$('#menuClose');
  if(menuBtn&&nav&&closeBtn){
    var setMenu=function(open){
      nav.classList.toggle('open',open);
      menuBtn.setAttribute('aria-expanded',open?'true':'false');
      document.body.style.overflow=open?'hidden':'';
      if(open){closeBtn.focus()}else{menuBtn.focus()}
    };
    menuBtn.addEventListener('click',function(){setMenu(true)});
    closeBtn.addEventListener('click',function(){setMenu(false)});
    $$('a',nav).forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');document.body.style.overflow=''})});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open'))setMenu(false)});
  }

  // Komunikat (toast)
  var toast=$('#toast'),toastText=$('#toastText'),tTimer;
  function showToast(msg){
    if(!toast)return;
    toastText.textContent=msg;toast.classList.add('show');
    clearTimeout(tTimer);tTimer=setTimeout(function(){toast.classList.remove('show')},3600);
  }

  // Koszyk
  function getCart(){var c=store.get('osnowa-cart',[]);return Array.isArray(c)?c.filter(function(i){return i&&CAT[i.id]}).map(function(i){return {id:i.id,size:String(i.size),color:String(i.color),qty:Math.max(1,Math.min(9,parseInt(i.qty,10)||1))}}):[]}
  function setCart(c){store.set('osnowa-cart',c);renderCount(true)}
  function cartQty(){return getCart().reduce(function(s,i){return s+i.qty},0)}
  var countEl=$('#cartCount'),cartBtn=$('#cartBtn');
  function renderCount(bump){
    var n=cartQty();
    if(countEl){countEl.textContent=n;if(bump&&!reduce){countEl.classList.remove('bump');void countEl.offsetWidth;countEl.classList.add('bump')}}
    if(cartBtn)cartBtn.setAttribute('aria-label','Koszyk, '+n+' '+plural(n));
  }
  renderCount(false);
  function addToCart(id,size,color,qty){
    var c=getCart(),found=null;
    c.forEach(function(i){if(i.id===id&&i.size===size&&i.color===color)found=i});
    if(found){found.qty=Math.min(9,found.qty+qty)}else{c.push({id:id,size:size,color:color,qty:qty})}
    setCart(c);
  }
  // Mikrointerakcja: zdjecie leci do ikony koszyka, potem licznik podskakuje
  function fly(img,done){
    if(reduce||!img||!cartBtn||!img.getBoundingClientRect){done();return}
    var a=img.getBoundingClientRect(),b=cartBtn.getBoundingClientRect();
    if(!a.width||b.width===0){done();return}
    var f=document.createElement('img');f.src=img.currentSrc||img.src;f.alt='';f.className='fly';
    f.style.left=a.left+'px';f.style.top=a.top+'px';f.style.width=a.width+'px';f.style.height=a.height+'px';
    document.body.appendChild(f);
    var dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2),s=Math.max(.08,28/a.width);
    requestAnimationFrame(function(){requestAnimationFrame(function(){f.style.transform='translate('+dx+'px,'+dy+'px) scale('+s+')';f.style.opacity='.35'})});
    var fin=false;function end(){if(fin)return;fin=true;f.remove();done()}
    f.addEventListener('transitionend',end);setTimeout(end,900);
  }
  function added(name,size,color){
    showToast('Dodano do koszyka: '+name+', rozmiar '+size+(color?', '+color:''));
  }

  // Karty produktow (siatki): rozmiar wymagany, komunikat jak w etapie 1
  $$('.card .add').forEach(function(btn){
    btn.addEventListener('click',function(){
      var card=btn.closest('.card'),checked=card.querySelector('input[type=radio]:checked'),err=card.querySelector('.size-err');
      if(!checked){
        err.textContent='Wybierz rozmiar, żeby dodać do koszyka.';
        var first=card.querySelector('input[type=radio]:not(:disabled)');if(first)first.focus();
        return;
      }
      err.textContent='';
      var id=card.getAttribute('data-id'),p=CAT[id];if(!p)return;
      var color=p.colors[0];
      fly(card.querySelector('.ph img'),function(){addToCart(id,checked.value,color,1);added(p.name,checked.value,color)});
    });
  });
  $$('.card input[type=radio]').forEach(function(r){
    r.addEventListener('change',function(){var e=r.closest('.card').querySelector('.size-err');if(e)e.textContent=''});
  });

  // Ulubione: zapamietane w przegladarce, serduszko z animacja
  var favs=store.get('osnowa-fav',[]);if(!Array.isArray(favs))favs=[];
  function syncFav(){
    $$('.fav[data-id]').forEach(function(b){
      var on=favs.indexOf(b.getAttribute('data-id'))>-1;b.setAttribute('aria-pressed',on?'true':'false');
    });
  }
  syncFav();
  $$('.fav[data-id]').forEach(function(b){
    b.addEventListener('click',function(){
      var id=b.getAttribute('data-id'),i=favs.indexOf(id),on=i<0;
      if(on){favs.push(id)}else{favs.splice(i,1)}
      store.set('osnowa-fav',favs);syncFav();
      if(on&&!reduce){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}
      var p=CAT[id];
      showToast(on?((p?p.name:'Produkt')+' w ulubionych. Znajdziesz je na stronie koszyka.'):'Usunięto z ulubionych.');
      if(document.getElementById('favList'))renderFavs();
    });
  });

  // Tabela wymiarow (dialog z etapu 1)
  var dlg=$('#sizes');
  if(dlg){
    // Tabela konkretnego produktu: z karty (data-pid) albo ze strony produktu
    var pdpBox=$('[data-pdp]'),fillSizes=function(pid){
      var p=CAT[pid];if(!p||!p.table)return;var t=p.table,tb=$('#sizesTable');if(!tb)return;
      var h='<caption class="sr-only">Wymiary w centymetrach: '+esc(p.name)+'</caption><thead><tr><th scope="col">Rozmiar</th>'+t.cols.map(function(c){return '<th scope="col">'+esc(c)+'</th>'}).join('')+'</tr></thead><tbody>'+
        t.rows.map(function(r){return '<tr><th scope="row">'+esc(r[0])+'</th>'+r.slice(1).map(function(v){return '<td>'+String(v).replace('.',',')+'</td>'}).join('')+'</tr>'}).join('')+'</tbody>';
      tb.innerHTML=h;var nm=$('#sizesName');if(nm)nm.textContent=': '+p.name;var ft=$('#sizesFoot');if(ft)ft.textContent=t.note;
    };
    $$('[data-open-sizes]').forEach(function(b){
      b.addEventListener('click',function(e){
        var pid=b.getAttribute('data-pid')||(pdpBox?pdpBox.getAttribute('data-pdp'):null);if(pid)fillSizes(pid);
        if(typeof dlg.showModal==='function'){e.preventDefault();dlg.showModal()}
      });
    });
    var sc=$('#sizesClose');if(sc)sc.addEventListener('click',function(){dlg.close()});
    dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
  }

  // Formularze demo: walidacja i komunikat, nic nie jest wysylane
  $$('form[data-demo]').forEach(function(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var msg=form.querySelector('.form-msg'),bad=null;
      $$('[required]',form).forEach(function(f){
        if(bad)return;
        if(f.type==='checkbox'?!f.checked:(!f.value.trim()||!f.checkValidity()))bad=f;
      });
      if(bad){
        var lbl=bad.getAttribute('data-err')||'Uzupełnij wymagane pole.';
        msg.textContent=lbl;bad.focus();return;
      }
      msg.textContent='To wersja demonstracyjna, formularz niczego nie wysyła.';
    });
  });

  // Filtrowanie i sortowanie kategorii
  var filt=$('#filters');
  if(filt){
    var grid=$('#grid'),cards=$$('.card',grid),info=$('#resultInfo'),empty=$('#empty'),sortSel=$('#sort'),det=$('#filtersDetails');
    if(det&&window.matchMedia('(max-width: 900px)').matches)det.removeAttribute('open');
    // Parametry z adresu, np. kobiety.html?material=len
    try{
      var qs=new URLSearchParams(location.search);
      ['rozmiar','kolor','material'].forEach(function(k){
        var v=qs.get(k);if(!v)return;
        $$('input[name="'+k+'"]',filt).forEach(function(i){if(i.value===v){i.checked=true;if(det)det.setAttribute('open','')}});
      });
    }catch(e){}
    var apply=function(){
      var sel={};
      ['rozmiar','kolor','material'].forEach(function(k){sel[k]=$$('input[name="'+k+'"]:checked',filt).map(function(i){return i.value})});
      var shown=0;
      cards.forEach(function(c){
        var ok=['rozmiar','kolor','material'].every(function(k){
          if(!sel[k].length)return true;
          var vals=(c.getAttribute('data-'+k)||'').split(' ');
          return sel[k].some(function(v){return vals.indexOf(v)>-1});
        });
        c.hidden=!ok;if(ok)shown++;
      });
      var s=sortSel?sortSel.value:'polecane';
      var sorted=cards.slice().sort(function(a,b){
        if(s==='cena-rosnaco')return +a.dataset.price-b.dataset.price;
        if(s==='cena-malejaco')return +b.dataset.price-a.dataset.price;
        if(s==='ocena')return +b.dataset.rating-a.dataset.rating;
        return +a.dataset.order-b.dataset.order;
      });
      sorted.forEach(function(c){grid.appendChild(c)});
      info.textContent='Pokazujemy '+shown+' z '+cards.length+' '+plural(cards.length);
      empty.hidden=shown>0;
    };
    filt.addEventListener('change',apply);
    if(sortSel)sortSel.addEventListener('change',apply);
    $$('[data-clear]').forEach(function(b){b.addEventListener('click',function(){$$('input',filt).forEach(function(i){i.checked=false});apply();var f=$('input',filt);if(f)f.focus()})});
    apply();
  }

  // Karta produktu (etap 4): galeria, kolor przelacza zdjecia wariantu, zakup
  var pdp=$('[data-pdp]');
  if(pdp){
    var pid=pdp.getAttribute('data-pdp'),prod=CAT[pid];
    var track=$('#gTrack'),slides=$$('.g-slide',track),thumbs=$$('.g-thumbs li'),gCount=$('#gCount'),gPrev=$('#gPrev'),gNext=$('#gNext'),cur=0;
    var visible=function(){return slides.filter(function(s){return !s.hidden})};
    var mark=function(){
      var vis=visible(),i=vis.indexOf(slides[cur]);
      if(gCount)gCount.textContent=(i+1)+' / '+vis.length;
      thumbs.forEach(function(t,k){var b=$('button',t);if(b)b.setAttribute('aria-current',k===cur?'true':'false')});
      if(gPrev)gPrev.disabled=i<=0;if(gNext)gNext.disabled=i>=vis.length-1;
    };
    var go=function(k,instant){
      if(!slides[k]||slides[k].hidden)return;cur=k;
      track.scrollTo({left:slides[k].offsetLeft,behavior:(instant||reduce)?'auto':'smooth'});mark();
    };
    var step=function(d){var vis=visible(),i=vis.indexOf(slides[cur])+d;if(i>=0&&i<vis.length)go(slides.indexOf(vis[i]))};
    if(track){
      var st=null;
      track.addEventListener('scroll',function(){clearTimeout(st);st=setTimeout(function(){
        var x=track.scrollLeft,best=cur,bd=1e9;slides.forEach(function(s,k){if(s.hidden)return;var d=Math.abs(s.offsetLeft-x);if(d<bd){bd=d;best=k}});
        if(best!==cur){cur=best;mark()}
      },80)},{passive:true});
      track.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();step(1)}else if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}});
      if(gPrev)gPrev.addEventListener('click',function(){step(-1)});
      if(gNext)gNext.addEventListener('click',function(){step(1)});
      $$('[data-go]').forEach(function(b){b.addEventListener('click',function(){go(+b.getAttribute('data-go'))})});
      mark();
    }
    // Powiekszenie: okno dialogowe, klik w zdjecie pokazuje pelna rozdzielczosc, Esc zamyka
    var lb=$('#lb'),lbImg=$('#lbImg'),lbStage=$('#lbStage'),lbCap=$('#lbCap'),lbI=0;
    var lbShow=function(k){
      var s=slides[k];if(!s)return;lbI=k;var im=$('img',s);
      lbStage.classList.remove('zoomed');lbImg.src=im.getAttribute('data-full');lbImg.alt=im.alt;
      var vis=visible();lbCap.textContent=(vis.indexOf(s)+1)+' / '+vis.length+': '+im.alt;
    };
    var lbStep=function(d){var vis=visible(),i=vis.indexOf(slides[lbI])+d;if(i<0||i>=vis.length)return;var k=slides.indexOf(vis[i]);lbShow(k);go(k,true)};
    if(lb&&typeof lb.showModal==='function'){
      $$('[data-zoom]').forEach(function(b){b.addEventListener('click',function(){lbShow(+b.getAttribute('data-zoom'));lb.showModal()})});
      $('#lbClose').addEventListener('click',function(){lb.close()});
      $('#lbPrev').addEventListener('click',function(){lbStep(-1)});
      $('#lbNext').addEventListener('click',function(){lbStep(1)});
      lb.addEventListener('keydown',function(e){if(e.key==='ArrowRight')lbStep(1);else if(e.key==='ArrowLeft')lbStep(-1)});
      lbStage.addEventListener('click',function(e){
        var on=!lbStage.classList.contains('zoomed');
        var r=lbImg.getBoundingClientRect(),fx=(e.clientX-r.left)/r.width,fy=(e.clientY-r.top)/r.height;
        lbStage.classList.toggle('zoomed',on);
        if(on){lbStage.scrollLeft=Math.max(0,lbImg.offsetWidth*fx-lbStage.clientWidth/2);lbStage.scrollTop=Math.max(0,lbImg.offsetHeight*fy-lbStage.clientHeight/2)}
      });
      lb.addEventListener('close',function(){var b=$('[data-zoom="'+lbI+'"]');if(b)b.focus({preventScroll:true})});
    }
    // Kolor: galeria pokazuje zdjecia wybranego wariantu i zdjecia wspolne
    var colorName=$('#colorName');
    $$('input[name="kolor"]',pdp).forEach(function(r){r.addEventListener('change',function(){
      colorName.textContent=r.value;var c=r.getAttribute('data-color');
      slides.forEach(function(s,k){var sc=s.getAttribute('data-color'),hide=!!sc&&sc!==c;s.hidden=hide;if(thumbs[k])thumbs[k].hidden=hide});
      var first=slides.filter(function(s){return !s.hidden})[0];if(first)go(slides.indexOf(first),true);
    })});
    // Ilosc
    var qIn=$('#qty');
    $$('[data-q]',pdp).forEach(function(b){b.addEventListener('click',function(){var v=Math.max(1,Math.min(9,(+qIn.value||1)+(+b.getAttribute('data-q'))));qIn.value=v})});
    var perr=$('#pdpErr');
    $$('input[name="rozmiar"]',pdp).forEach(function(r){r.addEventListener('change',function(){perr.textContent='';var sb=$('#stickySize');if(sb)sb.textContent='rozmiar '+r.value})});
    var buy=function(){
      var size=$('input[name="rozmiar"]:checked',pdp),color=$('input[name="kolor"]:checked',pdp);
      if(!size){
        perr.textContent='Wybierz rozmiar, żeby dodać do koszyka.';
        var first=$('input[name="rozmiar"]:not(:disabled)',pdp);
        if(first){first.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'});first.focus({preventScroll:true})}
        return;
      }
      var q=Math.max(1,Math.min(9,+qIn.value||1));
      fly($('img',slides[cur]),function(){addToCart(pid,size.value,color?color.value:prod.colors[0],q);added(prod.name+(q>1?' ('+q+' szt.)':''),size.value,color?color.value:'')});
    };
    $('#addMain').addEventListener('click',buy);
    var sticky=$('#stickyBuy');
    if(sticky){
      $('#addSticky').addEventListener('click',buy);
      if('IntersectionObserver' in window){
        var so=new IntersectionObserver(function(en){
          var vis=en[0].isIntersecting;
          sticky.classList.toggle('show',!vis);document.body.classList.toggle('has-sticky',!vis);
          sticky.setAttribute('aria-hidden',vis?'true':'false');
          $$('button',sticky).forEach(function(b){b.tabIndex=vis?-1:0});
        });
        so.observe($('#addMain'));
      }
    }
  }

  // Ruch przy przewijaniu: CSS scroll-driven animations. Zamiennik dla przegladarek bez nich:
  // rAF z wygladzaniem (lerp), wartosci liczone przy resize, tylko transform.
  var sda=window.CSS&&CSS.supports&&CSS.supports('animation-timeline: scroll()');
  if(!sda&&!reduce){
    var movers=[];
    var hw=$('.h3-word span');
    if(hw)movers.push({el:hw,cur:0,target:function(y){return Math.min(700,y)/700*56},tf:function(v){return 'translate3d(0,'+v.toFixed(2)+'px,0)'}});
    var orbEl=$('.orbit');
    if(orbEl&&window.matchMedia('(min-width: 901px)').matches){
      var oTop=0,oH=1,vh=window.innerHeight;
      var oMeasure=function(){var r=orbEl.getBoundingClientRect();oTop=r.top+window.scrollY;oH=r.height;vh=window.innerHeight};
      oMeasure();window.addEventListener('resize',oMeasure);
      $$('.oc',orbEl).forEach(function(c){
        var cs=getComputedStyle(c),v=+cs.getPropertyValue('--v')||1,r=cs.getPropertyValue('--r').trim()||'0deg',sc=cs.getPropertyValue('--s').trim()||'1';
        movers.push({el:c,cur:0,target:function(y){var p=Math.min(1,Math.max(0,(y+vh-oTop)/(vh+oH)));return p},tf:function(p){var k=1-2*p;return 'translate3d('+(-14*v*k).toFixed(2)+'px,'+(50*v*k).toFixed(2)+'px,0) rotate('+r+') scale('+sc+')'}});
      });
    }
    if(movers.length){
      var running=false;
      var tick=function(){
        var y=window.scrollY,again=false;
        movers.forEach(function(m){var t=m.target(y),d=t-m.cur;if(Math.abs(d)>.001){m.cur+=d*.1;again=true}m.el.style.transform=m.tf(m.cur)});
        running=again;if(again)requestAnimationFrame(tick);
      };
      var kick=function(){if(!running){running=true;requestAnimationFrame(tick)}};
      window.addEventListener('scroll',kick,{passive:true});kick();
    }
  }

  // Pasek korzysci: pauza (WCAG 2.2.2)
  var mq=$('.mq'),mqBtn=$('#mqBtn');
  if(mq&&mqBtn&&!reduce){
    mqBtn.hidden=false;
    mqBtn.addEventListener('click',function(){var on=!mq.classList.contains('paused');mq.classList.toggle('paused',on);mqBtn.setAttribute('aria-pressed',on?'true':'false');$('.sr-only',mqBtn).textContent=on?'Wznów przewijanie korzyści':'Zatrzymaj przewijanie korzyści'});
  }

  // Dobor rozmiaru na stronie glownej (makieta z nachodzacymi panelami)
  var fitForm=$('#fitForm');
  if(fitForm){
    var tables={};try{tables=JSON.parse($('.mock-stage').getAttribute('data-tables'))}catch(e){}
    var fW=$('#fitW'),fSize=$('#fitSize'),fTxt=$('#fitTxt'),fBar=$('#fitBar'),fAct=$('#fitActTxt'),fBub=$('#fitBubble'),best=null,lastKey='';
    var NAMES={warta:['Sukienka Warta','w biuście'],prosna:['Marynarka Prosna','w klatce']};
    var calc=function(){
      var pidF=$('input[name="fitp"]:checked',fitForm).value,w=Math.max(35,Math.min(70,parseInt(fW.value,10)||45)),girth=w*2,rows=tables[pidF]||[];
      best=null;rows.forEach(function(r){var d=Math.abs(r[1]-girth);if(!best||d<best.d)best={s:r[0],v:r[1],d:d,id:pidF}});
      if(!best)return;
      fSize.textContent=best.s;
      fTxt.textContent='Twoja rzecz: '+girth+' cm. '+NAMES[pidF][0]+' '+best.s+': '+best.v+' cm '+NAMES[pidF][1]+'. Różnica '+best.d+' cm.';
      fBar.style.transform='scaleX('+Math.max(.15,1-best.d/12).toFixed(2)+')';
      var p=CAT[pidF];fAct.textContent=NAMES[pidF][0]+', rozmiar '+best.s+', '+(p?zl(p.price):'');
      var key=pidF+best.s;if(key!==lastKey&&lastKey&&!reduce){fBub.classList.remove('pop');void fBub.offsetWidth;fBub.classList.add('pop')}lastKey=key;
    };
    fitForm.addEventListener('input',calc);fitForm.addEventListener('change',calc);
    $$('[data-fit]',fitForm).forEach(function(b){b.addEventListener('click',function(){fW.value=Math.max(35,Math.min(70,(parseInt(fW.value,10)||45)+(+b.getAttribute('data-fit'))));calc()})});
    $('#fitAdd').addEventListener('click',function(){if(!best)return;var p=CAT[best.id];addToCart(best.id,best.s,p.colors[0],1);added(p.name,best.s,p.colors[0])});
    calc();
  }

  // Strona koszyka
  var list=$('#cartList');
  function renderFavs(){
    var box=$('#favList'),wrap=$('#favWrap');if(!box)return;
    var items=favs.filter(function(id){return CAT[id]});
    wrap.hidden=!items.length;box.innerHTML='';var fe=$('#favEmpty');if(fe)fe.hidden=!!items.length;
    items.forEach(function(id){
      var p=CAT[id],li=document.createElement('li');li.className='ci';
      li.innerHTML='<a class="ph" href="'+(p.url?BASE+p.url:'#')+'" tabindex="-1" aria-label="'+p.name+'"><img src="'+BASE+p.img+'" alt="" loading="lazy"></a>'+
        '<div><h2>'+(p.url?'<a href="'+BASE+p.url+'">'+p.name+'</a>':p.name)+'</h2><p class="meta">'+p.mat+'</p><p class="meta">'+zl(p.price)+'</p></div>';
      box.appendChild(li);
    });
  }
  if(list){
    var sumEl=$('#sumBox'),emptyEl=$('#cartEmpty'),gridEl=$('#cartGrid');
    var methodVal=function(){var m=$('input[name="dostawa"]:checked');return m?m.value:'kurier'};
    var renderCart=function(focusSel){
      var c=getCart();list.innerHTML='';
      gridEl.hidden=!c.length;emptyEl.hidden=!!c.length;
      var sub=0;
      c.forEach(function(it,idx){
        var p=CAT[it.id],line=p.price*it.qty;sub+=line;
        var li=document.createElement('li');li.className='ci';
        var href=p.url?BASE+p.url:null;
        var im=(p.imgs&&p.imgs[it.color])||p.img;
        li.innerHTML=(href?'<a class="ph" href="'+href+'" tabindex="-1" aria-label="'+p.name+'">':'<div class="ph">')+'<img src="'+BASE+im+'" alt="" loading="lazy">'+(href?'</a>':'</div>')+
          '<div><h2>'+(href?'<a href="'+href+'">'+p.name+'</a>':p.name)+'</h2>'+
          '<p class="meta">Rozmiar '+esc(it.size)+', kolor: '+esc(it.color)+'. '+zl(p.price)+' za sztukę</p>'+
          '<div class="ctrl"><div class="qty" role="group" aria-label="Ilość: '+p.name+'"><button type="button" data-dec="'+idx+'" aria-label="Zmniejsz ilość">−</button><input type="number" min="1" max="9" value="'+it.qty+'" data-qty="'+idx+'" aria-label="Ilość, '+p.name+' rozmiar '+esc(it.size)+'"><button type="button" data-inc="'+idx+'" aria-label="Zwiększ ilość">+</button></div>'+
          '<button type="button" class="remove" data-rm="'+idx+'">Usuń<span class="sr-only"> '+p.name+', rozmiar '+it.size+'</span></button></div></div>'+
          '<p class="line">'+zl(line)+'</p>';
        list.appendChild(li);
      });
      var free=sub>=FREE,ship=free?0:SHIP[methodVal()];
      if(methodVal()==='odbior')ship=0;
      var ps=$('#shipBox');
      ps.classList.toggle('done',free);
      $('#shipText').textContent=free?'Masz darmową dostawę.':'Brakuje '+zl(FREE-sub)+' do darmowej dostawy.';
      $('#shipBar').style.transform='scaleX('+Math.min(1,sub/FREE)+')';
      $('#sub').textContent=zl(sub);$('#shipCost').textContent=ship?zl(ship):'0 zł';$('#total').textContent=zl(sub+ship);
      $$('[data-ship-price]').forEach(function(s){var k=s.getAttribute('data-ship-price');s.textContent=free||k==='odbior'?'0 zł':zl(SHIP[k])});
      if(focusSel){var f=$(focusSel);if(f)f.focus()}
    };
    list.addEventListener('click',function(e){
      var t=e.target.closest('button');if(!t)return;var c=getCart(),i;
      if(t.hasAttribute('data-rm')){i=+t.getAttribute('data-rm');var nm=CAT[c[i].id].name;c.splice(i,1);setCart(c);renderCart(c.length?'#cartList .remove':'#cartEmpty a');showToast('Usunięto z koszyka: '+nm);return}
      if(t.hasAttribute('data-inc')){i=+t.getAttribute('data-inc');c[i].qty=Math.min(9,c[i].qty+1);setCart(c);renderCart('[data-inc="'+i+'"]')}
      if(t.hasAttribute('data-dec')){i=+t.getAttribute('data-dec');c[i].qty=Math.max(1,c[i].qty-1);setCart(c);renderCart('[data-dec="'+i+'"]')}
    });
    list.addEventListener('change',function(e){
      var t=e.target;if(!t.hasAttribute('data-qty'))return;var c=getCart(),i=+t.getAttribute('data-qty');
      c[i].qty=Math.max(1,Math.min(9,parseInt(t.value,10)||1));setCart(c);renderCart();
    });
    $$('input[name="dostawa"]').forEach(function(r){r.addEventListener('change',function(){renderCart()})});
    $('#checkout').addEventListener('click',function(){
      var t=$('#terms'),m=$('#checkoutMsg');
      if(!t.checked){m.textContent='Zaznacz akceptację regulaminu, żeby przejść dalej.';t.focus();return}
      m.textContent='To wersja demonstracyjna sklepu. Kasa i płatność nie działają, nic nie zostało zamówione.';
    });
    renderCart();renderFavs();
  }

  // Blog: kategorie
  var tabs=$$('.tabs button');
  if(tabs.length){
    tabs.forEach(function(b){
      b.addEventListener('click',function(){
        tabs.forEach(function(x){x.setAttribute('aria-pressed','false')});b.setAttribute('aria-pressed','true');
        var k=b.getAttribute('data-cat'),n=0;
        $$('.posts li').forEach(function(li){var ok=k==='wszystkie'||li.getAttribute('data-cat')===k;li.hidden=!ok;if(ok)n++});
        var st=$('#postsInfo');if(st)st.textContent='Wpisy: '+n;
      });
    });
  }

  // Ciasteczka: baner informacyjny (przyklad), rowna waga przyciskow
  var ck=$('#cookie');
  if(ck){
    var choice=store.get('osnowa-cookie',null);
    if(!choice)ck.hidden=false;
    $$('[data-cookie]',ck).forEach(function(b){b.addEventListener('click',function(){store.set('osnowa-cookie',b.getAttribute('data-cookie'));ck.hidden=true;showToast('Zapisaliśmy Twój wybór (przykład, demo nie używa ciasteczek).')})});
    $$('[data-cookie-open]').forEach(function(b){b.addEventListener('click',function(){ck.hidden=false;var f=$('button',ck);if(f)f.focus()})});
  }

  // Wejscia sekcji, rysowanie ikon, liczniki: raz przy wejsciu w widok
  var els=$$('.reveal,.stagger,.draw,.draw-lines,.an-list');
  function count(el){
    var to=+el.getAttribute('data-count'),suf=el.getAttribute('data-suffix')||'',t0=null,dur=900;
    function step(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=Math.round(to*e)+suf;if(p<1)requestAnimationFrame(step)}
    requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(entries){entries.forEach(function(en){
      if(en.isIntersecting){en.target.classList.add('in');$$('[data-count]',en.target).forEach(count);io.unobserve(en.target)}
    })},{rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(el){io.observe(el)});
  }else{els.forEach(function(el){el.classList.add('in')})}
})();
