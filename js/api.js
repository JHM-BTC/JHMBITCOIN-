
import { handleError } from './utils.js';

class APIManager {
  constructor() {
    this.baseURL = '';
    this.googleSheetsURL = null; // Will be set when user provides Google Apps Script URL
  }

  setGoogleSheetsURL(url) {
    this.googleSheetsURL = url;
  }

  async submitToGoogleSheets(data) {
    if (!this.googleSheetsURL) {
      console.warn('Google Sheets URL not configured yet');
      return { success: false, message: 'Google Sheets integration not configured' };
    }

    try {
      const response = await fetch(this.googleSheetsURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      handleError(error, 'submitToGoogleSheets');
      return { success: false, message: error.message };
    }
  }

  async submitUserData(userId, kupon, island = null, prize = null) {
    const data = {
      timestamp: new Date().toISOString(),
      userId: userId,
      kupon: kupon,
      island: island,
      prize: prize,
      session: Date.now()
    };

    return await this.submitToGoogleSheets(data);
  }

  async submitPrizeData(userId, kupon, island, prize, prizeAmount) {
    const data = {
      timestamp: new Date().toISOString(),
      userId: userId,
      kupon: kupon,
      island: island,
      prize: prize,
      prizeAmount: prizeAmount,
      type: 'prize_win'
    };

    return await this.submitToGoogleSheets(data);
  }

  async validateCoupon(couponCode) {
    return {
      valid: couponCode && couponCode.trim().length > 0,
      message: couponCode ? 'Coupon valid' : 'Invalid coupon code'
    };
  }

  async getUserStats(userId) {
    return {
      totalPlays: 0,
      totalWins: 0,
      totalPrizeAmount: 0,
      favoriteIsland: null
    };
  }

  async logActivity(userId, activity, data = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      userId: userId,
      activity: activity,
      data: data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('Activity logged:', logData);
    return { success: true };
  }

  async reportError(error, context, userId = null) {
    const errorData = {
      timestamp: new Date().toISOString(),
      error: error.message || error,
      stack: error.stack || '',
      context: context,
      userId: userId,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('Error reported:', errorData);
    return { success: true };
  }
}

const apiManager = new APIManager();

export const setGoogleSheetsURL = (url) => apiManager.setGoogleSheetsURL(url);
export const submitUserData = (userId, kupon, island, prize) => apiManager.submitUserData(userId, kupon, island, prize);
export const submitPrizeData = (userId, kupon, island, prize, prizeAmount) => apiManager.submitPrizeData(userId, kupon, island, prize, prizeAmount);
export const validateCoupon = (couponCode) => apiManager.validateCoupon(couponCode);
export const getUserStats = (userId) => apiManager.getUserStats(userId);
export const logActivity = (userId, activity, data) => apiManager.logActivity(userId, activity, data);
export const reportError = (error, context, userId) => apiManager.reportError(error, context, userId);

export default apiManager;
