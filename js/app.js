
import { $, $$, show, hide, showScreen, saveSession, loadSession, validateInput } from './utils.js';
import { islandManager } from './islands.js';
import { submitUserData, logActivity } from './api.js';

class TreasureMapApp {
  constructor() {
    this.session = null;
    this.currentScreen = 'welcome';
    this.initialize();
  }

  initialize() {
    this.loadSession();
    this.setupEventListeners();
    this.showScreen('welcome');
  }

  loadSession() {
    this.session = loadSession();
  }

  setupEventListeners() {
    const btnStart = $('#btnStart');
    const inpUser = $('#inpUser');
    const inpKupon = $('#inpKupon');

    if (btnStart) {
      btnStart.addEventListener('click', () => this.handleStart());
    }

    if (inpUser) {
      inpUser.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleStart();
      });
    }

    if (inpKupon) {
      inpKupon.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleStart();
      });
    }

    const btnHome = $('#btnHome');
    if (btnHome) {
      btnHome.addEventListener('click', () => this.goHome());
    }

    const btnBackToMap = $('#btnBackToMap');
    if (btnBackToMap) {
      btnBackToMap.addEventListener('click', () => this.showScreen('game'));
    }

    if (inpUser) {
      inpUser.addEventListener('input', () => this.validateForm());
    }

    if (inpKupon) {
      inpKupon.addEventListener('input', () => this.validateForm());
    }
  }

  validateForm() {
    const inpUser = $('#inpUser');
    const inpKupon = $('#inpKupon');
    const btnStart = $('#btnStart');

    if (!inpUser || !inpKupon || !btnStart) return;

    const userId = inpUser.value.trim();
    const kupon = inpKupon.value.trim();

    const isUserValid = validateInput(userId, 'username');
    const isKuponValid = validateInput(kupon, 'coupon');

    inpUser.classList.toggle('border-red-400', !isUserValid && userId.length > 0);
    inpUser.classList.toggle('border-green-400', isUserValid);
    
    inpKupon.classList.toggle('border-red-400', !isKuponValid && kupon.length > 0);
    inpKupon.classList.toggle('border-green-400', isKuponValid);

    btnStart.disabled = !isUserValid || !isKuponValid;
    btnStart.classList.toggle('opacity-50', btnStart.disabled);
  }

  async handleStart() {
    const inpUser = $('#inpUser');
    const inpKupon = $('#inpKupon');

    if (!inpUser || !inpKupon) return;

    const userId = inpUser.value.trim();
    const kupon = inpKupon.value.trim();

    if (!validateInput(userId, 'username')) {
      this.showError('User ID harus 3-20 karakter');
      inpUser.focus();
      return;
    }

    if (!validateInput(kupon, 'coupon')) {
      this.showError('Kode kupon harus 4-15 karakter');
      inpKupon.focus();
      return;
    }

    try {
      this.session = saveSession(userId, kupon);
      
      await submitUserData(userId, kupon);
      await logActivity(userId, 'session_started', { kupon });

      this.showScreen('game');
      
      this.showSuccess('Selamat datang! Pilih pulau untuk memulai petualangan.');
    } catch (error) {
      console.error('Error starting session:', error);
      this.showError('Terjadi kesalahan. Silakan coba lagi.');
    }
  }

  goHome() {
    islandManager.resetGame();
    this.showScreen('welcome');
    
    const inpUser = $('#inpUser');
    const inpKupon = $('#inpKupon');
    
    if (inpUser) inpUser.value = '';
    if (inpKupon) inpKupon.value = '';
    
    this.validateForm();
  }

  showScreen(screenName) {
    this.currentScreen = screenName;
    showScreen(screenName);
  }

  showError(message) {
    let errorEl = $('#error-message');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.id = 'error-message';
      errorEl.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
      document.body.appendChild(errorEl);
    }

    errorEl.textContent = message;
    errorEl.classList.remove('hidden', 'opacity-0');
    errorEl.classList.add('opacity-100');

    setTimeout(() => {
      errorEl.classList.add('opacity-0');
      setTimeout(() => {
        errorEl.classList.add('hidden');
      }, 300);
    }, 3000);
  }

  showSuccess(message) {
    let successEl = $('#success-message');
    if (!successEl) {
      successEl = document.createElement('div');
      successEl.id = 'success-message';
      successEl.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
      document.body.appendChild(successEl);
    }

    successEl.textContent = message;
    successEl.classList.remove('hidden', 'opacity-0');
    successEl.classList.add('opacity-100');

    setTimeout(() => {
      successEl.classList.add('opacity-0');
      setTimeout(() => {
        successEl.classList.add('hidden');
      }, 300);
    }, 3000);
  }

  getCurrentSession() {
    return this.session;
  }

  getCurrentScreen() {
    return this.currentScreen;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.treasureMapApp = new TreasureMapApp();
});

export default TreasureMapApp;
