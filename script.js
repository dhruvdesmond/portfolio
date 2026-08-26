/* Dhruv Singh portfolio — cursor trail, tap sound, scroll reveal, ripple */
(function(){
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var isTouch = matchMedia('(hover:none),(pointer:coarse)').matches;

  /* scroll reveal */
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.14, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  /* header border on scroll */
  var hdr = document.getElementById('hdr');
  addEventListener('scroll', function(){ hdr.classList.toggle('scrolled', scrollY>8); }, {passive:true});

  /* mobile menu */
  var menuBtn = document.getElementById('menuBtn');
  if(menuBtn){
    function setMenu(open){ hdr.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', open); menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
    menuBtn.addEventListener('click', function(){ setMenu(!hdr.classList.contains('menu-open')); });
    document.querySelectorAll('#navlinks a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
  }

  /* sound (WebAudio, no files; on by default — first click/tap unlocks audio) */
  var soundOn=true, actx=null;
  var btn=document.getElementById('sound'), lbl=document.getElementById('sound-label');
  if(btn){ btn.classList.add('on'); btn.setAttribute('aria-pressed','true'); if(lbl) lbl.textContent='Sound on'; }
  function ctx(){ if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)(); return actx; }
  // Browsers block audio until the first user gesture. On that first gesture (scroll/wheel/touch/click/key)
  // ARM WebAudio immediately with a silent 1-sample buffer + resume, so ticks are audible from the first scroll
  // instead of being lost while the async resume() is still waking the engine.
  var unlocked=false;
  function unlockAudio(e){
    try{
      var c=ctx();
      if(c.state==='suspended') c.resume();
      if(!unlocked){
        var buf=c.createBuffer(1,1,22050), src=c.createBufferSource();
        src.buffer=buf; src.connect(c.destination); src.start(0);
        unlocked=true;
        // instant "sound is live" tick on the first scroll/touch (click already ticks via pointerdown)
        if(e && (e.type==='wheel' || e.type==='scroll' || e.type==='touchstart')){ setTimeout(function(){ tick(520,.07); }, 45); }
      }
    }catch(err){}
  }
  ['pointerdown','keydown','touchstart','wheel','scroll'].forEach(function(ev){ addEventListener(ev, unlockAudio, {passive:true}); });
  function tick(f,v){
    if(!soundOn) return;
    try{
      var c=ctx(); if(c.state==='suspended') c.resume();
      var o=c.createOscillator(), g=c.createGain();
      o.type='sine'; o.frequency.value=f||760;
      g.gain.setValueAtTime(0.0001,c.currentTime);
      g.gain.exponentialRampToValueAtTime(v||0.14,c.currentTime+0.006);
      g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+0.09);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+0.1);
    }catch(e){}
  }
  if(btn){
    btn.addEventListener('click',function(e){
      e.preventDefault(); soundOn=!soundOn;
      btn.classList.toggle('on',soundOn); btn.setAttribute('aria-pressed',soundOn);
      lbl.textContent = soundOn ? 'Sound on' : 'Sound off';
      if(soundOn){ ctx().resume&&ctx().resume(); tick(880,.12); }
    });
  }
  addEventListener('pointerdown', function(){ tick(700,.12); }, {passive:true});

  /* dark / light theme toggle (persisted; initial theme set inline in <head> to avoid flash) */
  var themeBtn=document.getElementById('theme');
  if(themeBtn){
    function updTheme(){ var dark=document.documentElement.getAttribute('data-theme')==='dark'; themeBtn.setAttribute('aria-label', dark?'Switch to light mode':'Switch to dark mode'); themeBtn.setAttribute('aria-pressed', dark?'true':'false'); }
    updTheme();
    themeBtn.addEventListener('click', function(){
      var dark=document.documentElement.getAttribute('data-theme')==='dark', nt=dark?'light':'dark';
      document.documentElement.setAttribute('data-theme', nt);
      try{ localStorage.setItem('theme', nt); }catch(e){}
      updTheme(); tick(dark?720:520,.1);
    });
  }

  /* lead form — AJAX submit to FormSubmit (no backend, goes to email) */
  var leadForm=document.getElementById('leadForm');
  if(leadForm){
    var lfStatus=leadForm.querySelector('.lf-status'), lfBtn=leadForm.querySelector('.lf-submit');
    leadForm.addEventListener('submit', function(e){
      e.preventDefault();
      if(!leadForm.checkValidity()){ leadForm.reportValidity(); return; }
      lfStatus.className='lf-status'; lfStatus.textContent='Sending…'; lfBtn.disabled=true;
      fetch(leadForm.action, { method:'POST', headers:{'Accept':'application/json'}, body:new FormData(leadForm) })
        .then(function(r){ if(!r.ok) throw new Error('http'); return r.json().catch(function(){ return {}; }); })
        .then(function(){
          lfBtn.disabled=false; lfStatus.className='lf-status ok';
          lfStatus.textContent="Thanks — got it. I'll reply within a day.";
          leadForm.reset(); tick(660,.1);
        })
        .catch(function(){
          lfBtn.disabled=false; lfStatus.className='lf-status err';
          lfStatus.textContent="Couldn't send — please email dhruvdesmond@gmail.com directly.";
        });
    });
  }

  /* scroll progress rail (right side) + soft section-change tick */
  (function(){
    var rail=document.createElement('div'); rail.className='scroll-rail'; rail.setAttribute('aria-hidden','true');
    rail.innerHTML='<div class="sr-track"><div class="sr-fill"></div><div class="sr-dot"></div><div class="sr-pct">0%</div></div>';
    document.body.appendChild(rail);
    var fill=rail.querySelector('.sr-fill'), dot=rail.querySelector('.sr-dot'), pct=rail.querySelector('.sr-pct');
    var sections=[].slice.call(document.querySelectorAll('section, .statement'));
    var last=-1, hideT, lastTick=0;
    function now(){ return (window.performance && performance.now) ? performance.now() : +new Date(); }
    function upd(){
      var max=document.documentElement.scrollHeight-innerHeight;
      var prog=max>0 ? Math.min(1,Math.max(0,(scrollY||pageYOffset)/max)) : 0;
      fill.style.transform='scaleY('+prog+')';
      dot.style.top=(prog*100)+'%'; pct.style.top=(prog*100)+'%';
      pct.textContent=Math.round(prog*100)+'%';
      rail.classList.add('active'); clearTimeout(hideT); hideT=setTimeout(function(){ rail.classList.remove('active'); },900);
      // active section by viewport position (robust regardless of offsetParent)
      var threshold=innerHeight*0.42, idx=0;
      for(var i=0;i<sections.length;i++){ if(sections[i].getBoundingClientRect().top<=threshold) idx=i; }
      if(idx!==last){
        // only tick when we've genuinely settled into a NEW section, throttled so boundary jitter can't machine-gun
        if(last!==-1 && now()-lastTick>220){ tick(520,.07); lastTick=now(); }
        last=idx;
      }
    }
    addEventListener('scroll', upd, {passive:true}); addEventListener('resize', upd); upd();
  })();

  /* custom cursor + trailing line (desktop, motion allowed) */
  if(!isTouch && !reduce){
    document.body.classList.add('cursor-on');
    var dot=document.getElementById('dot'), ring=document.getElementById('ring');
    var cv=document.getElementById('trail'), cx=cv.getContext('2d');
    function size(){ var dpr=Math.min(devicePixelRatio||1,2); cv.width=innerWidth*dpr; cv.height=innerHeight*dpr; cv.style.width=innerWidth+'px'; cv.style.height=innerHeight+'px'; cx.setTransform(dpr,0,0,dpr,0,0); }
    size(); addEventListener('resize',size);
    var mx=innerWidth/2,my=innerHeight/2, rx=mx,ry=my, dx=mx,dy=my, pts=[];
    addEventListener('mousemove',function(e){ mx=e.clientX; my=e.clientY; pts.push({x:mx,y:my}); if(pts.length>22) pts.shift(); });
    document.querySelectorAll('a,button,[data-mag]').forEach(function(el){
      el.addEventListener('mouseenter',function(){ document.body.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave',function(){ document.body.classList.remove('cursor-hover'); });
    });
    document.querySelectorAll('[data-dark]').forEach(function(el){
      el.addEventListener('mouseenter',function(){ document.body.classList.add('on-dark'); });
      el.addEventListener('mouseleave',function(){ document.body.classList.remove('on-dark'); });
    });
    function frame(){
      dx+=(mx-dx)*0.9; dy+=(my-dy)*0.9; rx+=(mx-rx)*0.18; ry+=(my-ry)*0.18;
      dot.style.transform='translate('+dx+'px,'+dy+'px) translate(-50%,-50%)';
      ring.style.transform='translate('+rx+'px,'+ry+'px) translate(-50%,-50%)';
      cx.clearRect(0,0,innerWidth,innerHeight);
      if(pts.length>1){
        var dark=document.body.classList.contains('on-dark');
        for(var i=1;i<pts.length;i++){
          var p0=pts[i-1], p1=pts[i], a=i/pts.length;
          cx.beginPath(); cx.moveTo(p0.x,p0.y); cx.lineTo(p1.x,p1.y);
          cx.strokeStyle = dark ? 'rgba(243,238,228,'+(a*0.75)+')' : 'rgba(33,28,22,'+(a*0.4)+')';
          cx.lineWidth=a*3.2; cx.lineCap='round'; cx.stroke();
        }
      }
      requestAnimationFrame(frame);
    }
    frame();
    document.querySelectorAll('[data-mag]').forEach(function(el){
      el.addEventListener('mousemove',function(e){ var r=el.getBoundingClientRect(); el.style.transform='translate('+(e.clientX-(r.left+r.width/2))*0.18+'px,'+(e.clientY-(r.top+r.height/2))*0.22+'px)'; });
      el.addEventListener('mouseleave',function(){ el.style.transform=''; });
    });
  }

  /* touch ripple (mobile) */
  if(isTouch){
    addEventListener('touchstart',function(e){
      var t=e.touches[0]; if(!t) return;
      var r=document.createElement('span'); r.className='ripple';
      r.style.left=t.clientX+'px'; r.style.top=t.clientY+'px';
      document.body.appendChild(r);
      setTimeout(function(){ r.remove(); },600);
    },{passive:true});
  }

  /* engineering panel — every value read live at runtime, never hard-coded */
  if(document.getElementById('engineering')){
    function set(id,txt){ var el=document.getElementById(id); if(el) el.textContent=txt; }
    function ms(n){ return Math.round(n)+' ms'; }

    /* this page — Navigation Timing (load, TTFB, transferred weight) */
    function reportNav(){
      try{
        var nav=performance.getEntriesByType('navigation')[0];
        if(nav){ set('m-load', ms(nav.loadEventEnd||nav.duration)); set('m-ttfb', ms(nav.responseStart)); }
        var res=performance.getEntriesByType('resource'), bytes=(nav&&nav.transferSize)||0;
        for(var i=0;i<res.length;i++){ bytes+=res[i].transferSize||0; }
        set('m-weight', (bytes/1024).toFixed(0)+' KB');
      }catch(e){}
    }
    if(document.readyState==='complete') reportNav();
    else addEventListener('load', function(){ setTimeout(reportNav,0); });

    /* Largest Contentful Paint */
    try{
      new PerformanceObserver(function(list){
        var es=list.getEntries(), e=es[es.length-1];
        set('m-lcp', ms(e.renderTime||e.loadTime||e.startTime));
      }).observe({type:'largest-contentful-paint', buffered:true});
    }catch(e){ set('m-lcp','n/a'); }

    /* Cumulative Layout Shift */
    try{
      var cls=0;
      new PerformanceObserver(function(list){
        list.getEntries().forEach(function(e){ if(!e.hadRecentInput) cls+=e.value; });
        set('m-cls', cls.toFixed(3));
      }).observe({type:'layout-shift', buffered:true});
    }catch(e){ set('m-cls','n/a'); }

    /* live API round-trip — real request, real latency, real data */
    (function(){
      var t0=performance.now?performance.now():+new Date();
      fetch('https://api.github.com/repos/dhruvdesmond/portfolio/commits?per_page=1',{headers:{'Accept':'application/vnd.github+json'}})
        .then(function(r){
          set('a-ms', ms((performance.now?performance.now():+new Date())-t0));
          set('a-status', r.status+(r.ok?' OK':''));
          var link=r.headers.get('Link');
          if(link){ var m=link.match(/[?&]page=(\d+)>;\s*rel="last"/); if(m) set('a-commits', m[1]); }
          else set('a-commits','1');
          return r.json();
        })
        .then(function(data){
          var c=Array.isArray(data)&&data[0]&&data[0].commit&&data[0].commit.author;
          if(c) set('a-push', new Date(c.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}));
        })
        .catch(function(){ set('a-status','offline'); set('a-ms','—'); });
    })();
  }
})();
