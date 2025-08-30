/* ==== OPTIMASI PERFORMA ANDROID SUPER NGEBUT ==== */
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  console.log = console.warn = console.error = () => {};
}

/* Pooling partikel (dipertahankan) */
const particlePool = []; const maxPoolSize = 100;
const getParticle = () => particlePool.pop() || { x:0,y:0,vx:0,vy:0,life:1,opacity:1 };
const returnParticle = (p) => { if (particlePool.length < maxPoolSize) particlePool.push(p); };

/* Queue anim pintu (dipertahankan) */
const doorAnimQueue = []; let doorAnimRunning = false;
const runDoorAnimations = () => {
  if (!doorAnimQueue.length){ doorAnimRunning = false; return; }
  doorAnimRunning = true;
  requestAnimationFrame(() => { const anim = doorAnimQueue.shift(); if (anim) anim(); runDoorAnimations(); });
};
const queueDoorAnimation = fn => { doorAnimQueue.push(fn); if (!doorAnimRunning) runDoorAnimations(); };

/* Touch optimized */
const optimizedTouch = (el, handler) => {
  if (!el) return; const opt = { passive:true, capture:false };
  el.addEventListener('touchstart', handler, opt); el.addEventListener('click', handler, opt);
};

/* ==== ORIGINAL SCRIPT START (logic tidak diubah) ==== */
'use strict';
try{ if (window.__GEDOR_CTRL) window.__GEDOR_CTRL.abort(); }catch(e){}
const __CTRL = new AbortController(); window.__GEDOR_CTRL = __CTRL;

const doorsContainer = document.querySelector('.doors');
const doors = [...document.querySelectorAll('.door')];
const ctaSpin = document.getElementById('cta-spin');
const toast = document.getElementById('toast');
const modal = document.getElementById('winModal');
const modalTitle = document.getElementById('modalTitle');
const prizeListTableBody = document.getElementById('prizeListTableBody');
const winMessageEl = document.getElementById('winMessage');
const claimBtn = document.getElementById('claimBtn');
const joinTgBtn = document.getElementById('joinTgBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const btnCloseModal = document.getElementById('btnCloseModal');
const DOOR_COUNT = doors.length;

let selectEnabled = false, spinActive = false, gameLocked = false;

const prizes = [
  { amount: "Rp 5.000.000" }, { amount: "Rp 1.000.000" }, { amount: "Rp 100.000" },
  { amount: "Rp 20.000" }, { amount: "Rp 10.000" }, { amount: "Rp 8.000" },
  { amount: "Rp 5.000" }, { amount: "Rp 3.000" }, { amount: "Rp 2.000" }
];
const ALLOWED_AMOUNTS = ['Rp 10.000','Rp 8.000','Rp 5.000','Rp 3.000','Rp 2.000'];
const allowedSet = new Set(ALLOWED_AMOUNTS);
const portalThemes = ['blue','magenta','lime','blue','magenta','lime'];

const doorPrize = new WeakMap();

const wait = (ms)=> new Promise(r=>setTimeout(r, ms));
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function assignPrizesToDoors(){ const pick = shuffle([...prizes]).slice(0, DOOR_COUNT); doors.forEach((d,i)=> doorPrize.set(d, pick[i])); }
function coerceAllowed(p){ if(!p || typeof p.amount!=='string' || !allowedSet.has(p.amount)){ return { amount: ALLOWED_AMOUNTS[Math.floor(Math.random()*ALLOWED_AMOUNTS.length)] }; } return p; }
function showToast(msg){ toast.textContent = msg; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t = setTimeout(() => toast.classList.remove('show'), 1500); }

const SPIN_KEY = (()=>{ 
  try{ const s = JSON.parse(localStorage.getItem('tm_session')||'null'); const uid = s?.userId || 'anon'; const kpn = s?.kupon || 'global'; return `tm_spinlock:${uid}:${kpn}`; }
  catch(_){ return 'tm_spinlock:global'; }
})();
function hasPlayed(){ try{ return localStorage.getItem(SPIN_KEY)==='1'; }catch(_){ return false; } }
function markPlayed(){ try{ localStorage.setItem(SPIN_KEY,'1'); }catch(_){ } }

function startGame(){
  if (hasPlayed()){
    lockGame();
    if (modal){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); }
    showToast('Kupon sudah digunakan.');
    return;
  }
  stopCoinDropSound();
  gameLocked=false; selectEnabled=false; spinActive=false;
  assignPrizesToDoors();
  doors.forEach(d=>{
    d.classList.remove('open','highlight','is-picked','fly');
    d.style.transition=''; d.style.transform='';
    const inside = d.querySelector('.inside');
    inside.className='inside'; inside.innerHTML='';
    inside.removeAttribute('data-theme'); inside.removeAttribute('data-state');
    d.style.pointerEvents='auto';
  });
  ctaSpin.style.display='inline-flex';
  ctaSpin.setAttribute('aria-disabled','false');
  if (playAgainBtn) playAgainBtn.style.display='none';
}
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', startGame, {once:true, signal: __CTRL.signal});
} else startGame();

