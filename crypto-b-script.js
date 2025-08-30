/* ==== OPTIMASI PERFORMA ANDROID SUPER NGEBUT ==== */
// Disable console di production untuk speed
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  console.log = console.warn = console.error = () => {};
}

// Pool object untuk mengurangi garbage collection
const objectPool = {
  animations: [],
  elements: [],
  rent: function(type) {
    const pool = this[type] || [];
    return pool.pop() || {};
  },
  return: function(type, obj) {
    const pool = this[type] || [];
    if (pool.length < 50) pool.push(obj);
  }
};

// Optimize RAF dengan batch processing
let rafScheduled = false;
const rafQueue = [];
const optimizedRAF = (fn) => {
  rafQueue.push(fn);
  if (!rafScheduled) {
    rafScheduled = true;
    requestAnimationFrame(() => {
      rafScheduled = false;
      const queue = rafQueue.splice(0);
      queue.forEach(fn => fn());
    });
  }
};

// Fast DOM cache dengan WeakMap
const domCache = new WeakMap();
const fastQuery = (selector, context = document) => {
  if (!domCache.has(context)) {
    domCache.set(context, new Map());
  }
  const cache = domCache.get(context);
  if (!cache.has(selector)) {
    cache.set(selector, context.querySelector(selector));
  }
  return cache.get(selector);
};

/* ==== ORIGINAL SCRIPT START ==== */
/* ======= JS ASLI (tidak diubah) ======= */
// ===== Helpers =====
const qs = (id)=>document.getElementById(id);
const formatIDR = (n)=> 'Rp. ' + Number(n||0).toLocaleString('id-ID');
// === Session & anti-double-claim ===
function loadSession(){ try{ return JSON.parse(localStorage.getItem('tm_session')||'null'); }catch{ return null } }
const s = loadSession();
function setClaimed(kupon) { if (!kupon) return; localStorage.setItem('tm_claimed_'+kupon, '1'); }
function isClaimed(kupon) { if (!kupon) return false; return localStorage.getItem('tm_claimed_'+kupon) === '1'; }

// Saat halaman dibuka, cek status kupon ke API
async function checkKuponStatus() {
  if (!s?.userId || !s?.kupon) return;
  const apiUrl = 'https://script.google.com/macros/s/AKfycbyRl2BqiDPw75fQ-XYyL87eKDwHMr61eY0Cg7ra1vc36OMOFZ3IRY_QeZcLFDzFFM88/exec';
  try {
    const res = await fetch(`${apiUrl}?action=claim&userid=${encodeURIComponent(s.userId)}&kupon=${encodeURIComponent(s.kupon)}&site=BELEGENDBET`);
    const data = await res.json();
    if (data.msg && data.msg.toLowerCase().includes('terpakai')) {
      disableGame();
      showToast('INFO', 'Kupon sudah pernah dipakai!');
      setClaimed(s.kupon);
    }
  } catch (e) {}
}
function disableGame() {
  btn.disabled = true;
  btn.textContent = 'SELESAI';
  if(lever) lever.style.pointerEvents = 'none';
}
if (isClaimed(s?.kupon)) {
  disableGame();
  showToast('INFO', 'Kupon sudah pernah dipakai!');
} else {
  checkKuponStatus();
}

// ===== Data =====
const symbols=[
  { name:'Bitcoin (BTC)',   icon:'https://i.postimg.cc/zB6s73np/btc.webp', prize:1500000 },
  { name:'Ethereum (ETH)',  icon:'https://i.postimg.cc/T3d4rnzf/eth.webp', prize:500000 },
  { name:'Dogecoin (DOGE)', icon:'https://i.postimg.cc/zXjdXVVM/doge.webp', prize:100000 },
  { name:'Cardano (ADA)',   icon:'https://i.postimg.cc/4ywzZHBQ/ada.webp', prize:50000 },
  { name:'Solana (SOL)',    icon:'https://i.postimg.cc/B6BFc19f/sol.webp', prize:10000 },
  { name:'Litecoin (LTC)',  icon:'https://i.postimg.cc/sDvB1LXr/ltc.webp', prize:8000 },
  { name:'Ripple (XRP)',    icon:'https://i.postimg.cc/N0wLJfxs/xrp.webp', prize:5000 },
  { name:'Binance Coin (BNB)', icon:'https://i.postimg.cc/15ntyNCR/bnb.webp', prize:3000 },
  { name:'Polkadot (DOT)',  icon:'https://i.postimg.cc/13D3q11L/dot.webp', prize:2000 }
];

