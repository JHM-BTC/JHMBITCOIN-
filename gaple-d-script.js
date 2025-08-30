/* ==== OPTIMASI PERFORMA ANDROID SUPER NGEBUT ==== */
// Disable console di production untuk speed
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  console.log = console.warn = console.error = () => {};
}

// Optimize event listeners dengan passive
const addEventOptimized = (el, type, fn) => {
  if (el && el.addEventListener) {
    el.addEventListener(type, fn, { passive: true, capture: false });
  }
};

// Debounce untuk resize events
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
};

// Optimize DOM queries dengan cache
const domCache = new Map();
const $ = (selector) => {
  if (!domCache.has(selector)) {
    domCache.set(selector, document.querySelector(selector));
  }
  return domCache.get(selector);
};

// Faster RAF dengan fallback - ANDROID OPTIMIZED
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const fastRAF = window.requestAnimationFrame || 
              window.webkitRequestAnimationFrame || 
              ((fn) => setTimeout(fn, isMobile ? 20 : 16));

// Memory management - cleanup DOM cache (faster for mobile)
const cleanupInterval = isMobile ? 20000 : 30000;
setInterval(() => {
  if (domCache.size > (isMobile ? 30 : 50)) {
    domCache.clear();
  }
}, cleanupInterval);

/* ==== ORIGINAL SCRIPT START ==== */
/* ==================== OPTIMASI RUNTIME TANPA UBAH STRUKTUR/LOGIKA ==================== */
(function enableLiteMode(){
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  const lowMem = navigator.deviceMemory && navigator.deviceMemory <= 3; // <=3GB dianggap low
  const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4; // core sedikit
  if (saveData || prefersReducedMotion || lowMem || lowCPU || innerWidth < 520) {
    document.documentElement.classList.add('lite');
  }
})();

/* ========== CONFIG & DATA ========== */
const BRAND = "DOOR PRIZE GAPLE";
const DEST_WA = "https://klikblg.com/wa-blb";
const DEST_TG = "https://t.me/asupanfreebet";
const MEMBER_LOW_ONLY = true; // hanya 1–8 & tanpa balak

// 28 kartu domino (a<=b)
const DECK = (()=>{ const arr=[]; let id=0; for(let a=0;a<=6;a++){ for(let b=a;b<=6;b++){ arr.push({id:++id, a, b, total:a+b, balak:a===b}); } } return arr; })();

/* ======= PRIZE LIST RENDER (DOM tetap sama) ======= */
const listUtama = document.getElementById('list-utama');
const listBiasa = document.getElementById('list-biasa');
(function renderPrizeLists(){
  const fmt = (n)=> n.toLocaleString('id-ID');
  const fragB = document.createDocumentFragment();
  const fragU = document.createDocumentFragment();
  for(let t=1;t<=11;t++){
    const el=document.createElement('div');
    el.className='prize-item'; el.dataset.key='TOTAL-'+t;
    el.innerHTML = `<div><strong>Total Titik ${t}</strong><div class="tiny">Hadiah: Rp${fmt(t*1000)}</div></div><div class="badge biasa">BIASA</div>`;
    fragB.appendChild(el);
  }
  for(let n=0;n<=6;n++){
    const tot=n*2, el=document.createElement('div'); el.className='prize-item'; el.dataset.key='BALAK-'+n;
    el.innerHTML = `<div><strong>Balak ${n} (${n}/${n})</strong><div class="tiny">BIG PRIZE: Rp${fmt((tot===0?1000:tot*1000)*100)}</div></div><div class="badge utama">UTAMA</div>`;
    fragU.appendChild(el);
  }
  listBiasa.appendChild(fragB); listUtama.appendChild(fragU);
})();