doors.forEach((door)=>{
  door.addEventListener('click', ()=>{
    if(!selectEnabled || gameLocked){ if(!spinActive) showToast('Tekan SPIN dulu'); return; }
    handleDoorEl(door);
  }, {signal: __CTRL.signal});
});
ctaSpin.addEventListener('click', (e)=>{ e.preventDefault(); startSpinShuffle(); }, {signal: __CTRL.signal});

async function startSpinShuffle(){
  if(spinActive || gameLocked) return;
  initAudioOnInteraction();
  markPlayed();
  spinActive = true; selectEnabled = false;
  ctaSpin.setAttribute('aria-disabled','true');
  startCoinDropSound();

  const cycles = 12;
  for (let c = 0; c < cycles; c++){
    const t = c / (cycles - 1);
    const dur = Math.round(70 + t*150);
    await flipOnce(dur, t);
    await wait(10 + t*40);
  }

  stopCoinDropSound();
  spinActive = false; selectEnabled = true;
  ctaSpin.style.display='none';
  ctaSpin.setAttribute('aria-disabled','true');
  showToast('Pilih 1 pintu');
}

async function flipOnce(duration, t){
  const first = new Map(); doors.forEach(d=> first.set(d, d.getBoundingClientRect()));
  const order = [...doors]; for(let i=order.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; }
  order.forEach(d=> doorsContainer.appendChild(d));
  const last = new Map(); doors.forEach(d=> last.set(d, d.getBoundingClientRect()));
  doors.forEach(d=>{
    const a = first.get(d), b = last.get(d);
    const dx = a.left - b.left; const dy = a.top - b.top;
    const baseTurns = 3 - 2*t;
    const turns = Math.max(1, Math.round(baseTurns + Math.random()*0.6));
    const dir = Math.random()<.5 ? -1 : 1;
    const tilt = (Math.random()*10 - 5).toFixed(2);
    d.classList.add('fly');
    d.style.willChange='transform';
    d.style.transition = `transform ${duration}ms cubic-bezier(.2,.85,.25,1)`;
    d.style.transform = `translate(${dx}px, ${dy}px) rotate(${tilt}deg) scale(.96)`;
    void doorsContainer.offsetWidth;
    const endRotate = dir * turns * 360;
    d.style.transform = `translate(0,0) rotate(${endRotate}deg) scale(1)`;
  });
  await wait(duration + 30);
  doors.forEach(d=>{ d.classList.remove('fly'); d.style.transition=''; d.style.transform=''; d.style.willChange=''; });
}