// ===== Elements =====
const reel=qs('reel'), btn=qs('btn'), boardEl=qs('prizeBoard'), overlay=qs('overlay'),
  mTitle=qs('mTitle'), mMsg=qs('mMsg'), okBtn=qs('ok'), picker=qs('picker'), lever=qs('lever'),
  display=qs('display'), editBtn=qs('editIcons'), iconEditor=qs('iconEditor');
const toast=qs('toast'), tTitle=qs('tTitle'), tMsg=qs('tMsg'), tClose=qs('tClose'); // tClose null = aman
const REM=parseFloat(getComputedStyle(document.documentElement).fontSize);

// ===== Auto-hide toast (5 detik) =====
let toastTimer;
function showToast(title, msg){
  tTitle.textContent = title;
  tMsg.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
}
function hideToast(){
  if (toastTimer){ clearTimeout(toastTimer); toastTimer=null; }
  toast.classList.remove('show');
}
if(tClose){ tClose.addEventListener('click', hideToast); }

// ===== Preload icons =====
async function preloadIcons(){
  const urls = [...new Set(symbols.map(s=>s.icon))];
  await Promise.all(urls.map(src => new Promise(res=>{
    const im = new Image();
    im.decoding = 'sync';
    im.loading = 'eager';
    im.crossOrigin = 'anonymous';
    im.referrerPolicy = 'no-referrer';
    im.src = src;
    im.onload = im.onerror = res;
  })));
}

// ===== Helper tunggu gambar =====
function waitImagesOrTimeout(root, ms=1200){
  const imgs = [...root.querySelectorAll('img')].filter(im=>!im.complete);
  if(!imgs.length) return Promise.resolve();
  return Promise.race([
    Promise.all(imgs.map(im=>new Promise(r=>{ im.onload=r; im.onerror=r; }))),
    new Promise(r=>setTimeout(r, ms))
  ]);
}

// ===== State & Config =====
let CELL_H=18*REM, CENTER_OFF=0, baseIndex=0, spinning=false, lastPick=-1;
const LOOPS=10;
const SPIN_FAST_MS=3500;
const LANDING_MS=1400;
const ACTIVE_SPIN_MS=650;
const SEQ_MIN=12, SEQ_MAX=18;

// ===== UI Wiring =====
okBtn.addEventListener('click',()=>overlay.style.display='none');
btn.addEventListener('click', startSpin);
if(lever){
  lever.addEventListener('click', ()=>{
    if(!spinning){
      lever.classList.add('pull');
      setTimeout(()=>lever.classList.remove('pull'), 400);
      startSpin();
    }
  });
  lever.addEventListener('keydown', (e)=>{
    if((e.key==='Enter'||e.key===' ') && !spinning){
      e.preventDefault();
      lever.click();
    }
  });
}
// OPTIMIZED EVENT LISTENERS WITH DEBOUNCING
let resizeDebounceTimeout;
addEventListener('resize', ()=>{ 
  clearTimeout(resizeDebounceTimeout);
  resizeDebounceTimeout = setTimeout(() => {
    measureCell(); 
    applyBaseTransform(); 
  }, 100);
});

// THROTTLED POINTER MOVE
let pointerMoveTimeout;
addEventListener('pointermove', (e)=>{
  if (pointerMoveTimeout) return;
  pointerMoveTimeout = setTimeout(() => {
    pointerMoveTimeout = null;
    const x = e.clientX / innerWidth;
    const y = e.clientY / innerHeight;
    if(document.body.style.setProperty){
      document.body.style.setProperty('--mx', Math.round(x*100)+'%');
      document.body.style.setProperty('--my', Math.round(y*100)+'%');
    }
  }, 32); // 30fps throttle for better performance
});

// ===== Prize Board =====
function renderPrizeBoard(){
  boardEl.innerHTML='';
  symbols.forEach((s,i)=>{
    const r=document.createElement('div');
    r.className='row';
    r.dataset.idx=i;

    const img=document.createElement('img');
    img.src=s.icon; img.alt=s.name;
    img.loading='lazy'; img.decoding='async'; img.setAttribute('fetchpriority','low');
    img.width=80; img.height=80;
    img.style.maxWidth='100%'; img.style.height='auto';

    const name=document.createElement('div');
    name.className='name';
    name.textContent=s.name;

    const amt=document.createElement('div');
    amt.className='amt';
    amt.textContent=formatIDR(s.prize);

    r.appendChild(img); r.appendChild(name); r.appendChild(amt);
    boardEl.appendChild(r);
  });
}
function setActiveRow(i){
  boardEl.querySelectorAll('.row').forEach(el=>el.classList.toggle('active', Number(el.dataset.idx)===i));
  const row = boardEl.querySelector(`.row[data-idx="${i}"]`);
  if(row){ row.scrollIntoView({block:'nearest', behavior:'smooth'}); }
}
function markWin(i){
  boardEl.querySelectorAll('.row').forEach(el=>{
    const hit = Number(el.dataset.idx)===i;
    el.classList.toggle('win', hit);
    if(hit){
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
      setTimeout(()=> el.classList.remove('flash'), 1200);
    } else {
      el.classList.remove('flash');
    }
  });
}

