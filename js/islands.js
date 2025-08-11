
import { $, $$, show, hide, showScreen, shuffleArray, animateElement } from './utils.js';
import rewardManager from './rewards.js';
import { submitPrizeData, logActivity } from './api.js';

export class IslandManager {
  constructor() {
    this.islands = ['A', 'B', 'C', 'D'];
    this.currentOrder = [0, 1, 2, 3];
    this.isSpinning = false;
    this.canPick = false;
    this.spinInterval = null;
    this.selectedIsland = null;
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    const spinButton = $('#spinButton');
    if (spinButton) {
      spinButton.addEventListener('click', () => {
        if (spinButton.textContent === 'MULAI BARU') {
          this.resetGame();
        } else {
          this.startSpin();
        }
      });
    }

    const islandContainer = $('#island-container');
    if (islandContainer) {
      islandContainer.addEventListener('click', (e) => {
        if (!this.canPick) return;
        const wrapper = e.target.closest('.island-card-wrapper');
        if (wrapper) {
          this.flipCard(wrapper);
        }
      });
    }

    $$('.btn-back-to-map').forEach(btn => {
      btn.addEventListener('click', () => {
        showScreen('game');
      });
    });
  }

  renderIslands() {
    const container = $('#island-container');
    if (!container) return;

    const wrappers = Array.from(container.querySelectorAll('.island-card-wrapper'));
    container.innerHTML = '';
    
    this.currentOrder.forEach(index => {
      if (wrappers[index]) {
        container.appendChild(wrappers[index]);
      }
    });
  }

  startSpin() {
    if (this.isSpinning) return;
    
    this.resetGame();
    this.isSpinning = true;
    this.canPick = false;
    
    const spinButton = $('#spinButton');
    const cards = $$('.island-card');
    
    if (spinButton) {
      spinButton.disabled = true;
      spinButton.textContent = 'Mengacak...';
    }
    
    cards.forEach(card => card.classList.add('shuffling-anim'));
    
    let count = 0;
    const totalDuration = 2000;
    const shuffleSpeed = 80;
    const totalShuffles = Math.floor(totalDuration / shuffleSpeed);
    
    this.spinInterval = setInterval(() => {
      this.currentOrder = shuffleArray(this.currentOrder);
      this.renderIslands();
      count++;
      
      if (count >= totalShuffles) {
        clearInterval(this.spinInterval);
        this.isSpinning = false;
        this.canPick = true;
        
        if (spinButton) {
          spinButton.textContent = 'PILIH SALAH SATU PULAU!';
        }
        
        cards.forEach(card => card.classList.remove('shuffling-anim'));
      }
    }, shuffleSpeed);
  }

  async flipCard(cardWrapper) {
    if (!this.canPick || cardWrapper.classList.contains('flipped')) return;
    
    const card = cardWrapper.querySelector('.island-card');
    const island = cardWrapper.getAttribute('data-kode');
    
    card.classList.add('flipped');
    this.canPick = false;
    this.selectedIsland = island;
    
    const spinButton = $('#spinButton');
    if (spinButton) {
      spinButton.textContent = 'MULAI BARU';
      spinButton.disabled = false;
    }

    const session = JSON.parse(localStorage.getItem('tm_session') || '{}');
    await logActivity(session.userId, 'island_selected', { island });
    
    setTimeout(() => {
      this.navigateToIsland(island);
    }, 700);
  }

  navigateToIsland(island) {
    const session = JSON.parse(localStorage.getItem('tm_session') || '{}');
    
    switch (island) {
      case 'A':
        this.setupMysteryBox(session);
        showScreen('mystery');
        break;
      case 'B':
        window.location.href = 'pages/island-b.html';
        break;
      case 'C':
        window.location.href = 'pages/island-c.html';
        break;
      case 'D':
        window.location.href = 'pages/island-d.html';
        break;
      default:
        alert(`Pulau ${island} masih disiapkan, BOS.`);
    }
  }