async function fetchServerPrize(){
  const s = JSON.parse(localStorage.getItem('tm_session')||'null');
  if (!s?.userId || !s?.kupon) return { ok:false, msg:'Session tidak valid. Silakan login ulang.' };

  function setClaimed(kupon){ if(!kupon) return; localStorage.setItem('tm_claimed_'+kupon, '1'); }
  function isClaimed(kupon){ if(!kupon) return false; return localStorage.getItem('tm_claimed_'+kupon) === '1'; }
  if (isClaimed(s.kupon)) return { ok:false, msg:'Kupon sudah pernah dipakai!' };

  const apiUrl = 'https://script.google.com/macros/s/AKfycbyRl2BqiDPw75fQ-XYyL87eKDwHMr61eY0Cg7ra1vc36OMOFZ3IRY_QeZcLFDzFFM88/exec';
  try{
    const res = await fetch(`${apiUrl}?action=catat&userid=${encodeURIComponent(s.userId)}&kupon=${encodeURIComponent(s.kupon)}&site=BELEGENDBET`);
    const data = await res.json().catch(()=>({success:false, msg:'Response bukan JSON'}));
    if (data.success){
      const hadiahNum = Number(data.hadiah);
      const hadiahStr = hadiahNum ? `Rp ${hadiahNum.toLocaleString('id-ID')}` : '-';
      setClaimed(s.kupon);
      return { ok:true, hadiahNum, hadiahStr };
    }
    return { ok:false, msg:data.msg || 'Gagal mencatat hadiah!' };
  }catch{
    return { ok:false, msg:'Gagal menghubungi server. Coba lagi.' };
  }
}

function renderOpenDoors(selectedDoor, hadiahNum, hadiahStr){
  doors.forEach((d,i)=>{
    d.classList.add('open'); d.style.pointerEvents='none';
    const inside = d.querySelector('.inside');
    let amountStr, type;
    if (d===selectedDoor){
      amountStr = hadiahStr;
      type = hadiahNum >= 1000000 ? 'diamond' : (hadiahNum <= 3000 ? 'coin' : 'star');
    } else {
      const chosen = doorPrize.get(d);
      amountStr = chosen?.amount || 'Rp 0';
      if (amountStr.includes('1.000.000') || amountStr.includes('5.000.000')) type='diamond';
      else if (amountStr.includes('2.000')) type='coin';
      else type='star';
    }
    inside.classList.add('portal','skin-panel');
    inside.setAttribute('data-theme', portalThemes[i % portalThemes.length]);
    inside.setAttribute('data-state', d===selectedDoor ? 'selected' : 'showcase');
    inside.innerHTML = `
      <div class="panel-bg"></div>
      <div class="prize-card">
        ${getPrizeSVG(type)}
        <div class="prize-label">${amountStr}</div>
      </div>
    `;
    if(d===selectedDoor) d.classList.add('is-picked'); else d.classList.remove('is-picked');
  });
}

async function handleDoorEl(selectedDoor){
  if(gameLocked) return;
  gameLocked = true; selectEnabled = false;
  ctaSpin.style.display='none';
  window._lastSelectedDoor = selectedDoor;

  try{ playWhoosh(()=>{}); }catch(_){}
  const result = await fetchServerPrize();
  if (!result.ok){
    showToast(result.msg || 'Gagal mengambil hadiah.');
    lockGame(); modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
    return;
  }

  const {hadiahNum, hadiahStr} = result;
  renderOpenDoors(selectedDoor, hadiahNum, hadiahStr);

  setTimeout(()=>{
    try{ playChaChing(); }catch(_){}
    modalTitle.textContent = "Anda Mendapat Hadiah";
    winMessageEl.textContent = `🎉Selamat Bosku mendapatkan ${hadiahStr}`;
    const rows = prizes.map((p,i)=>{
      const pNum = Number((p.amount||'').replace(/[^\d]/g, ''));
      const cls = (pNum===hadiahNum) ? ' style="background:#a6ffff;color:#0a0d25;font-weight:900;"' : '';
      return `<tr${cls}><td style="padding:10px 16px;border-bottom:1px solid #23194a;">${i+1}</td><td style="padding:10px 16px;border-bottom:1px solid #23194a;">${p.amount}</td></tr>`;
    }).join('');
    prizeListTableBody.innerHTML = rows;
    showToast('Hadiah sudah dicatat!');
    lockGame(); modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
  }, 400);
}