// ===== Reel Build & Measure =====
function recalcCenter(){ const rect=reel.parentElement.getBoundingClientRect(); CENTER_OFF = Math.max(0,(rect.height-CELL_H)/2); }
function measureCell(){ const first = reel.children[0]; if(first){ CELL_H = first.getBoundingClientRect().height || 18*REM; } recalcCenter(); }

async function populate(){
  reel.innerHTML='';
  const arr = Array.from({length: LOOPS}, ()=> symbols).flat();
  for(const s of arr){
    const d=document.createElement('div');
    d.className='cell';
    const img = document.createElement('img');
    img.src=s.icon; img.alt=s.name;
    img.loading='eager'; img.decoding='sync'; img.setAttribute('fetchpriority','high');
    img.width=110; img.height=110;
    img.addEventListener('error',()=>{
      d.innerHTML = `<div style="width:110px;height:110px;border-radius:999px;display:grid;place-items:center;background:linear-gradient(135deg,#38bdf8,#a855f7);color:#0b0f1a;font-weight:900;">${(s.name.split('(')[1]?.replace(')','')||'??')}</div>`;
    });
    d.appendChild(img);
    const label = document.createElement('span'); label.textContent = s.name; d.appendChild(label);
    reel.appendChild(d);
  }

  await waitImagesOrTimeout(reel, 1200);

  measureCell();
  baseIndex=symbols.length*Math.floor(LOOPS/2);
  reel.style.transition='none';
  applyBaseTransform();
  renderDisplay(symbols[0]);
}
function applyBaseTransform(){ reel.style.transform=`translate3d(0, -${baseIndex*CELL_H - CENTER_OFF}px, 0)`; }

// ===== Spin Logic =====
function getAllowedIndices(){ return symbols.map((s,i)=> (s.prize>=2000 && s.prize<=10000) ? i : -1).filter(i=>i>=0); }
function pickAllowed(){ const a=getAllowedIndices(); return a[Math.floor(Math.random()*a.length)]; }
function calcLandingIndex(currentStep,targetIdx,perRound){
  const stepMod=currentStep%perRound; const delta=(targetIdx-stepMod+perRound)%perRound; return currentStep+perRound*2+delta;
}
function flashPicker(){ picker.animate([{opacity:1},{opacity:0.25},{opacity:1}],{duration:520,iterations:3}); picker.style.opacity=1; }

// === DISPLAY (top->bottom logo column) ===
function renderDisplay(sym){
  display.innerHTML = '';
  const im = document.createElement('img');
  im.className='logo';
  im.src = sym.icon;
  im.alt = sym.name;
  im.loading='eager'; im.decoding='sync'; im.setAttribute('fetchpriority','high');
  im.width=180; im.height=180;
  display.appendChild(im);
}
function buildColumn(order){
  display.innerHTML = '<div class="vcol" id="vcol"></div>';
  const col = document.getElementById('vcol');
  order.forEach(i=>{
    const s = symbols[i];
    const el = document.createElement('div');
    el.className='vItem';
    const im = document.createElement('img');
    im.className='logo';
    im.src=s.icon; im.alt=s.name;
    im.loading='lazy'; im.decoding='async'; im.setAttribute('fetchpriority','low');
    im.width=100; im.height=100;
    im.style.maxWidth='100%'; im.style.height='auto';
    el.appendChild(im);
    col.appendChild(el);
  });
  return col;
}

