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

  /* sound (WebAudio, no files; off by default) */
  var soundOn=false, actx=null;
  var btn=document.getElementById('sound'), lbl=document.getElementById('sound-label');
  function ctx(){ if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)(); return actx; }
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
})();
