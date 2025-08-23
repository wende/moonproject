// Time counter functionality for the outro
// Counts days and seconds since January 19, 2020

import { t } from './i18n.js';

export class TimeCounter {
  constructor() {
    this.startDate = new Date('2020-01-19T00:00:00');
    this.interval = null;
    this.isActive = false;
  }

  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.updateCounter();
    this.interval = setInterval(() => {
      this.updateCounter();
    }, 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isActive = false;
  }

  updateCounter() {
    const now = new Date();
    const timeDiff = now - this.startDate;
    
    // Calculate time components
    const totalSeconds = Math.floor(timeDiff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const totalYears = Math.floor(totalDays / 365.25);
    
    // Calculate remaining components after years
    const remainingDays = totalDays - Math.floor(totalYears * 365.25);
    const remainingHours = totalHours - (totalDays * 24);
    const remainingMinutes = totalMinutes - (totalHours * 60);
    const remainingSeconds = totalSeconds - (totalMinutes * 60);
    
    // Update the full text with i18n support
    const timeCounterElement = document.querySelector('.time-counter');
    if (timeCounterElement) {
      const text = t('timeCounterText')
        .replace('{years}', totalYears.toLocaleString())
        .replace('{days}', remainingDays.toLocaleString())
        .replace('{hours}', remainingHours.toLocaleString())
        .replace('{minutes}', remainingMinutes.toLocaleString())
        .replace('{seconds}', remainingSeconds.toLocaleString());
      timeCounterElement.innerHTML = text;
    }
  }

  // Get current values without updating DOM
  getCurrentValues() {
    const now = new Date();
    const timeDiff = now - this.startDate;
    
    const totalSeconds = Math.floor(timeDiff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const totalYears = Math.floor(totalDays / 365.25);
    
    const remainingDays = totalDays - Math.floor(totalYears * 365.25);
    const remainingHours = totalHours - (totalDays * 24);
    const remainingMinutes = totalMinutes - (totalHours * 60);
    const remainingSeconds = totalSeconds - (totalMinutes * 60);
    
    return { 
      years: totalYears, 
      days: remainingDays, 
      hours: remainingHours, 
      minutes: remainingMinutes, 
      seconds: remainingSeconds 
    };
  }
}

// Initialize and manage the time counter
let timeCounter = null;

export function initializeTimeCounter() {
  timeCounter = new TimeCounter();
  
  // Start the counter when the outro modal is shown
  const outroModal = document.getElementById('outro');
  const outroButton = document.querySelector('.outro-button');
  
  if (outroButton) {
    outroButton.addEventListener('click', () => {
      // Start counter when outro is opened
      setTimeout(() => {
        if (timeCounter) {
          timeCounter.start();
        }
      }, 100);
    });
  }
  
  // Stop counter when outro is closed
  const outroCloseButton = document.querySelector('.outro-close');
  if (outroCloseButton) {
    outroCloseButton.addEventListener('click', () => {
      if (timeCounter) {
        timeCounter.stop();
      }
    });
  }
  
  // Also stop when clicking the close button in the modal header
  const outroCloseIcon = document.querySelector('#outro .close');
  if (outroCloseIcon) {
    outroCloseIcon.addEventListener('click', () => {
      if (timeCounter) {
        timeCounter.stop();
      }
    });
  }
  
  // Also handle when outro is opened via dialogue button (when all puzzles completed)
  // Listen for when the outro modal becomes visible
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const modal = mutation.target;
        if (modal.id === 'outro') {
          const isVisible = modal.style.display === 'block';
          if (isVisible && timeCounter) {
            timeCounter.start();
          } else if (!isVisible && timeCounter) {
            timeCounter.stop();
          }
        }
      }
    });
  });
  
  if (outroModal) {
    observer.observe(outroModal, { attributes: true, attributeFilter: ['style'] });
  }
}

// Export for global access if needed
window.TimeCounter = TimeCounter;
window.initializeTimeCounter = initializeTimeCounter;