function startSpin(){
  display.classList.add('spinning');
  if(lever){ lever.classList.add('pull'); setTimeout(()=>lever.classList.remove('pull'), 400); }
  if(spinning) return;
  
  // MULAI SUARA BEEP BEEP UNTUK CRYPTO TRADE
  startCryptoBeepSound();
  
  spinning=true; btn.disabled=true; btn.textContent='EXECUTING...';

  const per=symbols.length, current=baseIndex;
  let finalIdx=pickAllowed();
  if(finalIdx===current%per) finalIdx=(finalIdx+1)%per;
  lastPick=finalIdx; setActiveRow(finalIdx);

  const seqLen = SEQ_MIN + Math.floor(Math.random()*(SEQ_MAX-SEQ_MIN+1));
  const order = [];
  for(let k=0;k<seqLen-1;k++){ order.push(Math.floor(Math.random()*per)); }
  order.push(finalIdx);

  const col = buildColumn(order);
  const item = col.children[0];
  const h = item.getBoundingClientRect().height;
  const centerY = display.clientHeight/2;
  const endY = centerY - ((order.length-1)*h + h/2);
  const stepLead = 6;
  const startY = endY - h * stepLead;
  const duration = ACTIVE_SPIN_MS;

  col.style.transition='none';
  col.style.transform = `translateY(${startY}px)`;
  requestAnimationFrame(()=>{ requestAnimationFrame(()=>{
    col.style.filter='brightness(1.05) blur(1px)';
    col.style.transition = `transform ${duration}ms cubic-bezier(.2,.95,.25,1)`;
    col.style.transform = `translateY(${endY}px)`;
  });});

  const onEnd = (e)=>{
    if(e.propertyName!=='transform') return;
    col.removeEventListener('transitionend', onEnd);
    col.style.filter='none';
    display.classList.remove('spinning');
    finishSpin(symbols[finalIdx], finalIdx);
  };
  col.addEventListener('transitionend', onEnd);
}

function finishSpin(sym, idx){
  // STOP SUARA BEEP SETELAH SPIN SELESAI
  stopCryptoBeepSound();
  
  spinning=false; btn.disabled=true; btn.textContent='SELESAI';
  if (!s?.userId || !s?.kupon) {
    showToast('ERROR', 'Session tidak valid. Silakan login ulang.');
    return;
  }
  if (isClaimed(s.kupon)) {
    showToast('INFO', 'Kupon sudah pernah dipakai!');
    disableGame();
    return;
  }
  const apiUrl = 'https://script.google.com/macros/s/AKfycbyRl2BqiDPw75fQ-XYyL87eKDwHMr61eY0Cg7ra1vc36OMOFZ3IRY_QeZcLFDzFFM88/exec';
  const url = `${apiUrl}?action=catat&userid=${encodeURIComponent(s.userId)}&kupon=${encodeURIComponent(s.kupon)}&site=BELEGENDBET`;
  fetch(url)
    .then(async res => {
      let data;
      try { data = await res.json(); } catch(e) { data = {success:false, msg:'Response bukan JSON'}; }
      if (data.success) {
        let hadiahNum = Number(data.hadiah);
        let idxServer = symbols.findIndex(sy => Number(sy.prize) === hadiahNum);
        if(idxServer === -1) idxServer = idx;
        renderDisplay(symbols[idxServer]);
        markWin(idxServer); flashPicker();
        mTitle.textContent = 'TRADE SUCCESS!';
        mMsg.textContent = `Profit ${formatIDR(hadiahNum)} dari ${symbols[idxServer].name}`;
        
        // PLAY CHA-CHING SOUND UNTUK HADIAH CRYPTO
        playCryptoCaching();
        
        showToast('SUKSES', `Hadiah ${formatIDR(hadiahNum)} (${symbols[idxServer].name}) Selamat Bosku🎉`);
        setClaimed(s.kupon);
        disableGame();
      } else {
        showToast('ERROR', data.msg || 'Gagal mencatat hadiah!');
        disableGame();
      }
    })
    .catch(() => {
      showToast('ERROR', 'Gagal menghubungi server. Coba lagi.');
      disableGame();
    });
}

