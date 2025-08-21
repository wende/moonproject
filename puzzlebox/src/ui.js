import { audioManager } from './audio_html5.js';
import { t } from './i18n.js';

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

  window.PuzzleBox.setDialogueButton(t('startSequence'))

  // Global function to show next puzzle indicator
  window.PuzzleBox.showNextPuzzleIndicator = function(puzzleName) {
    const indicator = document.getElementById('next-puzzle-indicator');
    if (indicator) {
      const puzzleNames = {
        'start': t('startSequenceName'),
        'maze': t('mazePuzzleName'), 
        'scales': t('scalesPuzzleName'),
        'moon': t('moonPuzzleName'),
        'cipher': t('cipherPuzzleName')
      };
      
      const displayName = puzzleNames[puzzleName] || puzzleName;
      indicator.textContent = `${t('next')}: ${displayName}`;
      indicator.style.opacity = '1';
      
      // Fade out after 3 seconds
      setTimeout(() => {
        indicator.style.opacity = '0';
      }, 3000);
    }
  };

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
