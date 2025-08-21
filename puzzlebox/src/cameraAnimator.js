import * as THREE from 'three';

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
    for (const puzzleName of this.puzzleOrder) {
      if (!completedPuzzleNames.has(puzzleName)) {
        return this.puzzlePositions[puzzleName];
      }
    }
    // If all puzzles are completed, return to front view
    return this.puzzlePositions.start;
  }

  // Animate camera to a specific position
  animateToPosition(targetPosition, targetTarget, duration = 2.0) {
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
    }, (duration + 1) * 1000); // 1 second extra buffer
    
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
      if (frameCount % 10 === 0) {
        this.controls.update();
      }
      
      // Only update controls at the end to avoid interference
      if (progress >= 1) {
        clearTimeout(safetyTimeout);
        this.controls.update();
        this.isAnimating = false;
        this.currentAnimation = null;
        
        // Re-enable controls after animation
        this.controls.setEnabled(true);
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
          element.style.transition = 'opacity 3s ease-out';
          element.style.opacity = '0';
        }
      });
    });
  }

  // Animate to next puzzle after completion
  animateToNextPuzzle(completedPuzzleNames) {
    const nextPosition = this.getNextPuzzlePosition(completedPuzzleNames);
    if (nextPosition) {
      // Find the puzzle name for this position
      const nextPuzzleName = this.getPuzzleNameForPosition(nextPosition);
      
      // Show next puzzle indicator
      if (window.showNextPuzzleIndicator && nextPuzzleName) {
        window.showNextPuzzleIndicator(nextPuzzleName);
      }
      
      this.animateToPosition(nextPosition.position, nextPosition.target, 2.2);
      
      // If all puzzles are completed (we're going to start position), trigger the zoom
      if (completedPuzzleNames.size >= 5) {
        console.log('All puzzles completed - triggering completion zoom');
        // Wait for the camera animation to complete, then start the zoom
        setTimeout(() => {
          console.log('Starting completion zoom');
          this.startCompletionZoom();
        }, 2500); // 2.2s animation + 0.3s buffer
      }
    } else {
      console.warn('No next puzzle position found');
    }
  }

  // Start a slow linear zoom as far as possible after completion
  startCompletionZoom() {
    console.log('startCompletionZoom called');
    
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
    const maxZoomDistance = 2.5; // Very far zoom
    const zoomDirection = this.camera.position.clone().normalize();
    const targetPosition = zoomDirection.multiplyScalar(maxZoomDistance);
    
    // Start immediately with first frame
    const startTime = performance.now();
    let lastTime = startTime;
    const zoomDuration = 10.0; // 8 seconds for a very slow zoom
    
    const animate = (currentTime) => {
      // Calculate delta time for smoother animation
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / zoomDuration, 1);
      
      // Use completely linear animation for smooth zoom
      const easedProgress = progress;
      
      // Direct position assignment without controls interference
      this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
      
      // Only update controls at the end to avoid interference
      if (progress >= 1) {
        this.controls.update();
        this.isAnimating = false;
        this.currentAnimation = null;
        
        // Re-enable controls after animation
        this.controls.setEnabled(true);
        
        // Show the outro modal after completion zoom
        console.log('Completion zoom finished - showing outro modal');
        
        // Trigger the allPuzzlesCompleted event to show the outro button
        document.dispatchEvent(new CustomEvent('allPuzzlesCompleted'));
        
        setTimeout(() => {
          const outroModal = document.getElementById('outro');
          console.log('Outro modal element:', outroModal);
          if (outroModal) {
            // Set initial state for fade-in
            outroModal.style.display = 'block';
            outroModal.style.opacity = '0';
            outroModal.style.transition = 'opacity 2s ease-in';
            
            // Force reflow to ensure the transition works
            void outroModal.offsetWidth;
            
            // Start fade-in
            outroModal.style.opacity = '1';
            console.log('Outro modal fade-in started');
            
            // Optionally, focus the modal for accessibility
            outroModal.focus?.();
          } else {
            console.error('Outro modal element not found!');
          }
        }, 500); // Small delay after zoom completes
        
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

  // Smooth easing function
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Smoother easing function for better animation
  easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  // Very smooth easing function with minimal deceleration
  easeInOutSmooth(t) {
    // Use a gentler curve that doesn't slow down as much in the middle
    return t * t * (3 - 2 * t);
  }

  // Easing that starts quick and slows down
  easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  // Simple easing that starts immediately and slows down gently
  easeOutSimple(t) {
    // Simple quadratic ease-out: starts fast, slows down
    return 1 - (1 - t) * (1 - t);
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

  // Check if camera is currently at a specific puzzle position
  isAtPuzzlePosition(puzzleName, threshold = 1.0) {
    const targetPosition = this.puzzlePositions[puzzleName];
    if (!targetPosition) return false;
    
    const distance = this.camera.position.distanceTo(targetPosition.position);
    return distance < threshold;
  }

  // Manual camera positioning for testing
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
}