// ===== Stars BG - ANDROID OPTIMIZED =====
(function stars(){
  const c = qs('stars');
  if (!c) return;
  const ctx = c.getContext('2d');
  
  // REDUCE STARS FOR MOBILE PERFORMANCE
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const N = isMobile ? 80 : 160; // Kurangi separuh untuk mobile
  
  function resize(){ 
    const scale = Math.min(devicePixelRatio, 2); // Limit pixel ratio
    c.width = innerWidth * scale; 
    c.height = innerHeight * scale; 
  }
  resize(); 
  
  // THROTTLE RESIZE EVENT
  let resizeTimeout;
  addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 100);
  });
  
  const stars = new Array(N).fill(0).map(()=>({ 
    x: Math.random()*c.width, 
    y: Math.random()*c.height, 
    z: Math.random()*0.8+0.2, // Slower movement
    r: Math.random()*1.2+0.2 
  }));
  
  let t=0;
  let lastTime = 0;
  
  function loop(currentTime){
    // LIMIT FPS TO 30 FOR MOBILE
    if (currentTime - lastTime < (isMobile ? 33 : 16)) {
      requestAnimationFrame(loop);
      return;
    }
    lastTime = currentTime;
    
    t+=0.012; // Slower animation
    ctx.clearRect(0,0,c.width,c.height);
    
    for(const s of stars){
      s.y += s.z*0.4; // Slower movement
      if(s.y>c.height) s.y = 0;
      
      ctx.globalAlpha = 0.5 + Math.sin((s.x+s.y+t*20)/120)*0.15; // Dimmer, slower flicker
      ctx.beginPath(); 
      ctx.arc(s.x,s.y,s.r*Math.min(devicePixelRatio, 2),0,Math.PI*2);
      ctx.fillStyle = '#7dd3fc'; 
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  loop();
})();

