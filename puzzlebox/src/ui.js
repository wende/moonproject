import { audioManager } from './audio_html5.js';
import { DEFAULT_NOTE_VO_DELAY } from './audio_html5.js';
import { t } from './i18n.js';
import { textAnimator } from './textAnimator.js';

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

    // Debounce rapid setDialogueButton calls
    if (window.PuzzleBox.setDialogueButton.lastCallTime) {
      const now = Date.now();
      if (now - window.PuzzleBox.setDialogueButton.lastCallTime < 100) { // 100ms debounce
        return;
      }
    }
    window.PuzzleBox.setDialogueButton.lastCallTime = Date.now();

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

      // Store audio method for later use
      if (audioFile && typeof audioManager[audioFile] === 'function') {
        currentButton.dataset.audioMethod = audioFile;
        // Stored audio method for text
        
        // Play audio immediately if audio manager is ready and voice overs are enabled
        if (audioManager.isInitialized && audioManager.areVoiceOversEnabled()) {
          // Add a small delay to prevent rapid-fire audio when spamming buttons
          setTimeout(() => {
            // Check if this is still the current dialogue button (not replaced by another call)
            const currentDialogueButton = document.querySelector('.dialogue-button');
            if (currentDialogueButton && currentDialogueButton.dataset.audioMethod === audioFile) {
              // Playing immediate audio
              audioManager[audioFile]();
            }
          }, 100); // 100ms delay to prevent spam
        }
      } else if (audioFile) {
        // Audio method not found for text
        // If audio manager isn't initialized yet, store the audio method name to retry later
        if (!audioManager.isInitialized) {
          currentButton.dataset.pendingAudioMethod = audioFile;
          // Stored pending audio method, will retry when audio manager is ready
        } else {
          currentButton.removeAttribute('data-audio-method');
        }
      } else {
        currentButton.removeAttribute('data-audio-method');
        // No audio method for text
      }

      // Remove existing click listeners by cloning and replacing
      const newButton = currentButton.cloneNode(true);
      currentButton.parentNode.replaceChild(newButton, currentButton);

      // Add click listener for dialogue button with debouncing
      let volumeRestoreTimeout = null;
      let originalVolume = null;
      let lastClickTime = 0;
      const CLICK_DEBOUNCE_TIME = 500; // Prevent rapid clicks

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

        // Debounce rapid clicks
        const now = Date.now();
        if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
          return;
        }
        lastClickTime = now;

        // Clear any pending volume restore timeout
        if (volumeRestoreTimeout) {
          clearTimeout(volumeRestoreTimeout);
        }

        // Store original volume only if we haven't already
        if (originalVolume === null) {
          originalVolume = audioManager.musicVolume;
        }

        // Temporarily lower background music volume
        audioManager.setMusicVolumeScaleFactor(audioManager.getTempMusicVolumeReduction());

        // Play audio based on stored audio method or button text
        const audioMethod = newButton.dataset.audioMethod;
        const pendingAudioMethod = newButton.dataset.pendingAudioMethod;
        let audioSource = null;
        let audioDuration = 1000; // Default fallback duration

        // Dialogue button clicked

        // Try to retry pending audio method if audio manager is now initialized
        if (pendingAudioMethod && audioManager.isInitialized && typeof audioManager[pendingAudioMethod] === 'function') {
          newButton.dataset.audioMethod = pendingAudioMethod;
          newButton.removeAttribute('data-pending-audio-method');
          // Retried and set up audio method
        }

        if (audioMethod && typeof audioManager[audioMethod] === 'function' && audioManager.areVoiceOversEnabled() && audioManager.isInitialized) {
          // Play the stored audio method
          audioSource = audioManager[audioMethod]();
          // Playing voice over
        } else {
          // Fallback to button click sound
          if (audioManager.isInitialized) {
            audioManager.playButtonClick();
            // Playing button click sound
          } else {
            // Audio manager not initialized yet
          }
        }

        // If we played a voice over, handle volume and duration
        if (audioSource && audioSource.duration) {
          audioDuration = audioSource.duration * 1000; // Convert to milliseconds
          // Voice over duration calculated
          
          // If it's a delayed audio (like Note VO), add the delay to the duration
          if (audioSource.delayed) {
            audioDuration += DEFAULT_NOTE_VO_DELAY;
            // Added delay to duration
          }
        } else if (audioSource && audioSource.audio && audioSource.audio.duration) {
          // Handle proxy object from _playVoiceOver
          audioDuration = audioSource.duration * 1000; // Convert to milliseconds
                      // Voice over duration from proxy
        } else if (audioMethod) {
          // Try to get duration from the audio file directly
          const audioElement = audioManager.audioElements.get(audioMethod.replace('play', '').toLowerCase() + '_vo');
          if (audioElement && audioElement.duration) {
            audioDuration = audioElement.duration * 1000; // Convert to milliseconds
            // Got duration from audio element
          } else {
            audioDuration = 3000; // Default 3 seconds for voice overs
            // Using default voice over duration
          }
        } else {
          audioDuration = 1000; // Default 1 second for button click
          // Using default button click duration
        }

        // Restore original music volume after the calculated duration
        volumeRestoreTimeout = setTimeout(() => {
          audioManager.restoreMusicVolumeScaleFactor(1.0); // Slower fade out
          originalVolume = null; // Reset for next interaction
          volumeRestoreTimeout = null;
          // Restored music volume
        }, audioDuration);
      });
    } else {
      console.warn('Dialogue button not found');
    }
  };

  // Set up initial dialogue button (will retry audio method setup when audio manager is ready)
  window.PuzzleBox.setDialogueButton(t('startSequence'), 'playStartVO');


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

        // Play start voice over when intro modal is closed
        if (id === 'intro' && audioManager.areVoiceOversEnabled() && audioManager.isInitialized) {
          // Temporarily lower background music volume
          audioManager.setMusicVolumeScaleFactor(audioManager.getTempMusicVolumeReduction(), 0.3); // Quick fade in

        // Play start voice over
        const audioSource = audioManager.playStartVO();

          // Get the duration of the audio file
          let audioDuration = 1000; // Default fallback duration
          if (audioSource && audioSource.duration) {
            audioDuration = audioSource.duration * 1000; // Convert to milliseconds
          }

          // Restore original music volume after the actual audio duration (with 100ms delay to cut short)
          setTimeout(() => {
            audioManager.restoreMusicVolumeScaleFactor(1.0); // Slower fade out
          }, audioDuration + 100);
        }
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

      // Store audio settings for later use
      const originalVoiceOverState = audioManager.voiceOversEnabled;
      const originalMusicVolume = audioManager.musicVolume;

      // Hide the visible content and show the hidden content
      visibleContent.style.display = 'none';
      hiddenContent.style.display = 'block';
      
      // Hide the note image initially
      const noteImage = document.querySelector('.note-image');
      if (noteImage) {
        noteImage.style.display = 'none';
      }
      
      // Get the intro text element and its original content
      const introTextElement = document.getElementById('animated-intro-text');
      if (introTextElement) {
        const originalContent = introTextElement.innerHTML;
        
        // Clear the content initially
        introTextElement.innerHTML = '';
        
        // Start the letter-by-letter animation
        textAnimator.animateText(introTextElement, originalContent, {
          // speed and delay will use the defaults from textAnimator
          onComplete: () => {
            // Play audio when text animation completes
            audioManager.setVoiceOversEnabled(true);
            audioManager.setMusicVolumeScaleFactor(audioManager.getTempMusicVolumeReduction(), 0.3); // Quick fade in
            
            const audioSource = audioManager.playNoteVO();
            
            // Get the duration of the audio file
            let audioDuration = 10000; // Default fallback duration (10 seconds)
            if (audioSource && audioSource.buffer) {
              audioDuration = audioSource.buffer.duration * 1000; // Convert to milliseconds
            } else if (audioSource && audioSource.duration) {
              audioDuration = audioSource.duration * 1000; // Convert to milliseconds
            }
            
            // Show the footer and loading bar immediately after animation completes
            const modalFooter = document.querySelector('#intro .modal-footer');
            if (modalFooter) {
              modalFooter.classList.add('show');
            }
            if (audioLoadingContainer) {
              audioLoadingContainer.style.display = 'block';
            }
            if (continueButtonContainer) {
              continueButtonContainer.style.display = 'block';
            }
            
            // Show the note image after a short delay
            setTimeout(() => {
              if (noteImage) {
                noteImage.style.display = 'block';
                // Add a fade-in effect
                noteImage.style.opacity = '0';
                noteImage.style.transition = 'opacity 0.5s ease-in';
                setTimeout(() => {
                  noteImage.style.opacity = '1';
                }, 10);
              }
            }, 200);
            
            // Restore original states after audio finishes
            setTimeout(() => {
              // Restore original music volume
              audioManager.restoreMusicVolumeScaleFactor(1.0); // Slower fade out
              
              // Restore original voice-over state
              audioManager.setVoiceOversEnabled(originalVoiceOverState);
              
              // Reset button state
              readButton.classList.remove('playing');
              readButton.textContent = originalText;
            }, audioDuration);
          }
        });
      }
    });
  }

  // Initialize read letter button
  setupReadLetterButton();

  // Show the intro modal by default
  const introModal = document.getElementById('intro');
  if (introModal) {
    // Showing intro modal
    introModal.style.display = 'block';
    toggleModal(introModal, true);
  } else {
    console.error('Intro modal not found');
  }
}
