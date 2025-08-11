
export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

export const show = (element) => {
  if (typeof element === 'string') element = $(element);
  if (element) element.classList.remove('hidden');
};

export const hide = (element) => {
  if (typeof element === 'string') element = $(element);
  if (element) element.classList.add('hidden');
};

export const toggle = (element, className = 'hidden') => {
  if (typeof element === 'string') element = $(element);
  if (element) element.classList.toggle(className);
};

export const saveSession = (userId, kupon) => {
  const session = { userId, kupon, ts: Date.now() };
  localStorage.setItem('tm_session', JSON.stringify(session));
  return session;
};

export const loadSession = () => {
  try {
    return JSON.parse(localStorage.getItem('tm_session') || 'null');
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem('tm_session');
};

export const shuffleArray = (arr) => {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const getRandomElement = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const animateElement = (element, animationClass, duration = 1000) => {
  return new Promise((resolve) => {
    if (typeof element === 'string') element = $(element);
    if (!element) return resolve();
    
    element.classList.add(animationClass);
    
    setTimeout(() => {
      element.classList.remove(animationClass);
      resolve();
    }, duration);
  });
};

export const fadeIn = (element, duration = 350) => {
  if (typeof element === 'string') element = $(element);
  if (!element) return;
  
  element.classList.add('fade-in');
  show(element);
  
  setTimeout(() => {
    element.classList.remove('fade-in');
  }, duration);
};

export const formatRupiah = (amount) => {
  return 'Rp ' + amount.toLocaleString('id-ID');
};

export const formatNumber = (num) => {
  return num.toLocaleString('id-ID');
};

export const validateInput = (value, type = 'text') => {
  if (!value || value.trim() === '') return false;
  
  switch (type) {
    case 'username':
      return value.length >= 3 && value.length <= 20;
    case 'coupon':
      return value.length >= 4 && value.length <= 15;
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    default:
      return true;
  }
};

export const playSound = (soundName) => {
  console.log(`Playing sound: ${soundName}`);
};

export const showScreen = (screenName) => {
  hide('#screen-welcome');
  hide('#screen-game');
  hide('#screen-mystery');
  hide('#screen-slot');
  hide('#screen-wheel');
  hide('#screen-treasure');
  
  hide('#bgHero');
  hide('#bgGame');
  
  switch (screenName) {
    case 'welcome':
      show('#bgHero');
      show('#screen-welcome');
      break;
    case 'game':
      show('#bgGame');
      show('#screen-game');
      break;
    case 'mystery':
      show('#screen-mystery');
      break;
    case 'slot':
      show('#screen-slot');
      break;
    case 'wheel':
      show('#screen-wheel');
      break;
    case 'treasure':
      show('#screen-treasure');
      break;
  }
};

export const showModal = (modalId) => {
  const modal = $(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
};

export const hideModal = (modalId) => {
  const modal = $(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);
};

export const isMobile = () => {
  return window.innerWidth <= 768;
};

export const isTablet = () => {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

export const isDesktop = () => {
  return window.innerWidth > 1024;
};