// ===== Live Chart =====
(function liveChart(){
  const cv = qs('liveChart');
  const ctx = cv.getContext('2d');
  const tfWrap = document.getElementById('mcTime');
  const sel = document.getElementById('mcSymbol');
  const maInp = document.getElementById('mcMA');
  const emaInp = document.getElementById('mcEMA');

  function tickerFromName(name){
    const m = name.match(/\(([^)]+)\)/);
    return (m? m[1].toUpperCase(): name.split(' ')[0].toUpperCase()) + 'USDT';
  }
  const tickers = symbols.map(s=>({ label: tickerFromName(s.name), value: tickerFromName(s.name) }));
  sel.innerHTML = tickers.map(t=>`<option value="${t.value}">${t.label}</option>`).join('');

  let candles = [];
  let base = 68000;
  let last = base;
  let winSec = 1800;
  let maP = 20, emaP = 50;
  const bases = { BTCUSDT:68000, ETHUSDT:3600, DOGEUSDT:0.12, ADAUSDT:0.6, SOLUSDT:150, LTCUSDT:80, XRPUSDT:0.55, BNBUSDT:420, DOTUSDT:7.5 };

  function seed(n=240){
    candles.length=0;
    let p = last = base;
    const now = Date.now();
    for(let i=n;i>0;i--){
      const v = (Math.random()-0.5);
      const vol = Math.max(0.0005*base, base*0.002);
      const o = p;
      const c = Math.max(0.0000001, o + v*vol);
      const h = Math.max(o,c) + Math.random()*vol*0.6;
      const l = Math.min(o,c) - Math.random()*vol*0.6;
      p = c;
      candles.push({ t: Math.floor((now - i*1000)/1000), o,h,l,c });
    }
  }
  function setSymbol(sym){ base = bases[sym] || 1000; last = base; seed(3600); draw(); window.__chartSym = sym; }
  setSymbol(sel.value || tickers[0].value); sel.value = sel.value || tickers[0].value;

  let dpr = 1;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  function resize(){ 
    dpr = Math.min(devicePixelRatio || 1, 2); // Limit DPR for performance
    cv.width = cv.clientWidth*dpr; 
    cv.height = cv.clientHeight*dpr; 
    ctx.setTransform(dpr,0,0,dpr,0,0); 
    draw(); 
  }
  
  // THROTTLE RESIZE
  let resizeTimeout;
  addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  }); 
  resize();

  // OPTIMIZED TICK FUNCTION
  let tickInterval;
  function tick(){
    const vol = Math.max(0.0005*base, base*0.002);
    const o = last;
    const drift = (Math.random()-0.5)*vol*1.6;
    const c = Math.max(0.0000001, o + drift);
    const h = Math.max(o,c) + Math.random()*vol*0.6;
    const l = Math.min(o,c) - Math.random()*vol*0.6;
    last = c;
    candles.push({ t: Math.floor(Date.now()/1000), o,h,l,c });
    if(candles.length>15000) candles.shift(); // Smaller buffer
    draw();
  }
  
  // SLOWER UPDATE FOR MOBILE
  const updateInterval = isMobile ? 2000 : 1000;
  tickInterval = setInterval(tick, updateInterval);

  function SMA(arr, p){
    const out=[]; let sum=0;
    for(let i=0;i<arr.length;i++){
      sum+=arr[i]; if(i>=p) sum-=arr[i-p];
      out.push(i>=p-1? sum/p: NaN);
    }
    return out;
  }
  function EMA(arr, p){
    const out=[]; const k=2/(p+1); let prev=arr[0]||0;
    for(let i=0;i<arr.length;i++){
      const v= i? (arr[i]*k + prev*(1-k)) : arr[i];
      out.push(i? v: NaN); prev=v;
    }
    return out;
  }

  function formatPrice(v){ if(v>=1000) return Math.round(v).toLocaleString('en-US'); if(v>=1) return v.toFixed(2); return v.toFixed(4); }
  function tsToLabel(ts){ const d=new Date(ts*1000); const m=d.getMinutes().toString().padStart(2,'0'); return `${d.getHours()}:${m}`; }

  function draw(){
    if(!cv || !cv.clientWidth){ return; }
    const view = candles.slice(-winSec);
    const w = cv.clientWidth, h = cv.clientHeight;
    ctx.clearRect(0,0,w,h);
    if(view.length<2){ window.__chartReady=true; return; }

    const highs = view.map(c=>c.h), lows = view.map(c=>c.l);
    const ymax = Math.max(...highs); const ymin = Math.min(...lows);
    const pad = (ymax - ymin)*0.08 + 1e-9;
    const max=ymax+pad, min=ymin-pad;
    const n = view.length; const cw = Math.max(2, w/n*0.7);

    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    const rows=4, cols=8;
    for(let r=1;r<rows;r++){ const y=h*r/rows; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
    for(let c=1;c<cols;c++){ const x=w*c/cols; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }

    function xy(i,v){ const x=i/(n-1)*w; const y=h - (v-min)/(max-min)*h; return [x,y]; }

    for(let i=0;i<n;i++){
      const c = view[i];
      const [xOpen,yOpen] = xy(i,c.o);
      const [xClose,yClose] = xy(i,c.c);
      const [xHigh,yHigh] = xy(i,c.h);
      const [xLow,yLow] = xy(i,c.l);
      const x = xOpen; const up = c.c>=c.o;
      ctx.strokeStyle = up? 'rgba(34,197,94,0.95)':'rgba(239,68,68,0.95)';
      ctx.fillStyle   = up? 'rgba(34,197,94,0.35)':'rgba(239,68,68,0.35)';
      ctx.beginPath(); ctx.moveTo(x,yHigh); ctx.lineTo(x,yLow); ctx.stroke();
      const bx = x - cw/2; const by = Math.min(yOpen,yClose); const bh = Math.max(1, Math.abs(yClose - yOpen));
      ctx.fillRect(bx, by, cw, bh); ctx.strokeRect(bx, by, cw, bh);
    }

    const closes = view.map(c=>c.c);
    const sma = SMA(closes, maP);
    const ema = EMA(closes, emaP);
    function line(arr, color){
      ctx.beginPath();
      for(let i=0;i<arr.length;i++){
        const v = arr[i]; if(!isFinite(v)) continue;
        const [x,y]=xy(i,v);
        if(i===0||!isFinite(arr[i-1])) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.lineWidth=1.6; ctx.strokeStyle=color; ctx.shadowColor=color.replace('1)','0.25)'); ctx.shadowBlur=6; ctx.stroke(); ctx.shadowBlur=0;
    }
    line(sma, 'rgba(167,139,250,1)');
    line(ema, 'rgba(96,165,250,1)');

    const lastPx = closes[closes.length-1];
    const [xr, yr] = xy(n-1,lastPx);
    const tag = formatPrice(lastPx);
    const textW = ctx.measureText(tag).width;
    ctx.fillStyle='rgba(17,24,39,0.85)'; ctx.strokeStyle='rgba(99,102,241,.6)'; ctx.lineWidth=1;
    ctx.fillRect(w - textW - 6*2 - 8, yr-10, textW + 6*2, 20);
    ctx.strokeRect(w - textW - 6*2 - 8, yr-10, textW + 6*2, 20);
    ctx.fillStyle='#e5edff'; ctx.font='12px Roboto Mono';
    ctx.fillText(tag, w - textW - 6 - 8, yr+4);

    ctx.fillStyle='rgba(148,163,184,.9)'; ctx.font='11px Roboto Mono';
    for(let i=0;i<=6;i++){
      const idx=Math.floor(i/6*(n-1));
      const t=view[idx].t;
      const [x,y]=xy(idx, min);
      ctx.fillText(tsToLabel(t), x-10, h-6);
    }
    window.__chartReady = true;
  }

  tfWrap.querySelectorAll('.chip').forEach(b=>{
    b.addEventListener('click',()=>{
      tfWrap.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
      b.addEventListener; b.classList.add('active');
      const win = Number(b.dataset.win)||1800; winSec = win; draw();
    });
  });
  maInp.addEventListener('change',()=>{ maP = Math.max(2, Math.min(200, Number(maInp.value)||20)); draw(); });
  emaInp.addEventListener('change',()=>{ emaP = Math.max(2, Math.min(200, Number(emaInp.value)||50)); draw(); });
  sel.addEventListener('change',()=>{ setSymbol(sel.value); });
})();

