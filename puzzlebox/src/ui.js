import { audioManager } from './audio.js';

export function setupUI() {
  const modals = [
    {
      id: 'intro',
      openClass: 'intro-button',
      closeClass: 'intro-close' 
    },
    {
      id: 'outro',
      openClass: 'outro-button',
      closeClass: 'outro-close'
    }
  ];

  // Get reference to dialogue button
  let dialogueButton = document.querySelector('.dialogue-button');
  
  // Global function to set dialogue button text and click behavior
  window.setDialogueButton = function(text, onClickCallback) {
    // Get fresh reference to button in case it was replaced
    let currentButton = document.querySelector('.dialogue-button');
    
    if (currentButton) {
      // Set the text
      currentButton.textContent = text || '';
      
      // Remove existing click listeners by cloning and replacing
      const newButton = currentButton.cloneNode(true);
      currentButton.parentNode.replaceChild(newButton, currentButton);
      
      // Add new click listener if provided
      if (onClickCallback && typeof onClickCallback === 'function') {
        newButton.addEventListener('click', () => {
          audioManager.playButtonClick();
          onClickCallback();
        });
      }
    } else {
      console.warn('Dialogue button not found');
    }
  };

  window.setDialogueButton("South, East, West, North", () => null)

  modals.forEach(({ id, openClass, closeClass }) => {
    const modal = document.getElementById(id);
    const openButtons = document.querySelectorAll(`.${openClass}`);
    const closeButtons = document.querySelectorAll(`.${closeClass}`);

    if (!modal || !openButtons) {
      console.warn(`Button not found for modal: ${id}`);
    }

    openButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        audioManager.playButtonClick();
        toggleModal(modal, true);
      });
    });
    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        audioManager.playButtonClick();
        toggleModal(modal, false);
      });
    });
  });

  function toggleModal(modal, isVisible) {
    modal.style.display = isVisible ? 'block' : 'none';
  }

  document.addEventListener('allPuzzlesCompleted', () => {
    const outroButton = document.querySelector('.outro-button');
    if (outroButton) outroButton.style.display = 'block';
  });

  toggleModal(document.getElementById('intro'), true);
}