  setupMysteryBox(session) {
    const tbUser = $('#tbUser');
    const tbKupon = $('#tbKupon');
    const tbPulau = $('#tbPulau');
    
    if (tbUser) tbUser.textContent = session?.userId || '-';
    if (tbKupon) tbKupon.textContent = session?.kupon || '-';
    if (tbPulau) tbPulau.textContent = 'A';
  }

  resetGame() {
    clearInterval(this.spinInterval);
    this.isSpinning = false;
    this.canPick = false;
    this.selectedIsland = null;
    this.currentOrder = [0, 1, 2, 3];
    
    this.renderIslands();
    
    const wrappers = $$('.island-card-wrapper');
    wrappers.forEach(wrapper => {
      const card = wrapper.querySelector('.island-card');
      card.classList.remove('flipped', 'shuffling-anim');
    });
    
    const spinButton = $('#spinButton');
    if (spinButton) {
      spinButton.textContent = 'PUTAR PENGACAK PULAU!';
      spinButton.disabled = false;
    }
  }

  getSelectedIsland() {
    return this.selectedIsland;
  }

  getIslandInfo(island) {
    return rewardManager.getIslandInfo(island);
  }
}

export class MysteryBoxHandler {
  constructor() {
    this.spinning = false;
    this.chosen = false;
    this.rewardSystem = rewardManager.getRewardSystem('A');
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    const btnSpin = $('#btnSpin');
    const btnShow = $('#btnShow');
    const grid = $('#gridBoxes');
    const btnCloseModal = $('#btnCloseModal');
    const btnCloseModal2 = $('#btnCloseModal2');

    if (btnSpin) {
      btnSpin.addEventListener('click', () => this.startSpinBoxes());
    }

    if (btnShow) {
      btnShow.addEventListener('click', () => this.togglePrizeList());
    }

    if (grid) {
      grid.addEventListener('click', (e) => this.handleBoxClick(e));
    }

    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => this.closeModal());
    }

    if (btnCloseModal2) {
      btnCloseModal2.addEventListener('click', () => this.closeModal());
    }

    this.renderPrizeList();
  }

  renderPrizeList() {
    const hadiahWrap = $('#hadiahWrap');
    if (!hadiahWrap) return;

    const display = this.rewardSystem.getDisplayPrizes();
    hadiahWrap.innerHTML = '';

    display.forEach(prize => {
      const card = document.createElement('div');
      card.className = 'w-[110px] md:w-[150px] h-[88px] md:h-[104px] flex flex-col items-center justify-center bg-yellow-100 rounded-xl shadow-md border border-yellow-400/30';
      card.innerHTML = `
        <span class="text-2xl md:text-3xl mb-1">${prize.logo}</span>
        <span class="text-[13px] md:text-[16px] font-bold text-yellow-800">${prize.nominal}</span>
      `;
      hadiahWrap.appendChild(card);
    });
  }

  togglePrizeList() {
    const listHadiah = $('#listHadiah');
    if (listHadiah) {
      listHadiah.classList.toggle('hidden');
      if (!listHadiah.classList.contains('hidden')) {
        listHadiah.classList.add('fade-in');
      }
    }
  }

  startSpinBoxes() {
    if (this.spinning) return;

    this.spinning = true;
    this.chosen = false;

    const grid = $('#gridBoxes');
    const btnSpin = $('#btnSpin');

    if (grid) {
      Array.from(grid.children).forEach(box => {
        box.classList.remove('picked', 'disabled');
        box.style.pointerEvents = 'none';
        const span = box.querySelector('span');
        if (span) span.textContent = '🎁';
      });
    }

    if (btnSpin) {
      const endAt = Date.now() + 3000;
      
      const step = () => {
        if (Date.now() > endAt) {
          btnSpin.textContent = '🎯 PILIH KOTAK!';
          if (grid) {
            Array.from(grid.children).forEach(box => {
              box.style.pointerEvents = 'auto';
            });
          }
          this.spinning = false;
          return;
        }

        btnSpin.textContent = '⚡ MENGACAK…';
        this.flipShuffle();
        setTimeout(step, 60 + Math.random() * 50);
      };

      step();
    }
  }

  flipShuffle() {
    const grid = $('#gridBoxes');
    if (!grid) return;

    const items = Array.from(grid.children);
    const first = new Map(items.map(el => [el, el.getBoundingClientRect()]));
    
    const r = Math.random();
    if (r < 0.34) {
      this.rotateRowsRight();
    } else if (r < 0.68) {
      this.rotateColsDown();
    } else {
      this.randomSwapPairs();
    }

    const after = Array.from(grid.children);
    after.forEach(el => {
      const f = first.get(el);
      const l = el.getBoundingClientRect();
      const dx = f.left - l.left;
      const dy = f.top - l.top;
      
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = 'transform 0s';
      
      if (Math.random() < 0.25) {
        el.classList.add('twirl');
      }

      requestAnimationFrame(() => {
        el.style.transition = 'transform 240ms cubic-bezier(.22,.9,.24,.99)';
        el.style.transform = 'translate(0,0)';
        setTimeout(() => el.classList.remove('twirl'), 240);
      });
    });
  }

  rotateRowsRight() {
    const grid = $('#gridBoxes');
    if (!grid) return;
    
    const k = Array.from(grid.children);
    [k[2], k[0], k[1], k[5], k[3], k[4], k[8], k[6], k[7]].forEach(el => {
      grid.appendChild(el);
    });
  }

  rotateColsDown() {
    const grid = $('#gridBoxes');
    if (!grid) return;
    
    const k = Array.from(grid.children);
    [k[6], k[7], k[8], k[0], k[1], k[2], k[3], k[4], k[5]].forEach(el => {
      grid.appendChild(el);
    });
  }

  randomSwapPairs() {
    const grid = $('#gridBoxes');
    if (!grid) return;
    
    const k = Array.from(grid.children);
    const swaps = 2 + Math.floor(Math.random() * 2);
    
    for (let s = 0; s < swaps; s++) {
      let a = Math.floor(Math.random() * 9);
      let b = Math.floor(Math.random() * 9);
      
      if (a === b) b = (b + 1) % 9;
      if (a > b) [a, b] = [b, a];
      
      grid.insertBefore(k[b], k[a]);
      grid.insertBefore(k[a], k[b + 1] || null);
    }
  }

  async handleBoxClick(e) {
    const box = e.target.closest('button');
    if (!box || this.spinning || this.chosen) return;

    this.chosen = true;
    box.classList.add('picked');
    
    setTimeout(() => box.classList.remove('picked'), 900);
    
    const grid = $('#gridBoxes');
    if (grid) {
      Array.from(grid.children).forEach(b => b.classList.add('disabled'));
    }

    const session = JSON.parse(localStorage.getItem('tm_session') || '{}');
    const prize = this.rewardSystem.generatePrize();
    const result = this.rewardSystem.formatPrizeResult(prize, session.userId);

    await submitPrizeData(session.userId, session.kupon, 'A', 'mystery_box', prize);
    await logActivity(session.userId, 'prize_won', { island: 'A', prize });

    this.openModalWithPrize(result);

    const btnSpin = $('#btnSpin');
    if (btnSpin) {
      btnSpin.textContent = '🎲 SPIN BOX';
    }
  }

  openModalWithPrize(result) {
    const tbody = $('#tableBody');
    const resultText = $('#resultText');
    const modal = $('#modalPrize');

    if (tbody) {
      tbody.innerHTML = '';
      const display = this.rewardSystem.getDisplayPrizes();
      
      display.forEach((prize, index) => {
        const tr = document.createElement('tr');
        const nominalNumber = Number(prize.nominal.replace(/\D/g, ''));
        tr.innerHTML = `
          <td class="py-2 px-4">${index + 1}</td>
          <td class="py-2 px-4">${prize.nominal}</td>
        `;
        
        if (nominalNumber === result.prize) {
          tr.classList.add('highlight');
        }
        
        tbody.appendChild(tr);
      });
    }

    if (resultText) {
      resultText.textContent = result.message;
    }

    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    const modal = $('#modalPrize');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    }
  }
}

export const islandManager = new IslandManager();
export const mysteryBoxHandler = new MysteryBoxHandler();