(function(){
  const s = JSON.parse(localStorage.getItem('tm_session')||'null');
  function setClaimed(kupon){ if(!kupon) return; localStorage.setItem('tm_claimed_'+kupon, '1'); }
  function isClaimed(kupon){ if(!kupon) return false; return localStorage.getItem('tm_claimed_'+kupon) === '1'; }
  function lockGame(){ doors.forEach(d=>d.style.pointerEvents='none'); if (ctaSpin){ ctaSpin.setAttribute('aria-disabled','true'); ctaSpin.style.display='none'; } if (playAgainBtn) playAgainBtn.style.display='none'; }
  if (isClaimed(s?.kupon)){ lockGame(); showToast('Kupon sudah pernah dipakai!'); }
  else if (s?.userId && s?.kupon){
    const apiUrl = 'https://script.google.com/macros/s/AKfycbyRl2BqiDPw75fQ-XYyL87eKDwHMr61eY0Cg7ra1vc36OMOFZ3IRY_QeZcLFDzFFM88/exec';
    fetch(`${apiUrl}?action=claim&userid=${encodeURIComponent(s.userId)}&kupon=${encodeURIComponent(s.kupon)}&site=BELEGENDBET`)
      .then(res=>res.json())
      .then(data=>{
        if (data.msg && data.msg.toLowerCase().includes('terpakai')){
          lockGame(); showToast('Kupon sudah pernah dipakai!'); setClaimed(s.kupon);
        }
      });
  }
})();

function lockGame(){ doors.forEach(d=>d.style.pointerEvents='none'); if (ctaSpin){ ctaSpin.setAttribute('aria-disabled','true'); ctaSpin.style.display='none'; } if (playAgainBtn) playAgainBtn.style.display='none'; stopCoinDropSound(); }

function getPrizeSVG(type){
  switch(type){
    case 'diamond': return `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-label="Diamond"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#9be9ff"/><stop offset="100%" stop-color="#49c9ff"/></linearGradient></defs><polygon points="12,32 32,12 64,12 84,32 48,84" fill="url(#g1)" stroke="#1aa3e6" stroke-width="3"/></svg>`;
    case 'coin':    return `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-label="Coin"><defs><radialGradient id="g3" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#fff3a6"/><stop offset="100%" stop-color="#f2b705"/></radialGradient></defs><ellipse cx="48" cy="48" rx="34" ry="28" fill="url(#g3)" stroke="#b58100" stroke-width="3"/></svg>`;
    default:        return `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-label="Star"><polygon points="48,8 58,36 88,36 62,54 72,84 48,66 24,84 34,54 8,36 38,36" fill="#ffd24f" stroke="#b58100" stroke-width="3"/></svg>`;
  }
}

/* ==== Audio ringan (dipertahankan) ==== */
let audioCtx; let tractorSound = null; let isTractorPlaying = false;
function getCtx(){
  if(!audioCtx){
    try{ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e){ return null; }
  }
  if(audioCtx.state === 'suspended'){ audioCtx.resume().catch(()=>{}); }
  return audioCtx;
}
let audioInitialized = false;
function initAudioOnInteraction(){ if (audioInitialized) return; audioInitialized = true; try{ getCtx(); }catch(_){} }
window.addEventListener('pointerdown', initAudioOnInteraction, {once:true, passive:true, signal: __CTRL.signal});
window.addEventListener('click', initAudioOnInteraction, {once:true, passive:true, signal: __CTRL.signal});
window.addEventListener('touchstart', initAudioOnInteraction, {once:true, passive:true, signal: __CTRL.signal});

