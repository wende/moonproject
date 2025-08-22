import * as THREE from 'three';
import { t } from './i18n.js';

// Camera animation constants
const DEFAULT_ANIMATION_DURATION = 2.0;
const ANIMATION_TIMEOUT_BUFFER = 1000; // 1 second extra buffer
const FRAME_UPDATE_INTERVAL = 10; // Update controls every 10 frames
const PROGRESS_COMPLETE_THRESHOLD = 1;
const NEXT_PUZZLE_ANIMATION_DURATION = 2.2;
const PUZZLE_COMPLETION_THRESHOLD = 5;
const ANIMATION_BUFFER_DELAY = 2500; // 2.2s animation + 0.3s buffer
const UI_FADE_DURATION = 3000; // 3 seconds
const MAX_ZOOM_DISTANCE = 2.5;
const ZOOM_DURATION = 10.0;
const OUTRO_DELAY = 500;
const OUTRO_FADE_DURATION = 2000; // 2 seconds

export class CameraAnimator {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.isAnimating = false;
    this.currentAnimation = null;
    
    // Define camera positions for each puzzle side
    this.puzzlePositions = {
      start: {
        position: new THREE.Vector3(0, 4, 0),
        target: new THREE.Vector3(0, 0, 0),
        description: 'Top view - Start sequence puzzle'
      },
      maze: {
        position: new THREE.Vector3(3.5, 1.5, 0),
        target: new THREE.Vector3(0, 0, 0),
        description: 'Right side - Maze puzzle'
      },
      scales: {
        position: new THREE.Vector3(-3.5, 1.5, 0),
        target: new THREE.Vector3(0, 0, 0),
        description: 'Left side - Scales puzzle'
      },
      moon: {
        position: new THREE.Vector3(0, 1.5, -3.5),
        target: new THREE.Vector3(0, 0, 0),
        description: 'Back side - Moon puzzle'
      },
      cipher: {
        position: new THREE.Vector3(0, 1.5, 3.5),
        target: new THREE.Vector3(0, 0, 0),
        description: 'Front view - Cipher puzzle'
      }
    };
    
