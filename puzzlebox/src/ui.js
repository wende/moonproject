import { audioManager } from './audio_html5.js';
import { t } from './i18n.js';

export function setupUI() {
  // Create fullscreen button
  createFullscreenButton();

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
    },
    {
      id: 'credits',
      openClass: 'end-button',
      closeClass: 'credits-close'
    }
  ];

  // Get reference to dialogue button
  let dialogueButton = document.querySelector('.dialogue-button');

  // Create namespace for global access
  window.PuzzleBox = window.PuzzleBox || {};

  // Global function to set dialogue button text and audio
  window.PuzzleBox.setDialogueButton = function(text, audioFile) {
    // Don't update dialogue button if all puzzles are completed
    if (window.PuzzleBox?.puzzleManager?.allPuzzlesCompleted) {
      return;
    }

    // Get fresh reference to button in case it was replaced
    let currentButton = document.querySelector('.dialogue-button');

    if (currentButton) {
      // Set the text
      currentButton.textContent = text || '';

      // Check if text contains Arabic characters and apply RTL styling
      const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
      if (arabicRegex.test(text)) {
        currentButton.setAttribute('lang', 'ar');
        currentButton.classList.add('arabic-text');
      } else {
        currentButton.removeAttribute('lang');
        currentButton.classList.remove('arabic-text');
      }

      // Play audio immediately if provided
      if (audioFile && typeof audioManager[audioFile] === 'function' && audioManager.areVoiceOversEnabled()) {
        // Temporarily lower background music volume
        const originalMusicVolume = audioManager.musicVolume;
        audioManager.setMusicVolumeTemporary(originalMusicVolume * audioManager.getTempMusicVolumeReduction()); // Reduce to 30% of original volume

        // Get the audio source to determine duration
        const audioSource = audioManager[audioFile]();

        // Get the duration of the audio file
        let audioDuration = 1000; // Default fallback duration
        if (audioSource && audioSource.buffer) {
          audioDuration = audioSource.buffer.duration * 1000; // Convert to milliseconds
        }

        // Restore original music volume after the actual audio duration
        setTimeout(() => {
          audioManager.setMusicVolumeTemporary(originalMusicVolume);
        }, audioDuration);
      }

      // Remove existing click listeners by cloning and replacing
      const newButton = currentButton.cloneNode(true);
      currentButton.parentNode.replaceChild(newButton, currentButton);

      // Add click listener for dialogue button with debouncing
      let volumeRestoreTimeout = null;
      let originalVolume = null;

      newButton.addEventListener('click', () => {
        // Check if all puzzles are completed - if so, open outro modal
        if (window.PuzzleBox?.puzzleManager?.allPuzzlesCompleted) {
          audioManager.playButtonClick();
          const outroModal = document.getElementById('outro');
          if (outroModal) {
            toggleModal(outroModal, true);
          }
          return;
        }

        // Clear any pending volume restore timeout
        if (volumeRestoreTimeout) {
          clearTimeout(volumeRestoreTimeout);
        }

        // Store original volume only if we haven't already
        if (originalVolume === null) {
          originalVolume = audioManager.musicVolume;
        }

        // Temporarily lower background music volume
        audioManager.setMusicVolumeTemporary(originalVolume * audioManager.getTempMusicVolumeReduction());

        // Play audio based on dialogue button text
        const buttonText = newButton.textContent;
        let audioSource = null;
        let audioDuration = 1000; // Default fallback duration

        if (buttonText === t('startSequence') && audioManager.areVoiceOversEnabled()) {
          // Play start voice over
          audioSource = audioManager.playStartVO();
        } else if (buttonText.includes(t('mazePuzzle')) && audioManager.areVoiceOversEnabled()) {
          // Play maze voice over
          audioSource = audioManager.playMazeVO();
        } else {
          // Play button click for other cases
          audioManager.playButtonClick();
        }

        // If we played a voice over, handle volume and duration
        if (audioSource && audioSource.buffer) {
          audioDuration = audioSource.buffer.duration * 1000; // Convert to milliseconds

          // Restore original music volume after the actual audio duration
          volumeRestoreTimeout = setTimeout(() => {
            audioManager.setMusicVolumeTemporary(originalVolume);
            originalVolume = null; // Reset for next interaction
            volumeRestoreTimeout = null;
          }, audioDuration);
        } else {
          // Restore original music volume after 1 second for button click
          volumeRestoreTimeout = setTimeout(() => {
            audioManager.setMusicVolumeTemporary(originalVolume);
            originalVolume = null; // Reset for next interaction
            volumeRestoreTimeout = null;
          }, 1000);
        }
      });
    } else {
      console.warn('Dialogue button not found');
    }
  };

  window.PuzzleBox.setDialogueButton(t('startSequence'));


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

        // Voice overs disabled for now - uncomment when ready to re-enable
        // if (id === 'intro' && audioManager.areVoiceOversEnabled()) {
        //   // Temporarily lower background music volume
        //   const originalMusicVolume = audioManager.musicVolume;
        //   audioManager.setMusicVolumeTemporary(originalMusicVolume * audioManager.getTempMusicVolumeReduction());
        //
        //   // Play start voice over
        //   const audioSource = audioManager.playStartVO();
        //
        //   // Get the duration of the audio file
        //   let audioDuration = 1000; // Default fallback duration
        //   if (audioSource && audioSource.buffer) {
        //     audioDuration = audioSource.buffer.duration * 1000; // Convert to milliseconds
        //   }
        //
        //   // Restore original music volume after the actual audio duration
        //   setTimeout(() => {
        //     audioManager.setMusicVolumeTemporary(originalMusicVolume);
        //   }, audioDuration);
        // }
      });
    });

    // Add click-outside functionality for intro modal
    if (id === 'intro') {
      let isFirstDisplay = true;

      modal.addEventListener('click', (e) => {
      // Only close if clicking on the modal backdrop (not the content) and not first display
        if (e.target === modal && !isFirstDisplay) {
          audioManager.playButtonClick();
          toggleModal(modal, false);
        }
      });

      // Track when modal is opened via button (not first display)
      openButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          isFirstDisplay = false;
          modal.classList.add('clickable-backdrop');
        });
      });
    }
  });

  function toggleModal(modal, isVisible) {
    modal.style.display = isVisible ? 'block' : 'none';
  }

  // Fullscreen functionality
  function createFullscreenButton() {
    const fullscreenButton = document.createElement('button');
    fullscreenButton.id = 'fullscreen-button';
    fullscreenButton.className = 'fullscreen-button';
    fullscreenButton.innerHTML = `
      <svg class="fullscreen-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
      </svg>
      <svg class="fullscreen-exit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
        <path d="M6 18L18 6M6 6l12 12"/>
      </svg>
    `;
    
    // Add button to the page
    document.body.appendChild(fullscreenButton);

    // Fullscreen toggle functionality
    fullscreenButton.addEventListener('click', () => {
      audioManager.playButtonClick();
      toggleFullscreen();
    });

    // Update button state when fullscreen changes
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    document.addEventListener('mozfullscreenchange', updateFullscreenButton);
    document.addEventListener('MSFullscreenChange', updateFullscreenButton);

    // Initial button state
    updateFullscreenButton();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
      // Enter fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  function updateFullscreenButton() {
    const button = document.getElementById('fullscreen-button');
    const fullscreenIcon = button?.querySelector('.fullscreen-icon');
    const exitIcon = button?.querySelector('.fullscreen-exit-icon');
    
    if (!button || !fullscreenIcon || !exitIcon) return;

    const isFullscreen = !!(document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement || 
                           document.msFullscreenElement);

    if (isFullscreen) {
      fullscreenIcon.style.display = 'none';
      exitIcon.style.display = 'block';
      button.setAttribute('title', 'Exit Fullscreen');
    } else {
      fullscreenIcon.style.display = 'block';
      exitIcon.style.display = 'none';
      button.setAttribute('title', 'Enter Fullscreen');
    }
  }



  // Setup read letter button functionality
  function setupReadLetterButton() {
    const readButton = document.getElementById('read-letter-btn');
    const hiddenContent = document.querySelector('.modal-content-hidden');
    const visibleContent = document.querySelector('.modal-body-visible');
    const continueButtonContainer = document.getElementById('continue-button-container');
    const audioLoadingContainer = document.getElementById('audio-loading-container');
    
    if (!readButton || !hiddenContent || !visibleContent) return;

    // Hide the continue button container and loading container initially
    if (continueButtonContainer) {
      continueButtonContainer.style.display = 'none';
    }
    if (audioLoadingContainer) {
      audioLoadingContainer.style.display = 'none';
    }

    readButton.addEventListener('click', () => {
      // Play button click sound
      audioManager.playButtonClick();
      
      // Prevent multiple clicks while playing
      if (readButton.classList.contains('playing')) {
        return;
      }

      // Set playing state
      readButton.classList.add('playing');
      const originalText = readButton.textContent;
      readButton.textContent = 'Playing...';

      // Temporarily enable voice-overs
      const originalVoiceOverState = audioManager.voiceOversEnabled;
      audioManager.setVoiceOversEnabled(true);

      // Temporarily lower background music volume
      const originalMusicVolume = audioManager.musicVolume;
      audioManager.setMusicVolumeTemporary(originalMusicVolume * audioManager.getTempMusicVolumeReduction());

      // Play start voice over
      const audioSource = audioManager.playStartVO();

      // Get the duration of the audio file
      let audioDuration = 10000; // Default fallback duration (10 seconds)
      if (audioSource && audioSource.buffer) {
        audioDuration = audioSource.buffer.duration * 1000; // Convert to milliseconds
      } else if (audioSource && audioSource.duration) {
        audioDuration = audioSource.duration * 1000; // Convert to milliseconds
      }

      // Hide the visible content and show the hidden content
      visibleContent.style.display = 'none';
      hiddenContent.style.display = 'block';
      
      // Show the loading bar and continue button after a short delay
      setTimeout(() => {
        if (audioLoadingContainer) {
          audioLoadingContainer.style.display = 'block';
        }
        if (continueButtonContainer) {
          continueButtonContainer.style.display = 'block';
        }
      }, 500); // 500ms delay to allow content to load

      // Restore original states after audio finishes
      setTimeout(() => {
        // Restore original music volume
        audioManager.setMusicVolumeTemporary(originalMusicVolume);
        
        // Restore original voice-over state
        audioManager.setVoiceOversEnabled(originalVoiceOverState);
        
        // Reset button state
        readButton.classList.remove('playing');
        readButton.textContent = originalText;
      }, audioDuration);
    });
  }

  // Initialize read letter button
  setupReadLetterButton();

  // Show the intro modal by default
  const introModal = document.getElementById('intro');
  if (introModal) {
    console.log('Showing intro modal');
    introModal.style.display = 'block';
    toggleModal(introModal, true);
  } else {
    console.error('Intro modal not found');
  }
}