function createCoinDropNoise(){
  try{
    const ctx = getCtx(); if (!ctx) return null;
    
    // Buat oscillator untuk suara pecahan koin jatuh yang realistis
    const osc1 = ctx.createOscillator(); // Metallic ping utama
    const osc2 = ctx.createOscillator(); // Harmoni metalik
    const osc3 = ctx.createOscillator(); // Rolling coins
    const osc4 = ctx.createOscillator(); // High frequency sparkle
    
    // Frekuensi untuk suara koin yang jatuh dan berserakan
    osc1.type='sine'; osc1.frequency.value=800;   // Ping utama koin
    osc2.type='triangle'; osc2.frequency.value=1200; // Harmoni metalik
    osc3.type='sawtooth'; osc3.frequency.value=400;  // Rolling coins
    osc4.type='sine'; osc4.frequency.value=2400;     // High sparkle
    
    const gain1=ctx.createGain(), gain2=ctx.createGain(), gain3=ctx.createGain(), gain4=ctx.createGain(), masterGain=ctx.createGain();
    gain1.gain.value=0.8; // Ping utama keras
    gain2.gain.value=0.6; // Harmoni medium
    gain3.gain.value=0.4; // Rolling subtle
    gain4.gain.value=0.3; // Sparkle accent
    masterGain.gain.value=0;
    
    // Band-pass filter untuk suara metalik koin yang realistis
    const filter=ctx.createBiquadFilter(); 
    filter.type='bandpass'; 
    filter.frequency.value=900; // Sweet spot untuk suara koin
    filter.Q.value=6; // Q sedang untuk resonansi koin
    
    // Delay untuk efek echo seperti koin jatuh di lantai
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.08; // Echo pendek untuk ruang
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0.25;
    
    // Reverb kecil untuk efek ruang
    const delay2 = ctx.createDelay();
    delay2.delayTime.value = 0.15;
    const delayGain2 = ctx.createGain();
    delayGain2.gain.value = 0.15;
    
    // Connection dengan multiple delays untuk efek koin berserakan
    osc1.connect(gain1); osc2.connect(gain2); osc3.connect(gain3); osc4.connect(gain4);
    gain1.connect(filter); gain2.connect(filter); gain3.connect(filter); gain4.connect(filter);
    
    filter.connect(masterGain);
    filter.connect(delay); delay.connect(delayGain); delayGain.connect(masterGain);
    filter.connect(delay2); delay2.connect(delayGain2); delayGain2.connect(masterGain);
    
    masterGain.connect(ctx.destination);
    
    return {osc1,osc2,osc3,osc4,gain:masterGain,filter,gain1,gain2,gain3,gain4,delay,delayGain,delay2,delayGain2};
  }catch(e){ return null; }
}