    // Puzzle completion order
    this.puzzleOrder = ['start', 'maze', 'scales', 'moon', 'cipher'];
  }

  // Get the next puzzle position based on current completion state
  getNextPuzzlePosition(completedPuzzleNames) {
    console.log('getNextPuzzlePosition called with:', completedPuzzleNames);
    console.log('Puzzle order:', this.puzzleOrder);
    
    // Ensure completedPuzzleNames is a Set
    if (!(completedPuzzleNames instanceof Set)) {
      console.warn('completedPuzzleNames is not a Set, converting...');
      completedPuzzleNames = new Set(completedPuzzleNames);
    }
    
    // Log the current state for debugging
    for (const puzzleName of this.puzzleOrder) {
      const isCompleted = completedPuzzleNames.has(puzzleName);
      console.log(`Puzzle ${puzzleName}: ${isCompleted ? 'completed' : 'not completed'}`);
    }
    
    // Check if we have a valid completion state
    if (completedPuzzleNames.size === 0) {
      console.log('No puzzles completed, going to first puzzle (start)');
      return this.puzzlePositions.start;
    }
    
    // Find the next incomplete puzzle
    for (const puzzleName of this.puzzleOrder) {
      if (!completedPuzzleNames.has(puzzleName)) {
        console.log(`Next puzzle to go to: ${puzzleName}`);
        return this.puzzlePositions[puzzleName];
      }
    }
    
    // If all puzzles are completed, return to start view
    console.log('All puzzles completed, returning to start view');
    return this.puzzlePositions.start;
  }

  // Alternative method that doesn't rely on completion state
  getNextPuzzlePositionByCurrentPosition() {
    const currentPos = this.camera.position;
    let currentPuzzleIndex = -1;
    
    // Find which puzzle position we're closest to
    for (let i = 0; i < this.puzzleOrder.length; i++) {
      const puzzleName = this.puzzleOrder[i];
      const position = this.puzzlePositions[puzzleName];
      const distance = currentPos.distanceTo(position.position);
      
      if (distance < 1.0) { // Within 1 unit
        currentPuzzleIndex = i;
        break;
      }
    }
    
    // If we can't determine current position, start from beginning
    if (currentPuzzleIndex === -1) {
      console.log('Cannot determine current position, starting from first puzzle');
      return this.puzzlePositions.start;
    }
    
    // Go to next puzzle in sequence
    const nextIndex = (currentPuzzleIndex + 1) % this.puzzleOrder.length;
    const nextPuzzleName = this.puzzleOrder[nextIndex];
    console.log(`Moving from ${this.puzzleOrder[currentPuzzleIndex]} to ${nextPuzzleName}`);
    
    return this.puzzlePositions[nextPuzzleName];
  }

  // Animate camera to a specific position
  animateToPosition(targetPosition, targetTarget, duration = DEFAULT_ANIMATION_DURATION) {
    if (this.isAnimating) {
      // Stop current animation
      if (this.currentAnimation) {
        cancelAnimationFrame(this.currentAnimation);
      }
    }

    this.isAnimating = true;
    
    // Disable controls during animation
    this.controls.setEnabled(false);
    
    // Store initial positions
    const startPosition = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    
    // Add safety timeout to prevent getting stuck
    const safetyTimeout = setTimeout(() => {
      if (this.isAnimating) {
        console.warn('Camera animation timeout - forcing completion');
        this.forceAnimationComplete(targetPosition, targetTarget);
      }
    }, (duration + 1) * ANIMATION_TIMEOUT_BUFFER); // 1 second extra buffer
    
    // Start immediately with first frame
    const startTime = performance.now();
    let lastTime = startTime;
    let frameCount = 0;
    
    const animate = (currentTime) => {
      frameCount++;
      
      // Calculate delta time for smoother animation
      lastTime = currentTime;
      
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use completely linear animation for immediate start
      const easedProgress = progress;
      
      // Direct position assignment without controls interference
      this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
      this.controls.target.lerpVectors(startTarget, targetTarget, easedProgress);
      
      // Force controls update every few frames to prevent gimbal lock
      if (frameCount % FRAME_UPDATE_INTERVAL === 0) {
        this.controls.update();
      }
      
      // Only update controls at the end to avoid interference
      if (progress >= PROGRESS_COMPLETE_THRESHOLD) {
        clearTimeout(safetyTimeout);
        this.controls.update();
        this.isAnimating = false;
        this.currentAnimation = null;
        
        // Re-enable controls after animation
        this.controls.setEnabled(true);
        
        // Set dialogue button text and audio based on puzzle position
        this.setDialogueForPuzzlePosition(targetPosition);
      } else {
        // Use immediate next frame for faster response
        this.currentAnimation = requestAnimationFrame(animate);
      }
    };
    
    this.currentAnimation = requestAnimationFrame(animate);
  }

  // Force animation completion if it gets stuck
  forceAnimationComplete(targetPosition, targetTarget) {
    console.warn('Forcing camera animation completion');
    
    // Cancel any ongoing animation
    if (this.currentAnimation) {
      cancelAnimationFrame(this.currentAnimation);
    }
    
    // Set final position directly
    this.camera.position.copy(targetPosition);
    this.controls.target.copy(targetTarget);
    this.controls.update();
    
    // Reset state
    this.isAnimating = false;
    this.currentAnimation = null;
    this.controls.setEnabled(true);
    
    // Set dialogue button text and audio based on puzzle position
    this.setDialogueForPuzzlePosition(targetPosition);
  }

  // Fade out UI elements during completion
  fadeOutUI() {
    const uiElements = [
      '.nav-buttons',
      '.audio-controls',
      '#next-puzzle-indicator'
    ];
    
    uiElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element) {
          element.style.transition = `opacity ${UI_FADE_DURATION / 1000}s ease-out`;
          element.style.opacity = '0';
        }
      });
    });
  }

  // Animate to next puzzle after completion
  animateToNextPuzzle(completedPuzzleNames) {
    console.log('animateToNextPuzzle called with:', completedPuzzleNames);
    
    let nextPosition;
    
    // Try to get next position based on completion state
    if (completedPuzzleNames && completedPuzzleNames.size > 0) {
      nextPosition = this.getNextPuzzlePosition(completedPuzzleNames);
      console.log('Next position determined by completion state:', nextPosition);
    } else {
      console.log('No completion state available, using position-based fallback');
      nextPosition = this.getNextPuzzlePositionByCurrentPosition();
      console.log('Next position determined by current position:', nextPosition);
    }
    
    if (nextPosition) {
      // Find the puzzle name for this position
      const nextPuzzleName = this.getPuzzleNameForPosition(nextPosition);
      console.log('Next puzzle name:', nextPuzzleName);
      
      // Show next puzzle indicator
      if (window.PuzzleBox?.showNextPuzzleIndicator && nextPuzzleName) {
        window.PuzzleBox.showNextPuzzleIndicator(nextPuzzleName);
      }
      
      console.log('Starting camera animation to:', nextPosition.position, nextPosition.target);
      this.animateToPosition(nextPosition.position, nextPosition.target, NEXT_PUZZLE_ANIMATION_DURATION);
      
      // If all puzzles are completed (we're going to start position), trigger the zoom
      if (completedPuzzleNames && completedPuzzleNames.size >= PUZZLE_COMPLETION_THRESHOLD) {
        console.log('All puzzles completed, will trigger completion zoom');
    
        // Wait for the camera animation to complete, then start the zoom
        setTimeout(() => {
          console.log('Starting completion zoom');
          this.startCompletionZoom();
        }, ANIMATION_BUFFER_DELAY); // 2.2s animation + 0.3s buffer
      }
    } else {
      console.warn('No next puzzle position found');
    }
  }

  // Start a slow linear zoom as far as possible after completion
  startCompletionZoom() {

    
    if (this.isAnimating) {
      // Stop current animation
      if (this.currentAnimation) {
        cancelAnimationFrame(this.currentAnimation);
      }
    }

    this.isAnimating = true;
    
    // Fade out UI buttons during the zoom
    this.fadeOutUI();
    
    // Disable controls during animation
    this.controls.setEnabled(false);
    
    // Store initial position
    const startPosition = this.camera.position.clone();
    
    // Calculate the maximum zoom distance (as far as possible while keeping the scene visible)
    // We'll zoom out to a very far distance
    const zoomDirection = this.camera.position.clone().normalize();
    const targetPosition = zoomDirection.multiplyScalar(MAX_ZOOM_DISTANCE);
    
    // Start immediately with first frame
    const startTime = performance.now();
    let lastTime = startTime;
    
    const animate = (currentTime) => {
      // Calculate delta time for smoother animation
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / ZOOM_DURATION, 1);
      
      // Use completely linear animation for smooth zoom
      const easedProgress = progress;
      
      // Direct position assignment without controls interference
      this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
      
      // Only update controls at the end to avoid interference
      if (progress >= PROGRESS_COMPLETE_THRESHOLD) {
        this.controls.update();
        this.isAnimating = false;
        this.currentAnimation = null;
        
        // Re-enable controls after animation
        this.controls.setEnabled(true);
        
        // Show the outro modal after completion zoom
    
        
        // Trigger the allPuzzlesCompleted event to show the outro button
        document.dispatchEvent(new CustomEvent('allPuzzlesCompleted'));
        
        setTimeout(() => {
          const outroModal = document.getElementById('outro');
      
          if (outroModal) {
            // Set initial state for fade-in
            outroModal.style.display = 'block';
            outroModal.style.opacity = '0';
            outroModal.style.transition = `opacity ${OUTRO_FADE_DURATION / 1000}s ease-in`;
            
            // Force reflow to ensure the transition works
            void outroModal.offsetWidth;
            
            // Start fade-in
            outroModal.style.opacity = '1';
        
            
            // Optionally, focus the modal for accessibility
            outroModal.focus?.();
          } else {
            console.error('Outro modal element not found!');
          }
        }, OUTRO_DELAY); // Small delay after zoom completes
        
      } else {
        // Use immediate next frame for faster response
        this.currentAnimation = requestAnimationFrame(animate);
      }
    };
    
    this.currentAnimation = requestAnimationFrame(animate);
  }

  getPuzzleNameForPosition(position) {
    for (const [puzzleName, puzzlePosition] of Object.entries(this.puzzlePositions)) {
      if (puzzlePosition.position.equals(position)) {
        return puzzleName;
      }
    }
    return null;
  }



  // Get current puzzle position name based on camera position
  getCurrentPuzzlePosition() {
    const currentPos = this.camera.position;
    let closestPuzzle = 'start';
    let closestDistance = Infinity;
    
    for (const [puzzleName, position] of Object.entries(this.puzzlePositions)) {
      const distance = currentPos.distanceTo(position.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPuzzle = puzzleName;
      }
    }
    
    return closestPuzzle;
  }




  goToPuzzle(puzzleName) {
    const position = this.puzzlePositions[puzzleName];
    if (position) {
      this.animateToPosition(position.position, position.target, 2.0);
    } else {
      console.warn(`Puzzle position not found: ${puzzleName}`);
    }
  }

  // Get all available puzzle positions
  getPuzzlePositions() {
    return Object.keys(this.puzzlePositions);
  }

  // Set dialogue button text and audio based on puzzle position
  setDialogueForPuzzlePosition(targetPosition) {
    // Find which puzzle position this corresponds to
    const puzzleName = this.getPuzzleNameForPosition(targetPosition);
    
    if (puzzleName && window.PuzzleBox?.setDialogueButton) {
      // Define dialogue text and audio for each puzzle position
      // These are the texts that each puzzle sets when completed (for the next puzzle)
      const puzzleDialogue = {
        start: {
          text: t('startSequence'),
          audio: "playStartVO"
        },
        maze: {
          text: t('mazePuzzle'),
          audio: "playMazeVO"
        },
        scales: {
          text: t('scalesPuzzle'),
          audio: null
        },
        moon: {
          text: t('moonPuzzle'),
          audio: null
        },
        cipher: {
          text: t('cipherPuzzle'),
          audio: null
        }
      };
      
      const dialogue = puzzleDialogue[puzzleName];
      if (dialogue) {
        window.PuzzleBox.setDialogueButton(dialogue.text, dialogue.audio);
      }
    }
  }

  // Debug method to manually go to a specific puzzle
  debugGoToPuzzle(puzzleName) {
    console.log(`Debug: Manually going to puzzle: ${puzzleName}`);
    const position = this.puzzlePositions[puzzleName];
    if (position) {
      this.animateToPosition(position.position, position.target, 2.0);
    } else {
      console.warn(`Debug: Puzzle position not found: ${puzzleName}`);
    }
  }

  // Debug method to cycle through all puzzle positions
  debugCycleThroughPuzzles() {
    const currentPos = this.camera.position;
    let currentPuzzleIndex = -1;
    
    // Find which puzzle position we're closest to
    for (let i = 0; i < this.puzzleOrder.length; i++) {
      const puzzleName = this.puzzleOrder[i];
      const position = this.puzzlePositions[puzzleName];
      const distance = currentPos.distanceTo(position.position);
      
      if (distance < 1.0) { // Within 1 unit
        currentPuzzleIndex = i;
        break;
      }
    }
    
    // Go to next puzzle in sequence
    const nextIndex = (currentPuzzleIndex + 1) % this.puzzleOrder.length;
    const nextPuzzleName = this.puzzleOrder[nextIndex];
    console.log(`Debug: Cycling from ${this.puzzleOrder[currentPuzzleIndex] || 'unknown'} to ${nextPuzzleName}`);
    
    this.debugGoToPuzzle(nextPuzzleName);
  }
}
