/**
 * Micro-Interactions Manager
 * Handles animations, transitions, and interactive feedback throughout the game
 */

class MicroInteractions {
  constructor() {
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Handle button loading states
    this.setupButtonLoadingStates();
    
    // Handle success/error states
    this.setupStateAnimations();
    
    // Handle modal animations
    this.setupModalAnimations();
    
    // Handle progress indicators
    this.setupProgressIndicators();
  }

  setupButtonLoadingStates() {
    // Add loading state to buttons when they trigger actions
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.btn, .btn-dark, .continue-button, .download-button');
      if (button && !button.classList.contains('loading')) {
        // Add loading state for buttons that might take time
        if (button.classList.contains('download-button') || 
            button.classList.contains('continue-button')) {
          this.addLoadingState(button, 1000); // 1 second loading
        }
      }
    });
  }

  addLoadingState(button, duration = 2000) {
    button.classList.add('loading');
    button.disabled = true;
    
    setTimeout(() => {
      button.classList.remove('loading');
      button.disabled = false;
    }, duration);
  }

  setupStateAnimations() {
    // Listen for puzzle completion events
    document.addEventListener('puzzleCompleted', (e) => {
      this.showSuccessState(e.target);
    });

    // Listen for puzzle error events
    document.addEventListener('puzzleError', (e) => {
      this.showErrorState(e.target);
    });
  }

  showSuccessState(element) {
    element.classList.add('success-state');
    setTimeout(() => {
      element.classList.remove('success-state');
    }, 400);
  }

  showErrorState(element) {
    element.classList.add('error-state');
    setTimeout(() => {
      element.classList.remove('error-state');
    }, 400);
  }

  setupModalAnimations() {
    // Handle modal exit animations only
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      const closeButtons = modal.querySelectorAll('.close, [data-close]');
      closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          modal.classList.add('fade-out');
          setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('fade-out');
          }, 350);
        });
      });
    });
  }

  setupProgressIndicators() {
    // Add progress indicator class to elements that show progress
    const progressElements = document.querySelectorAll('.loading-bar, .progress-bar');
    progressElements.forEach(element => {
      element.classList.add('progress-indicator');
    });
  }

  // Public methods for external use
  showCompletionCelebration(element) {
    element.classList.add('completion-celebration');
    setTimeout(() => {
      element.classList.remove('completion-celebration');
    }, 600);
  }

  addHoverEffect(element, effect = 'lift') {
    element.addEventListener('mouseenter', () => {
      element.style.transform = effect === 'lift' ? 'translateY(-2px)' : 'scale(1.05)';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = '';
    });
  }

  // Smooth scroll to element
  smoothScrollTo(element, offset = 0) {
    const targetPosition = element.offsetTop - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }

  // Add ripple effect to buttons
  addRippleEffect(button) {
    button.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }
}

// Initialize micro-interactions when the script loads
const microInteractions = new MicroInteractions();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MicroInteractions;
}