function startCoinDropSound(){
  if (isTractorPlaying) return;
  try{
    const ctx = getCtx(); if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    console.log('Starting suara pecahan koin jatuh yang bagus untuk spin...');
    
    isTractorPlaying = true; tractorSound = createCoinDropNoise();
    if (tractorSound){
      // Start semua oscillators
      tractorSound.osc1.start(); 
      tractorSound.osc2.start(); 
      tractorSound.osc3.start();
      tractorSound.osc4.start();
      
      const t = ctx.currentTime; 
      tractorSound.gain.gain.setValueAtTime(0, t); 
      tractorSound.gain.gain.exponentialRampToValueAtTime(0.9, t+0.05); // Volume sedang untuk natural
      
      let modulationInterval;
      const simulateCoinDrop = ()=>{
        if (!isTractorPlaying || !tractorSound){ if (modulationInterval) clearInterval(modulationInterval); return; }
        
        // Simulasi koin jatuh dengan pattern yang bervariasi
        const dropType = Math.random();
        
        if (dropType < 0.4) {
          // Single coin drop dengan ping
          const pingFreq = 700 + Math.random()*400; // 700-1100 Hz
          const harmonyFreq = pingFreq * 1.5;
          const sparkleFreq = pingFreq * 3;
          
          tractorSound.osc1.frequency.setValueAtTime(pingFreq, ctx.currentTime);
          tractorSound.osc2.frequency.setValueAtTime(harmonyFreq, ctx.currentTime);
          tractorSound.osc4.frequency.setValueAtTime(sparkleFreq, ctx.currentTime);
          
          // Quick attack dan decay untuk ping koin
          const vol = 0.7 + Math.random()*0.3;
          tractorSound.gain.gain.setValueAtTime(vol, ctx.currentTime);
          tractorSound.gain.gain.exponentialRampToValueAtTime(vol * 0.3, ctx.currentTime + 0.2);
          
        } else if (dropType < 0.7) {
          // Multiple coins dropping (cascade)
          const baseFreq = 600 + Math.random()*300; // 600-900 Hz
          tractorSound.osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
          tractorSound.osc2.frequency.setValueAtTime(baseFreq * 1.3, ctx.currentTime);
          tractorSound.osc3.frequency.setValueAtTime(baseFreq * 0.7, ctx.currentTime); // Rolling
          
          const vol = 0.8 + Math.random()*0.4; // 0.8-1.2
          tractorSound.gain.gain.setValueAtTime(vol, ctx.currentTime);
          tractorSound.gain.gain.exponentialRampToValueAtTime(vol * 0.5, ctx.currentTime + 0.3);
          
        } else {
          // Coins rolling dan settling
          const rollFreq = 300 + Math.random()*200; // 300-500 Hz
          const pingFreq = 800 + Math.random()*600; // 800-1400 Hz
          
          tractorSound.osc3.frequency.setValueAtTime(rollFreq, ctx.currentTime);
          tractorSound.osc1.frequency.setValueAtTime(pingFreq, ctx.currentTime);
          tractorSound.osc2.frequency.setValueAtTime(pingFreq * 1.2, ctx.currentTime);
          
          const vol = 0.6 + Math.random()*0.3;
          tractorSound.gain.gain.setValueAtTime(vol, ctx.currentTime);
          tractorSound.gain.gain.exponentialRampToValueAtTime(vol * 0.4, ctx.currentTime + 0.4);
        }
        
        // Filter modulation untuk efek metalik yang berubah
        const filterFreq = 700 + Math.random()*600; // 700-1300 Hz
        tractorSound.filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
        tractorSound.filter.Q.setValueAtTime(4 + Math.random()*4, ctx.currentTime); // Q 4-8
      };
      
      simulateCoinDrop(); 
      // Interval sedang untuk efek koin jatuh yang natural
      modulationInterval = setInterval(simulateCoinDrop, 150 + Math.random()*100); // 150-250ms
      tractorSound.modulationInterval = modulationInterval;
    } else { isTractorPlaying = false; }
  }catch(e){ isTractorPlaying=false; }
}

function stopCoinDropSound(){
  if (!isTractorPlaying || !tractorSound) return;
  try{
    console.log('Stopping suara pecahan koin jatuh...');
    const ctx = getCtx();
    if (tractorSound.modulationInterval) clearInterval(tractorSound.modulationInterval);
    
    // Final cascade koin jatuh sebelum stop - sangat dramatis dan bagus
    const currentTime = ctx.currentTime;
    
    // Cascade finale - koin besar jatuh berturut-turut
    // Drop pertama - koin besar
    tractorSound.osc1.frequency.setValueAtTime(600, currentTime);
    tractorSound.osc2.frequency.setValueAtTime(900, currentTime);
    tractorSound.gain.gain.setValueAtTime(1.0, currentTime);
    tractorSound.gain.gain.exponentialRampToValueAtTime(0.4, currentTime + 0.15);
    
    // Drop kedua - koin sedang (setelah 0.1s)
    tractorSound.osc1.frequency.setValueAtTime(800, currentTime + 0.1);
    tractorSound.osc2.frequency.setValueAtTime(1200, currentTime + 0.1);
    tractorSound.gain.gain.exponentialRampToValueAtTime(0.8, currentTime + 0.12);
    tractorSound.gain.gain.exponentialRampToValueAtTime(0.3, currentTime + 0.25);
    
    // Drop ketiga - koin kecil dengan sparkle (setelah 0.2s)
    tractorSound.osc1.frequency.setValueAtTime(1000, currentTime + 0.2);
    tractorSound.osc4.frequency.setValueAtTime(2500, currentTime + 0.2); // High sparkle
    tractorSound.gain.gain.exponentialRampToValueAtTime(0.6, currentTime + 0.22);
    tractorSound.gain.gain.exponentialRampToValueAtTime(0.1, currentTime + 0.35);
    
    // Final settling - coins rolling dan berhenti
    tractorSound.osc3.frequency.setValueAtTime(350, currentTime + 0.3);
    tractorSound.gain.gain.exponentialRampToValueAtTime(0.4, currentTime + 0.35);
    tractorSound.gain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.7);
    
    setTimeout(()=>{ 
      try{ 
        tractorSound.osc1.stop(); 
        tractorSound.osc2.stop(); 
        tractorSound.osc3.stop();
        tractorSound.osc4.stop();
      }catch(_){} 
      tractorSound=null; 
      isTractorPlaying=false; 
    }, 750);
  }catch(e){ isTractorPlaying=false; tractorSound=null; }
}