/* ========== FIREWORKS (Lazy init supaya tidak berat) ========== */
let FX = null;
function getFX(){
  if (FX) return FX;
  const cvs = document.getElementById('fxFireworks');
  const ctx = cvs.getContext('2d', { alpha:true });
  let W,H, raf=null; const particles=[]; const GRAV=0.05; const FRICTION=0.985;
  const DPR = Math.min(1.5, window.devicePixelRatio||1);
  function resize(){ W=innerWidth; H=innerHeight; cvs.width=W*DPR; cvs.height=H*DPR; cvs.style.width=W+'px'; cvs.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0); }
  let resizeRAF=null; 
  const resizeHandler = debounce(() => {
    if(resizeRAF) return; 
    resizeRAF=fastRAF(()=>{ 
      resize(); 
      resizeRAF=null; 
    }); 
  }, isMobile ? 150 : 100);
  
  addEventOptimized(window, 'resize', resizeHandler);
  resize();
  function addBurst({x=W*0.5,y=H*0.3,count=100,spread=Math.PI*2,speed=5,hueBase=Math.random()*360}={}){
    // Reduce particle count for mobile performance
    const particleCount = isMobile ? Math.min(count * 0.6, 60) : count;
    for(let i=0;i<particleCount;i++){
      const a = (i/particleCount)*spread + Math.random()*0.1;
      const sp = speed*(0.6 + Math.random()*0.8);
      particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:60+Math.random()*30,hue:hueBase + (Math.random()*80-40),size:2+Math.random()*2,alpha:1});
    }
    if(!raf) raf=fastRAF(tick);
  }
  function tick(){
    ctx.clearRect(0,0,W,H);
    if(!particles.length){ raf=null; return; }
    
    // Limit particles for mobile performance
    const maxParticles = isMobile ? 100 : 200;
    if (particles.length > maxParticles) {
      particles.splice(maxParticles);
    }
    
    ctx.globalCompositeOperation='lighter';
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.vx*=FRICTION; p.vy*=FRICTION; p.vy+=GRAV; p.x+=p.vx; p.y+=p.vy; p.life--; p.alpha=Math.max(0, p.life/90);
      ctx.fillStyle=`hsla(${p.hue},100%,60%,${p.alpha})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      if(p.life<=0 || p.y>H+20) particles.splice(i,1);
    }
    raf=fastRAF(tick);
  }
  FX = { burst: (big)=> addBurst({count: big?160:100, speed: big?7:5, hueBase: Math.random()*360}) };
  return FX;
}

/* ========== BOARD LOGIC (tetap sama fungsinya) ========== */
const board = document.getElementById('board');
const btnStart = document.getElementById('btnStart');
const hint = document.getElementById('hint');
const resultBox = document.getElementById('result');
const resultMsg = document.getElementById('resultMsg');
const claimWA = document.getElementById('claimWA');
const claimTG = document.getElementById('claimTG');
const footnote = document.getElementById('footnote');

let canPick = false, busy = false, picked = false, hasSpun = false;
let chosen=null;

/* ====== SESSION COOKIE LOCK (reset kalau browser ditutup) ====== */
const Locker = {
  nameFor(k){ try{ return 'GGS_'+btoa(k).replace(/=+$/,''); }catch(e){ return 'GGS_'+encodeURIComponent(k); } },
  set(k){ try{ document.cookie = this.nameFor(k)+'=1; path=/; SameSite=Lax'; }catch(e){} }, // session cookie
  has(k){
    try{
      const name = this.nameFor(k)+'=';
      return document.cookie.split(';').some(c=>c.trim().startsWith(name));
    }catch(e){ return false; }
  }
};

/* Pip resize (di-throttle biar nggak spam reflow) */
let _pipRAF = null;
function refreshPipSize(){
  if (_pipRAF) return; _pipRAF = requestAnimationFrame(()=>{
    document.querySelectorAll('.face').forEach(face=>{
      const r = face.getBoundingClientRect();
      const unit = Math.min(r.width, r.height);
      const px = Math.max(5, Math.min(10, Math.round(unit * 0.06)));
      face.style.setProperty('--pip', px + 'px');
    });
    _pipRAF = null;
  });
}
addEventListener('resize', refreshPipSize, {passive:true});

function clearHighlights(){ document.querySelectorAll('.prize-item.highlight').forEach(el=>el.classList.remove('highlight')); }

function makeShuffle(){
  board.innerHTML = '<div class="rim"></div><div class="spinlight" aria-hidden="true"></div><div class="spinlight-ccw" aria-hidden="true"></div><div class="scan"></div>';
  const layer = document.createElement('div'); layer.className='shuffle-layer';
  const frag = document.createDocumentFragment(); board.appendChild(layer);
  const bw = board.clientWidth-46, bh = board.clientHeight-22;
  const isLite = document.documentElement.classList.contains('lite');
  const N = isLite ? 12 : 28; // lebih ringan di HP
  for(let i=0;i<N;i++){
    const c=document.createElement('div'); c.className='chip';
    c.style.left=(Math.random()*bw)+'px';
    c.style.top=(Math.random()*bh)+'px';
    c.style.animationDelay=(Math.random()*0.6).toFixed(2)+'s';
    c.style.animationDuration=(0.6+Math.random()*0.9).toFixed(2)+'s';
    frag.appendChild(c);
  } layer.appendChild(frag);
  hint.textContent = 'Mengacak kartu...';
}

function showGrid(){
  board.innerHTML = '<div class="rim"></div><div class="spinlight" aria-hidden="true"></div><div class="spinlight-ccw" aria-hidden="true"></div><div class="scan"></div>';
  const grid = document.createElement('div'); grid.className='domino-grid';
  const frag = document.createDocumentFragment();
  for(let i=0;i<28;i++) { frag.appendChild(makeBackDomino()); }
  grid.appendChild(frag); board.appendChild(grid);
  refreshPipSize();
  if (forcedPrizeObj) { hint.textContent = 'Pilih 1 kartu mana saja buka hadiah Bosku💎'; }
  else { hint.textContent = canPick ? 'PILIH 1 GAPLE' : '💡SPIN PUTAR GO GAPLE'; }
}

function makeBackDomino(){
  const root = document.createElement('div'); root.className='domino ready';
  const inner = document.createElement('div'); inner.className='inner'; root.appendChild(inner);
  const back = document.createElement('div'); back.className='back'; inner.appendChild(back);
  const face = document.createElement('div'); face.className='face'; inner.appendChild(face);
  const divv = document.createElement('div'); divv.className='divider'; face.appendChild(divv);
  const top = document.createElement('div'); top.className='half top'; face.appendChild(top);
  const bot = document.createElement('div'); bot.className='half bot'; face.appendChild(bot);
  root.addEventListener('click', ()=> onPick(root, top, bot), {passive:true});
  return root;
}

// Flag admin (sheet)
let forcedPrizeIdx = -1;
let forcedPrizeObj = null;

function onPick(cardEl, topHalf, botHalf) {
  let kartu = null;
  
  if (forcedPrizeObj) {
    picked = true; canPick = false; busy = true;
    document.querySelectorAll('.domino').forEach(n => { n.classList.remove('ready'); n.style.pointerEvents = 'none'; });
    drawHalf(topHalf, forcedPrizeObj.a);
    drawHalf(botHalf, forcedPrizeObj.b);
    cardEl.classList.add('flipped');
    cardEl.classList.add('auto-flip');
    refreshPipSize();
    kartu = forcedPrizeObj;
  } else {
    if(!canPick || busy || picked){ if(!canPick && !busy) { hint.textContent = '💡SPIN PUTAR GO GAPLE'; } return; }
    
    picked = true; canPick = false; busy = true;
    document.querySelectorAll('.domino').forEach(n=>{ n.classList.remove('ready'); n.style.pointerEvents='none'; });
    const pool = DECK.filter(t=> MEMBER_LOW_ONLY ? (!t.balak && t.total>=1 && t.total<=8) : true);
    kartu = pool[Math.floor(Math.random()*pool.length)];
    chosen = kartu;
    drawHalf(topHalf, kartu.a); drawHalf(botHalf, kartu.b);
    refreshPipSize(); cardEl.classList.add('flipped');
  }
  // === TAMPILKAN HASIL & HIGHLIGHT ===
  clearHighlights();
  let hadiahNum = 0, hadiahStr = '-', hadiahKey = '';
  if (kartu.balak) {
    hadiahKey = 'BALAK-' + kartu.a;
    switch (kartu.a) {
      case 0: hadiahNum = 100000; break;
      case 1: hadiahNum = 200000; break;
      case 2: hadiahNum = 400000; break;
      case 3: hadiahNum = 600000; break;
      case 4: hadiahNum = 800000; break;
      case 5: hadiahNum = 1000000; break;
      case 6: hadiahNum = 1200000; break;
    }
  } else {
    hadiahKey = 'TOTAL-' + (kartu.a + kartu.b);
    const hadiahMap = {
      '0-1':1000, '0-2':2000, '0-3':3000, '0-4':4000, '0-5':5000, '0-6':6000,
      '1-2':3000, '1-3':4000, '1-4':5000, '1-5':6000, '1-6':7000,
      '2-3':5000, '2-4':6000, '2-5':7000, '2-6':8000,
      '3-4':7000, '3-5':8000, '3-6':9000,
      '4-5':9000, '4-6':10000,
      '5-6':11000
    };
    const key = kartu.a + '-' + kartu.b;
    hadiahNum = hadiahMap[key] || 0;
  }
  if (hadiahNum) hadiahStr = `Rp${hadiahNum.toLocaleString('id-ID')}`;
  const el = document.querySelector('.prize-item[data-key="' + hadiahKey + '"]'); if (el) el.classList.add('highlight');
  resultMsg.innerHTML = `Selamat! Kamu mendapatkan <strong>${hadiahStr}</strong>`;
  claimWA.setAttribute('href', DEST_WA);
  claimTG.setAttribute('href', DEST_TG);
  
  // PLAY CHA-CHING SOUND UNTUK HADIAH GAPLE
  playChaChing();
  
  resultBox.classList.add('show');
  lockIfPlayed();
  busy = false;
  return;
}

/* ===== PIP LAYOUT ===== */
const POS = { TL:[0,0], TC:[1,0], TR:[2,0], CL:[0,1], CC:[1,1], CR:[2,1], BL:[0,2], BC:[1,2], BR:[2,2] };
const LAYOUTS = { 0:[], 1:['CC'], 2:['TL','BR'], 3:['TL','CC','BR'], 4:['TL','TR','BL','BR'], 5:['TL','TR','CC','BL','BR'], 6:['TL','TR','CL','CR','BL','BR'] };
function drawHalf(container, n){
  container.innerHTML='';
  const keys = LAYOUTS[n];
  for(let i=0;i<keys.length;i++){
    const key = keys[i], p=document.createElement('span'); p.className='pip';
    p.style.gridColumnStart=POS[key][0]+1; p.style.gridRowStart=POS[key][1]+1;
    container.appendChild(p);
  }
}

/* ===== UTIL ===== */
function getParamInsensitive(name, src){
  const want = name.toLowerCase();
  const p = src || new URLSearchParams(location.search);
  for(const [k,v] of p.entries()){ if(k.toLowerCase() === want) return v; }
  return null;
}
function getCoupon(){
  let c =
    getParamInsensitive('kupon')      || getParamInsensitive('coupon')   ||
    getParamInsensitive('kupon_id')   || getParamInsensitive('coupon_id')||
    getParamInsensitive('code');
  if(!c && location.hash){
    const h = new URLSearchParams(location.hash.slice(1));
    c = getParamInsensitive('kupon',h) || getParamInsensitive('coupon',h) ||
        getParamInsensitive('kupon_id',h) || getParamInsensitive('coupon_id',h) ||
        getParamInsensitive('code',h);
  }
  return (c || '').trim();
}
const COUPON = getCoupon();
function getPlayKey(){ return COUPON ? ('GO_GAPLE_PLAYED:' + COUPON.toUpperCase()) : 'GO_GAPLE_PLAYED:DEFAULT'; }

/* ===== LOCK HELPERS ===== */
function isPlayed(){ return Locker.has(getPlayKey()); }
function lockIfPlayed(){
  const s = JSON.parse(localStorage.getItem('tm_session')||'null');
  function isClaimed(kupon) { if (!kupon) return false; return localStorage.getItem('tm_claimed_'+kupon) === '1'; }
  if(isPlayed() || isClaimed(s?.kupon) || hasSpun){
    btnStart.disabled = true;
    btnStart.textContent = '🚫 SUDAH DIGUNAKAN';
    btnStart.style.filter = 'grayscale(0.7) brightness(0.9)';
    btnStart.style.background = 'linear-gradient(to right, #6b7280, #9ca3af)';
    btnStart.style.cursor = 'not-allowed';
    hint.textContent = 'CLAIM SCROOL KEBEWAH BOSKU 👇';
    hasSpun = true; // Set flag hasSpun
    return true;
  }
  btnStart.disabled = false;
  btnStart.textContent = 'PUTAR GO GAPLE';
  btnStart.style.filter = '';
  btnStart.style.background = '';
  btnStart.style.cursor = '';
  hint.textContent = '💡SPIN PUTAR GO GAPLE';
  return false;
}
function setPlayedOnce(){ Locker.set(getPlayKey()); }

/* ===== START BUTTON ===== */
const btnStartHandler = ()=>{
  if(busy || hasSpun) return; // Cegah jika sudah pernah spin
  if(isPlayed()) { lockIfPlayed(); return; }

  // MULAI SUARA BEEP BEEP UNTUK GAPLE SPIN
  startBeepSound();

  picked = false;
  resultBox.classList.remove('show');
  clearHighlights();

  canPick = false; busy = true; hasSpun = true; // Set flag hasSpun ke true
  btnStart.disabled=true;
  
  // Disable tombol dan ubah tampilannya
  btnStart.textContent = '⚡ MEMUTAR...';
  btnStart.style.background = 'linear-gradient(to right, #6b7280, #9ca3af)';
  btnStart.style.cursor = 'not-allowed';
  
  hint.textContent='Mengacak kartu...';
  makeShuffle();

  const s = JSON.parse(localStorage.getItem('tm_session')||'null');
  function setClaimed(kupon) { if (!kupon) return; localStorage.setItem('tm_claimed_'+kupon, '1'); }
  function isClaimed(kupon) { if (!kupon) return false; return localStorage.getItem('tm_claimed_'+kupon) === '1'; }
  if (!s?.userId || !s?.kupon) {
    setTimeout(()=>{
      resultMsg.innerHTML = 'Session tidak valid. Silakan login ulang.';
      resultBox.classList.add('show');
      hasSpun = true; // Set flag hasSpun
      lockIfPlayed();
      busy = false;
      btnStart.disabled = false;
    }, 800);
    return;
  }
  if (isClaimed(s.kupon)) {
    setTimeout(()=>{
      resultMsg.innerHTML = 'Kupon sudah pernah dipakai⛔';
      resultBox.classList.add('show');
      hasSpun = true; // Set flag hasSpun
      lockIfPlayed();
      busy = false;
      btnStart.disabled = false;
    }, 800);
    return;
  }
  const apiUrl = 'https://script.google.com/macros/s/AKfycbyRl2BqiDPw75fQ-XYyL87eKDwHMr61eY0Cg7ra1vc36OMOFZ3IRY_QeZcLFDzFFM88/exec';
  const url = `${apiUrl}?action=catat&userid=${encodeURIComponent(s.userId)}&kupon=${encodeURIComponent(s.kupon)}&site=BELEGENDBET`;
  fetch(url, { cache:'no-store' })
    .then(async res => {
      let data; try { data = await res.json(); } catch(e) { data = {success:false, msg:'Response bukan JSON'}; }
      if (data.success) {
        function getPrizeForCard(t) {
          if (t.balak) {
            switch (t.a) {
              case 0: return 100000; case 1: return 200000; case 2: return 400000; case 3: return 600000; case 4: return 800000; case 5: return 1000000; case 6: return 1200000;
            }
          } else {
            const hadiahMap = { '0-1':1000,'0-2':2000,'0-3':3000,'0-4':4000,'0-5':5000,'0-6':6000,
              '1-2':3000,'1-3':4000,'1-4':5000,'1-5':6000,'1-6':7000,
              '2-3':5000,'2-4':6000,'2-5':7000,'2-6':8000,
              '3-4':7000,'3-5':8000,'3-6':9000,
              '4-5':9000,'4-6':10000,
              '5-6':11000 };
            const key = t.a + '-' + t.b; return hadiahMap[key] || 0;
          }
        }
        const hadiahNum = Number(data.hadiah);
        let matchIdx = -1; let match = null;
        for (let i = 0; i < DECK.length; i++) { const t = DECK[i]; if (getPrizeForCard(t) === hadiahNum) { matchIdx = i; match = t; break; } }
        if (matchIdx !== -1) { forcedPrizeIdx = matchIdx; forcedPrizeObj = match; } else { forcedPrizeIdx = -1; forcedPrizeObj = null; }
        setClaimed(s.kupon);
        hasSpun = true; // Pastikan flag hasSpun diset
        lockIfPlayed();
      } else {
        forcedPrizeIdx = -1; forcedPrizeObj = null;
        resultMsg.innerHTML = data.msg || 'Gagal mencatat hadiah!';
        resultBox.classList.add('show');
        hasSpun = true; // Set flag hasSpun walaupun gagal
        lockIfPlayed();
      }
      setTimeout(()=>{
        // STOP SUARA BEEP SETELAH SHUFFLE SELESAI
        stopBeepSound();
        
        showGrid();
        // Jangan enable tombol lagi jika sudah spin
        if (!hasSpun) {
          btnStart.disabled=false;
        }
        canPick = true;
        busy = false;
        if (forcedPrizeIdx !== -1) hint.textContent = 'PILIH 1 GAPLE DAPATKAN HADIAH🕊️'; else hint.textContent = 'PILIH 1 GAPLE';
      }, 800);
    })
    .catch(() => {
      forcedPrizeIdx = -1; forcedPrizeObj = null;
      setTimeout(()=>{
        resultMsg.innerHTML = 'Gagal menghubungi server. Coba lagi.';
        resultBox.classList.add('show');
        hasSpun = true; // Set flag hasSpun saat error
        lockIfPlayed();
        busy = false;
        btnStart.disabled = false;
      }, 800);
    });
};
btnStart.addEventListener('click', btnStartHandler, {passive:true});

/* ===== INIT ===== */
(function init(){
  const idle = window.requestIdleCallback || function(cb){ return setTimeout(cb,1); };
  idle(()=>{ showGrid(); refreshPipSize(); });
  // Cek kupon ke API saat buka halaman (lebih singkat timeoutnya)
  const s = JSON.parse(localStorage.getItem('tm_session')||'null');
  function setClaimed(kupon) { if (!kupon) return; localStorage.setItem('tm_claimed_'+kupon, '1'); }
  function isClaimed(kupon) { if (!kupon) return false; return localStorage.getItem('tm_claimed_'+kupon) === '1'; }
  if (isClaimed(s?.kupon)) {
    hasSpun = true; // Set flag hasSpun
    lockIfPlayed();
    resultMsg.innerHTML = 'Kupon sudah pernah dipakai⛔';
    resultBox.classList.add('show');
  } else if (s?.userId && s?.kupon) {
    const apiUrl = 'https://script.google.com/macros/s/AKfycbyRl2BqiDPw75fQ-XYyL87eKDwHMr61eY0Cg7ra1vc36OMOFZ3IRY_QeZcLFDzFFM88/exec';
    fetch(`${apiUrl}?action=claim&userid=${encodeURIComponent(s.userId)}&kupon=${encodeURIComponent(s.kupon)}&site=BELEGENDBET`, { cache:'no-store' })
      .then(res=>res.json())
      .then(data=>{
        if (data.msg && data.msg.toLowerCase().includes('terpakai')) {
          hasSpun = true; // Set flag hasSpun
          lockIfPlayed();
          resultMsg.innerHTML = 'Kupon sudah pernah dipakai⛔';
          resultBox.classList.add('show');
          setClaimed(s.kupon);
        }
      }).catch(()=>{});
  }
})();

/* ==== SISTEM AUDIO - 3 SUARA GAPLE ==== */
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

// 1. SUARA BEEP BEEP untuk TOMBOL PUTAR GO GAPLE
function createBeepSound() {
  try {
    const ctx = getCtx();
    if (!ctx) return null;
    
    // Buat oscillator untuk suara beep
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    
    osc1.type = 'square';
    osc1.frequency.value = 800; // High frequency beep
    
    osc2.type = 'sine';
    osc2.frequency.value = 600; // Lower harmonic
    
    // Gain untuk masing-masing oscillator
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const masterGain = ctx.createGain();
    
    gain1.gain.value = 0.4;
    gain2.gain.value = 0.2;
    masterGain.gain.value = 0;
    
    // High-pass filter untuk suara beep yang crisp
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 400;
    filter.Q.value = 2;
    
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
    console.error('Error creating beep sound:', e);
    return null;
  }
}

function startBeepSound() {
  if (isBeepPlaying) return;
  
  try {
    const ctx = getCtx();
    console.log('Starting beep beep sound for gaple spin...');
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    isBeepPlaying = true;
    
    // Buat pattern beep-beep berulang
    let beepCount = 0;
    const maxBeeps = 8; // Total beep selama shuffle
    
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
        
        // Beep pattern: on 0.1s, off 0.1s
        beepSound.gain.gain.setValueAtTime(0, currentTime);
        beepSound.gain.gain.linearRampToValueAtTime(0.6, currentTime + 0.01);
        beepSound.gain.gain.linearRampToValueAtTime(0.6, currentTime + 0.08);
        beepSound.gain.gain.linearRampToValueAtTime(0, currentTime + 0.1);
        
        // Stop after beep duration
        setTimeout(() => {
          try {
            if (beepSound) {
              beepSound.osc1.stop();
              beepSound.osc2.stop();
            }
          } catch (e) {
            console.warn('Beep oscillators already stopped:', e);
          }
        }, 120);
        
        beepCount++;
        
        // Schedule next beep
        setTimeout(createSingleBeep, 200);
      }
    };
    
    createSingleBeep();
  } catch (e) {
    console.error('Error starting beep sound:', e);
    isBeepPlaying = false;
  }
}

function stopBeepSound() {
  isBeepPlaying = false;
  console.log('Stopping beep sound...');
}

// 2. SUARA CHA-CHING untuk HADIAH GAPLE
function playChaChing(){
  try {
    const ctx = getCtx(); 
    const t0 = ctx.currentTime + 0.02;
    
    const o1 = ctx.createOscillator(); 
    o1.type='triangle'; 
    const g1 = ctx.createGain(); 
    g1.gain.setValueAtTime(0.0001, t0); 
    g1.gain.exponentialRampToValueAtTime(0.7, t0+0.02); 
    g1.gain.exponentialRampToValueAtTime(0.0001, t0+0.7); 
    o1.frequency.setValueAtTime(1100, t0); 
    o1.frequency.exponentialRampToValueAtTime(1600, t0+0.08);
    
    const o2 = ctx.createOscillator(); 
    o2.type='square';   
    const g2 = ctx.createGain(); 
    g2.gain.setValueAtTime(0.0001, t0); 
    g2.gain.exponentialRampToValueAtTime(0.35, t0+0.02); 
    g2.gain.exponentialRampToValueAtTime(0.0001, t0+0.55); 
    o2.frequency.setValueAtTime(660, t0);  
    o2.frequency.exponentialRampToValueAtTime(990, t0+0.06);
    
    const nDur=0.09; 
    const b = ctx.createBuffer(1, ctx.sampleRate*nDur, ctx.sampleRate); 
    const d=b.getChannelData(0); 
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    
    const n = ctx.createBufferSource(); 
    n.buffer=b; 
    const ng=ctx.createGain(); 
    ng.gain.setValueAtTime(0.4, t0); 
    ng.gain.exponentialRampToValueAtTime(0.0001, t0+nDur);
    
    o1.connect(g1).connect(ctx.destination); 
    o2.connect(g2).connect(ctx.destination); 
    n.connect(ng).connect(ctx.destination);
    
    o1.start(t0); 
    o2.start(t0+0.02); 
    n.start(t0); 
    o1.stop(t0+0.7); 
    o2.stop(t0+0.55); 
    n.stop(t0+nDur);
    
    console.log('Playing cha-ching sound for gaple prize');
  } catch (e) {
    console.warn('Error playing cha-ching sound:', e);
  }
}

// Cleanup suara saat halaman ditutup atau kehilangan focus
window.addEventListener('beforeunload', () => {
  stopBeepSound();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopBeepSound();
  }
});

// ===== ANDROID PERFORMANCE CLEANUP & MEMORY MANAGEMENT =====
// Pause animations when page becomes hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Stop all ongoing animations and timers
    const animatedElements = document.querySelectorAll('.gaple-board .spinlight, .gaple-board .spinlight-ccw');
    animatedElements.forEach(el => {
      el.style.animationPlayState = 'paused';
    });
    
    // Clear DOM cache more frequently when hidden
    if (domCache.size > 10) {
      domCache.clear();
    }
  } else {
    // Resume animations when visible
    const animatedElements = document.querySelectorAll('.gaple-board .spinlight, .gaple-board .spinlight-ccw');
    animatedElements.forEach(el => {
      el.style.animationPlayState = 'running';
    });
  }
});

// Memory cleanup on page unload
window.addEventListener('beforeunload', () => {
  domCache.clear();
  if (typeof cleanupInterval !== 'undefined') clearInterval(cleanupInterval);
});

// Low memory warning handler for Android
if ('memory' in performance && performance.memory) {
  const checkMemory = () => {
    if (performance.memory.usedJSHeapSize > performance.memory.jsHeapSizeLimit * 0.8) {
      domCache.clear();
      // Force garbage collection if available
      if (window.gc) window.gc();
    }
  };
  
  setInterval(checkMemory, isMobile ? 10000 : 30000);
}
