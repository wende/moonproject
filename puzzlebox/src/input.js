import * as THREE from 'three';

export function setupInput(raycaster, mouse, camera, puzzleManager, rendererDomElement, scene, actions) {
  // Find the What_Button in the scene
  let whatButton = null;
  if (scene) {
    // Try different possible names for the what button
    const possibleNames = ['What_Button', 'Press_Button_What', 'WhatButton', 'what_button', 'What'];
    
    for (const name of possibleNames) {
      whatButton = scene.getObjectByName(name);
      if (whatButton) {
        console.log(`What button found with name: ${name}`);
        break;
      }
    }
    
    if (!whatButton) {
      console.warn('What button not found. Searching for any button-like objects:');
      const allMeshes = [];
      scene.traverse((child) => {
        if (child.isMesh) {
          allMeshes.push(child.name);
          if (child.name.toLowerCase().includes('what') || child.name.toLowerCase().includes('button')) {
            console.log('Potential button found:', child.name);
          }
        }
      });
      console.log('All mesh objects in scene:', allMeshes);
    }
  }

  window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersected = puzzleManager.puzzles.flatMap(
      puzzle => puzzle.interactiveButtons
    );
    
    // Add What_Button to interactive objects if it exists
    if (whatButton) {
      intersected.push(whatButton);
    }
    
    const intersects = raycaster.intersectObjects(intersected);

    // get closest intersecting object
    if (intersects.length > 0) {
      const clickedButton = intersects[0].object;
      
      // Check if button is disabled
      if (clickedButton.userData.disabled) {
        console.log(`Button ${clickedButton.name} is disabled - ignoring click`);
        return;
      }
      
      // Handle What_Button click separately
      if (clickedButton.name === 'What_Button') {
        handleWhatButtonClick(clickedButton, actions);
      } else {
        puzzleManager.handleClick(clickedButton);
      }
    }
  });

  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersected = puzzleManager.puzzles.flatMap(
      puzzle => puzzle.interactiveButtons
    );
    
    // Add What_Button to interactive objects if it exists
    if (whatButton) {
      intersected.push(whatButton);
    }
    
    const intersects = raycaster.intersectObjects(intersected);

    // Check if any intersected object is disabled
    const hasEnabledButton = intersects.some(intersect => !intersect.object.userData.disabled);
    
    rendererDomElement.style.cursor = hasEnabledButton ? 'pointer' : 'default';
  });
}

// What button state management
let whatButtonState = {
  currentIndex: 0,
  responses: [
    { text: "What?", audio: "playButtonClick" },
    { text: "What?", audio: "playButtonClick" },
    { text: "What?", audio: "playButtonClick" },
    { text: "What?!", audio: "playButtonClick" },
    { text: "...", audio: "playButtonClick" },
    { text: "...WHAT?!", audio: "playButtonClick" },
    { text: "Why are you doing this?", audio: "playButtonClick" },
    { text: "Can you please stop?", audio: "playButtonClick" },
    { text: "KYS", audio: "playButtonClick" }
  ],
  originalDialogueText: null,
  isExhausted: false,
  isResponding: false,
  currentTimeout: null
};

// Handle What_Button click
function handleWhatButtonClick(button, actions) {
  console.log('What_Button was clicked!');
  
  // Check if responses are exhausted
  if (whatButtonState.isExhausted) {
    console.log('What button responses exhausted - no more interactions');
    return;
  }
  
  // Check if already responding to prevent overlapping
  if (whatButtonState.isResponding) {
    console.log('What button already responding - ignoring click');
    return;
  }
  
  // Play button click sound if available
  if (window.PuzzleBox?.audioManager) {
    window.PuzzleBox.audioManager.playButtonClick();
  }
  
  // Create button press animation effect
  animateButtonPress(button);
  
  // Show current response on dialogue button
  showCurrentResponse();
}

// Show current response on dialogue button
function showCurrentResponse() {
  const dialogueButton = document.querySelector('.dialogue-button');
  if (!dialogueButton) return;
  
  // Set responding flag to prevent overlapping
  whatButtonState.isResponding = true;
  
  // Clear any existing timeout
  if (whatButtonState.currentTimeout) {
    clearTimeout(whatButtonState.currentTimeout);
  }
  
  // Store original text on first interaction
  if (whatButtonState.originalDialogueText === null) {
    whatButtonState.originalDialogueText = dialogueButton.textContent;
  }
  
  // Get current response
  const currentResponse = whatButtonState.responses[whatButtonState.currentIndex];
  
  // Set the text
  dialogueButton.textContent = currentResponse.text;
  
  // Remove any Arabic styling since responses are English
  dialogueButton.removeAttribute('lang');
  dialogueButton.classList.remove('arabic-text');
  
  // Play specific audio if available
  if (window.PuzzleBox?.audioManager && currentResponse.audio) {
    const audioManager = window.PuzzleBox.audioManager;
    if (typeof audioManager[currentResponse.audio] === 'function') {
      audioManager[currentResponse.audio]();
    }
  }
  
  // Move to next response
  whatButtonState.currentIndex++;
  
  // Check if we've exhausted all responses
  if (whatButtonState.currentIndex >= whatButtonState.responses.length) {
    whatButtonState.isExhausted = true;
    console.log('What button responses exhausted');
  }
  
  // Revert back to original text after 2 seconds
  whatButtonState.currentTimeout = setTimeout(() => {
    if (dialogueButton) {
      dialogueButton.textContent = whatButtonState.originalDialogueText;
      
      // Restore Arabic styling if the original text was Arabic
      const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
      if (arabicRegex.test(whatButtonState.originalDialogueText)) {
        dialogueButton.setAttribute('lang', 'ar');
        dialogueButton.classList.add('arabic-text');
      }
    }
    
    // Reset responding flag
    whatButtonState.isResponding = false;
  }, 2000); // 2 seconds
}

// Animate button press effect
function animateButtonPress(button) {
  // Store original position
  const originalPosition = button.position.clone();
  
  // Press down effect - move inward slightly
  const pressPosition = originalPosition.clone();
  pressPosition.y -= 0.01; // Move down by 0.01 units (much smaller movement)
  
  // Animation duration
  const pressDuration = 200; // 200ms for press down (slower)
  const releaseDuration = 300; // 300ms for release (slower)
  
  // Press down animation
  const startTime = performance.now();
  
  function animatePress() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / pressDuration, 1);
    
    // Ease out for press down
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    button.position.lerpVectors(originalPosition, pressPosition, easedProgress);
    
    if (progress < 1) {
      requestAnimationFrame(animatePress);
    } else {
      // Start release animation
      animateRelease();
    }
  }
  
  function animateRelease() {
    const releaseStartTime = performance.now();
    
    function animateReleaseFrame() {
      const elapsed = performance.now() - releaseStartTime;
      const progress = Math.min(elapsed / releaseDuration, 1);
      
      // Ease out for release (bounce back)
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      
      button.position.lerpVectors(pressPosition, originalPosition, easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animateReleaseFrame);
      }
    }
    
    animateReleaseFrame();
  }
  
  animatePress();
}