function playWhoosh(done){
  const ctx = getCtx(); const dur = 0.45; if (!ctx) return;
  const bufferSize = ctx.sampleRate * dur, buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate), data = buffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++) data[i] = Math.random()*2-1;
  const src = ctx.createBufferSource(); src.buffer = buffer;
  const filter = ctx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.setValueAtTime(400, ctx.currentTime); filter.frequency.exponentialRampToValueAtTime(8000, ctx.currentTime + dur);
  const gain = ctx.createGain(); gain.gain.setValueAtTime(0.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.6, ctx.currentTime+0.05); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+dur);
  src.connect(filter).connect(gain).connect(ctx.destination); src.start(); src.onended = ()=> done && done();
}
function playChaChing(){
  const ctx = getCtx(); if (!ctx) return; const t0 = ctx.currentTime + 0.02;
  const o1 = ctx.createOscillator(); o1.type='triangle'; const g1 = ctx.createGain(); g1.gain.setValueAtTime(0.0001, t0); g1.gain.exponentialRampToValueAtTime(0.7, t0+0.02); g1.gain.exponentialRampToValueAtTime(0.0001, t0+0.7); o1.frequency.setValueAtTime(1100, t0); o1.frequency.exponentialRampToValueAtTime(1600, t0+0.08);
  const o2 = ctx.createOscillator(); o2.type='square'; const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.0001, t0); g2.gain.exponentialRampToValueAtTime(0.35, t0+0.02); g2.gain.exponentialRampToValueAtTime(0.0001, t0+0.55); o2.frequency.setValueAtTime(660, t0); o2.frequency.exponentialRampToValueAtTime(990, t0+0.06);
  const nDur=0.09; const b = ctx.createBuffer(1, ctx.sampleRate*nDur, ctx.sampleRate); const d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const n = ctx.createBufferSource(); n.buffer=b; const ng=ctx.createGain(); ng.gain.setValueAtTime(0.4, t0); ng.gain.exponentialRampToValueAtTime(0.0001, t0+nDur);
  o1.connect(g1).connect(ctx.destination); o2.connect(g2).connect(ctx.destination); n.connect(ng).connect(ctx.destination);
  o1.start(t0); o2.start(t0+0.02); n.start(t0); o1.stop(t0+0.7); o2.stop(t0+0.55); n.stop(t0+nDur);
}

/* === MODAL CLOSE FUNCTION === */
function closeModal() {
  if (modal) {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }
}

/* === EVENT LISTENERS UNTUK MODAL === */
if (btnCloseModal) {
  optimizedTouch(btnCloseModal, (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
}

// Click background modal untuk tutup
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  }, {signal: __CTRL.signal});
}

window.addEventListener('beforeunload', () => { stopCoinDropSound(); }, {signal: __CTRL.signal});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopCoinDropSound(); }, {signal: __CTRL.signal});