// ===== Boot =====
(()=>{
  renderPrizeBoard();
  populate();
  preloadIcons();
})();

/* ==== SISTEM AUDIO - 2 SUARA CRYPTO ==== */
let audioCtx;
let beepSound = null;
let isBeepPlaying = false;

function getCtx(){ 
  if(!audioCtx){ 
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)(); 
      console.log('Audio context created, state:', audioCtx.state);
    } catch (e) {
      console.error('Failed to create audio context:', e);
      return null;
    }
  } 
  if(audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      console.log('Audio context resumed, state:', audioCtx.state);
    }).catch(e => {
      console.error('Failed to resume audio context:', e);
    });
  }
  return audioCtx; 
}

// Initialize audio context on first user interaction
let audioInitialized = false;
function initAudioOnInteraction() {
  if (audioInitialized) return;
  audioInitialized = true;
  try { 
    getCtx(); 
    console.log('Audio initialized on user interaction');
  } catch(e) {
    console.error('Audio initialization failed:', e);
  }
}

window.addEventListener('pointerdown', initAudioOnInteraction, {once:true, passive:true});
window.addEventListener('click', initAudioOnInteraction, {once:true, passive:true});
window.addEventListener('touchstart', initAudioOnInteraction, {once:true, passive:true});

// 1. SUARA BEEP BEEP untuk SPIN EXECUTE TRADE
function createBeepSound() {
  try {
    const ctx = getCtx();
    if (!ctx) return null;
    
    // Buat oscillator untuk suara beep crypto
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    
    osc1.type = 'square';
    osc1.frequency.value = 900; // Higher frequency for crypto feel
    
    osc2.type = 'sine';
    osc2.frequency.value = 650; // Lower harmonic
    
    // Gain untuk masing-masing oscillator
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const masterGain = ctx.createGain();
    
    gain1.gain.value = 0.35;
    gain2.gain.value = 0.25;
    masterGain.gain.value = 0;
    
    // Band-pass filter untuk suara beep yang digital
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 3;
    
    // Connection
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);
    
    return { 
      osc1: osc1, 
      osc2: osc2, 
      gain: masterGain, 
      filter: filter,
      gain1: gain1,
      gain2: gain2
    };
  } catch (e) {
    console.error('Error creating crypto beep sound:', e);
    return null;
  }
}

function startCryptoBeepSound() {
  if (isBeepPlaying) return;
  
  try {
    const ctx = getCtx();
    console.log('Starting beep beep sound for crypto trade...');
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    isBeepPlaying = true;
    
    // Buat pattern beep-beep berulang untuk crypto
    let beepCount = 0;
    const maxBeeps = 12; // Lebih banyak beep untuk crypto trade
    
    const createSingleBeep = () => {
      if (!isBeepPlaying || beepCount >= maxBeeps) {
        isBeepPlaying = false;
        return;
      }
      
      beepSound = createBeepSound();
      if (beepSound) {
        const currentTime = ctx.currentTime;
        
        // Start oscillators
        beepSound.osc1.start(currentTime);
        beepSound.osc2.start(currentTime);
        
        // Faster beep pattern untuk crypto: on 0.08s, off 0.08s
        beepSound.gain.gain.setValueAtTime(0, currentTime);
        beepSound.gain.gain.linearRampToValueAtTime(0.7, currentTime + 0.01);
        beepSound.gain.gain.linearRampToValueAtTime(0.7, currentTime + 0.06);
        beepSound.gain.gain.linearRampToValueAtTime(0, currentTime + 0.08);
        
        // Stop after beep duration
        setTimeout(() => {
          try {
            if (beepSound) {
              beepSound.osc1.stop();
              beepSound.osc2.stop();
            }
          } catch (e) {
            console.warn('Crypto beep oscillators already stopped:', e);
          }
        }, 100);
        
        beepCount++;
        
        // Schedule next beep dengan interval yang lebih cepat
        setTimeout(createSingleBeep, 160);
      }
    };
    
    createSingleBeep();
  } catch (e) {
    console.error('Error starting crypto beep sound:', e);
    isBeepPlaying = false;
  }
}

