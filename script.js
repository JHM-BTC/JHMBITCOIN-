(function(){
  /* === DATA GAMBAR (tetap) === */
  const islandData = [
    { id:'A', front:'https://i.postimg.cc/Xq54LPSS/BAJAK-LAUT.webp', back:'https://i.postimg.cc/SRFwSN53/PULAU-A.webp' },
    { id:'B', front:'https://i.postimg.cc/Xq54LPSS/BAJAK-LAUT.webp', back:'https://i.postimg.cc/s1FDRr9g/PULAU-B.webp' },
    { id:'C', front:'https://i.postimg.cc/Xq54LPSS/BAJAK-LAUT.webp', back:'https://i.postimg.cc/m2M71ZnV/PULAU-C.webp' },
    { id:'D', front:'https://i.postimg.cc/Xq54LPSS/BAJAK-LAUT.webp', back:'https://i.postimg.cc/W49ZcdDp/PULAU-D.webp' },
  ];

  /* === ELEMENTS === */
  const bgHero = document.getElementById('bgHero');
  const bgGame = document.getElementById('bgGame');
  const scrWelcome = document.getElementById('screen-welcome');
  const scrGame = document.getElementById('screen-game');
  const btnHome = document.getElementById('btnHome');
  const btnStart = document.getElementById('btnStart');
  const inpUser = document.getElementById('inpUser');
  const inpKupon = document.getElementById('inpKupon');
  const islandContainer = document.getElementById('island-container');
  const spinButton = document.getElementById('spinButton');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalButton = document.getElementById('modalButton');

  /* === STATE === */
  let isSpinning=false, canPick=false, spinInterval=null;
  
  /* === AUDIO SYSTEM - MESIN JAHIT === */
  let audioContext = null;
  let machineNoiseGain = null;
  let isPlayingMachineSound = false;
  
  function initAudio() {
    if (audioContext) return;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      machineNoiseGain = audioContext.createGain();
      machineNoiseGain.connect(audioContext.destination);
      machineNoiseGain.gain.value = 0;
    } catch (e) {
      console.warn('Audio tidak didukung:', e);
    }
  }
  
  function createMachineNoise() {
    if (!audioContext) return null;
    
    // White noise untuk suara dasar mesin jahit
    const bufferSize = audioContext.sampleRate * 0.1; // 100ms buffer
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    
    // Filter untuk membuat suara seperti mesin jahit
    const filter1 = audioContext.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.value = 1200;
    filter1.Q.value = 8;
    
    const filter2 = audioContext.createBiquadFilter();
    filter2.type = 'highpass';
    filter2.frequency.value = 800;
    
    // Gain untuk mengatur volume
    const gain = audioContext.createGain();
    gain.gain.value = 0.3;
    
    // Connection chain
    noiseSource.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    gain.connect(machineNoiseGain);
    
    return { source: noiseSource, gain: gain };
  }
  
  function startMachineSound() {
    if (!audioContext || isPlayingMachineSound) return;
    
    try {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      isPlayingMachineSound = true;
      const machine = createMachineNoise();
      
      if (machine) {
        // Fade in
        machineNoiseGain.gain.setValueAtTime(0, audioContext.currentTime);
        machineNoiseGain.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.1);
        
        machine.source.start();
        
        // Variasi volume untuk membuat efek mesin jahit yang bergerak
        const modulateVolume = () => {
          if (!isPlayingMachineSound) return;
          
          const baseVolume = 0.3 + Math.random() * 0.2;
          machine.gain.gain.setValueAtTime(baseVolume, audioContext.currentTime);
          machine.gain.gain.linearRampToValueAtTime(baseVolume + 0.1, audioContext.currentTime + 0.05);
          machine.gain.gain.linearRampToValueAtTime(baseVolume, audioContext.currentTime + 0.1);
          
          setTimeout(modulateVolume, 60 + Math.random() * 40);
        };
        
        modulateVolume();
        
        // Store untuk stop nanti
        window.currentMachineSound = machine;
      }
    } catch (e) {
      console.warn('Gagal memutar suara:', e);
    }
  }
  
  function stopMachineSound() {
    if (!audioContext || !isPlayingMachineSound) return;
    
    try {
      // Fade out
      machineNoiseGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
      
      setTimeout(() => {
        if (window.currentMachineSound) {
          try {
            window.currentMachineSound.source.stop();
          } catch (e) {
            // Ignore error jika sudah stop
          }
          window.currentMachineSound = null;
        }
        isPlayingMachineSound = false;
      }, 250);
    } catch (e) {
      console.warn('Gagal stop suara:', e);
    }
  }

  /* === ROUTER (tetap) === */
  const DEST = { A:'mystery-a.html', B:'crypto-b.html', C:'gedorpintu-c.html', D:'gaple-d.html' };

  /* === HELPERS === */
  const show = el=>el.classList.remove('hidden');
  const hide = el=>el.classList.add('hidden');
  const saveSession = (u,k)=> localStorage.setItem('tm_session', JSON.stringify({userId:u, kupon:k, ts:Date.now()}));
  function showModal(title,msg,cb=null){ modalTitle.textContent=title; modalMessage.textContent=msg; modal.classList.add('show'); modalButton.onclick=()=>{ modal.classList.remove('show'); if(cb) cb(); }; }
  function showScreen(name){ hide(scrWelcome); hide(scrGame); if(name==='welcome'){ show(bgHero); hide(bgGame); show(scrWelcome);} if(name==='game'){ hide(bgHero); show(bgGame); show(scrGame);} }

  /* === WELCOME === */
  btnStart.addEventListener('click', ()=>{
    const u=(inpUser.value||'').trim(); const k=(inpKupon.value||'').trim().toUpperCase();
    if(!u || !k){ showModal('Oops!','Silakan masukkan User ID dan Kode Kupon!'); return; }
    btnStart.disabled=true; btnStart.textContent='Memeriksa...';
    const apiUrl='https://script.google.com/macros/s/AKfycbyRl2BqiDPw75fQ-XYyL87eKDwHMr61eY0Cg7ra1vc36OMOFZ3IRY_QeZcLFDzFFM88/exec';
    fetch(`${apiUrl}?action=claim&userid=${encodeURIComponent(u)}&kupon=${encodeURIComponent(k)}`)
      .then(r=>r.json())
      .then(d=>{ if(d.success){ saveSession(u,k); showScreen('game'); generateIslands(); } else { showModal('Gagal!', d.msg || 'User ID atau Kode Kupon salah!'); } })
      .catch(()=> showModal('Error','Gagal menghubungi server. Coba lagi.'))
      .finally(()=>{ btnStart.disabled=false; btnStart.textContent='Mulai Sekarang'; });
  });

  btnHome.addEventListener('click', ()=>{ 
    window.location.href = 'panduan.html';
  });

  /* === GAME === */
  function generateIslands(){
    islandContainer.innerHTML='';
    islandData.forEach((island,idx)=>{
      const wrap=document.createElement('div');
      wrap.className='island-card-wrapper';
      wrap.setAttribute('data-index',idx);
      wrap.setAttribute('data-id',island.id);
      wrap.innerHTML=`
        <div class="island-card">
          <div class="island-front">
            <img src="${island.front}" alt="Logo" class="card-front-logo"
                 onerror="this.src='https://placehold.co/400x600/4a5568/a0aec0?text=Logo+Missing'"/>
          </div>
          <div class="island-back">
            <img src="${island.back}" alt="Pulau ${island.id}" class="island-img"
                 onerror="this.src='https://placehold.co/400x600/4a5568/a0aec0?text=Pulau+${island.id}+Missing'"/>
          </div>
        </div>`;
      islandContainer.appendChild(wrap);
    });
  }

  function shuffleCards(){
    const items=Array.from(islandContainer.children);
    for(let i=items.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      islandContainer.insertBefore(items[j], items[i].nextSibling);
    }
  }

  function startSpin(){
    if(isSpinning) return;
    
    // Init audio saat pertama kali user interaksi
    initAudio();
    
    resetGame();
    isSpinning=true; canPick=false;
    spinButton.disabled=true; spinButton.textContent='Mengacak...';
    document.querySelectorAll('.island-card').forEach(c=>c.classList.add('shuffling-anim'));
    
    // Mulai suara mesin jahit
    startMachineSound();
    
    let count=0; const totalDuration=2000; const shuffleSpeed=80; const totalShuffles=Math.floor(totalDuration/shuffleSpeed);
    spinInterval=setInterval(()=>{
      shuffleCards();
      if(++count>=totalShuffles){
        clearInterval(spinInterval);
        
        // Stop suara mesin jahit
        stopMachineSound();
        
        isSpinning=false; canPick=true;
        spinButton.textContent='PILIH SALAH SATU PULAU!';
        document.querySelectorAll('.island-card').forEach(c=>c.classList.remove('shuffling-anim'));
      }
    },shuffleSpeed);
  }

  function flipCard(wrapper){
    if(!canPick || wrapper.querySelector('.island-card').classList.contains('flipped')) return;
    const card=wrapper.querySelector('.island-card');
    card.classList.add('flipped');
    canPick=false; spinButton.textContent='MULAI BARU'; spinButton.disabled=false;
    const id=wrapper.getAttribute('data-id');
    setTimeout(()=>{
      const target=DEST[id];
      if(target){ showModal('Selamat!',`Anda menemukan Pulau ${id}! Lanjut ke halaman selanjutnya.`,()=>{ window.location.href=target; }); }
      else{ showModal('Maaf!',`Pulau ${id} masih disiapkan, BOS.`); }
    },700);
  }

  function resetGame(){
    clearInterval(spinInterval); 
    
    // Stop suara mesin jahit jika masih berjalan
    stopMachineSound();
    
    isSpinning=false; canPick=false;
    document.querySelectorAll('.island-card').forEach(c=>c.classList.remove('flipped','shuffling-anim'));
    spinButton.textContent='PUTAR PENGACAK PULAU!'; spinButton.disabled=false;
    shuffleCards();
  }

  /* === EVENTS === */
  spinButton.addEventListener('click', ()=>{ (spinButton.textContent==='MULAI BARU') ? resetGame() : startSpin(); });
  islandContainer.addEventListener('click', e=>{ if(!canPick) return; const wrap=e.target.closest('.island-card-wrapper'); if(wrap) flipCard(wrap); });

  /* === INIT === */
  showScreen('welcome');
  
  // Cleanup suara saat halaman ditutup
  window.addEventListener('beforeunload', () => {
    stopMachineSound();
  });
  
  // Auto stop suara jika halaman kehilangan focus
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopMachineSound();
    }
  });
})();