function stopCryptoBeepSound() {
  isBeepPlaying = false;
  console.log('Stopping crypto beep sound...');
}

// 2. SUARA CHA-CHING untuk HADIAH CRYPTO
function playCryptoCaching(){
  try {
    const ctx = getCtx(); 
    const t0 = ctx.currentTime + 0.02;
    
    // Enhanced cha-ching untuk crypto dengan frequency lebih tinggi
    const o1 = ctx.createOscillator(); 
    o1.type='triangle'; 
    const g1 = ctx.createGain(); 
    g1.gain.setValueAtTime(0.0001, t0); 
    g1.gain.exponentialRampToValueAtTime(0.8, t0+0.02); 
    g1.gain.exponentialRampToValueAtTime(0.0001, t0+0.8); 
    o1.frequency.setValueAtTime(1300, t0); // Higher frequency for crypto
    o1.frequency.exponentialRampToValueAtTime(1800, t0+0.08);
    
    const o2 = ctx.createOscillator(); 
    o2.type='square';   
    const g2 = ctx.createGain(); 
    g2.gain.setValueAtTime(0.0001, t0); 
    g2.gain.exponentialRampToValueAtTime(0.4, t0+0.02); 
    g2.gain.exponentialRampToValueAtTime(0.0001, t0+0.6); 
    o2.frequency.setValueAtTime(780, t0);  
    o2.frequency.exponentialRampToValueAtTime(1100, t0+0.06);
    
    // Extra sparkle oscillator untuk crypto
    const o3 = ctx.createOscillator();
    o3.type = 'sine';
    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(0.0001, t0);
    g3.gain.exponentialRampToValueAtTime(0.3, t0+0.01);
    g3.gain.exponentialRampToValueAtTime(0.0001, t0+0.4);
    o3.frequency.setValueAtTime(2200, t0);
    o3.frequency.exponentialRampToValueAtTime(2800, t0+0.05);
    
    const nDur=0.1; 
    const b = ctx.createBuffer(1, ctx.sampleRate*nDur, ctx.sampleRate); 
    const d=b.getChannelData(0); 
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    
    const n = ctx.createBufferSource(); 
    n.buffer=b; 
    const ng=ctx.createGain(); 
    ng.gain.setValueAtTime(0.5, t0); 
    ng.gain.exponentialRampToValueAtTime(0.0001, t0+nDur);
    
    o1.connect(g1).connect(ctx.destination); 
    o2.connect(g2).connect(ctx.destination);
    o3.connect(g3).connect(ctx.destination);
    n.connect(ng).connect(ctx.destination);
    
    o1.start(t0); 
    o2.start(t0+0.02); 
    o3.start(t0+0.01);
    n.start(t0); 
    o1.stop(t0+0.8); 
    o2.stop(t0+0.6); 
    o3.stop(t0+0.4);
    n.stop(t0+nDur);
    
    console.log('Playing crypto cha-ching sound for prize');
  } catch (e) {
    console.warn('Error playing crypto cha-ching sound:', e);
  }
}

// Cleanup suara saat halaman ditutup atau kehilangan focus
window.addEventListener('beforeunload', () => {
  stopCryptoBeepSound();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopCryptoBeepSound();
  }
});

// ===== ANDROID PERFORMANCE CLEANUP =====
// Clean up resources when page becomes hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Clear timeouts and intervals
    if (typeof tickInterval !== 'undefined') clearInterval(tickInterval);
    if (typeof resizeDebounceTimeout !== 'undefined') clearTimeout(resizeDebounceTimeout);
    if (typeof pointerMoveTimeout !== 'undefined') clearTimeout(pointerMoveTimeout);
    if (typeof resizeTimeout !== 'undefined') clearTimeout(resizeTimeout);
    
    // Pause animations for background tabs
    const canvas = document.querySelector('#stars');
    if (canvas) {
      canvas.style.display = 'none';
    }
  } else {
    // Resume when visible
    const canvas = document.querySelector('#stars');
    if (canvas) {
      canvas.style.display = 'block';
    }
  }
});

// Memory cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (typeof tickInterval !== 'undefined') clearInterval(tickInterval);
  clearTimeout(resizeDebounceTimeout);
  clearTimeout(pointerMoveTimeout);
  clearTimeout(resizeTimeout);
});
