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
        position: new THREE.Vector3(0, 6, 0),
        target: new THREE.Vector3(0, 0, 0),
        description: 'Top view - Start sequence puzzle'
      },
      maze: {
        position: new THREE.Vector3(5, 2, 0),
        target: new THREE.Vector3(0, 0, 0),
        description: 'Right side - Maze puzzle'
      },
      scales: {
        position: new THREE.Vector3(-5, 2, 0),
        target: new THREE.Vector3(0, 0, 0),
        description: 'Left side - Scales puzzle'
      },
      moon: {
        position: new THREE.Vector3(0, 2, -5),
        target: new THREE.Vector3(0, 0, 0),
        description: 'Back side - Moon puzzle'
      },
      cipher: {
        position: new THREE.Vector3(0, 2, 5),
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
    
    // Start immediately with first frame
    const startTime = performance.now();
    let lastTime = startTime;
    
    const animate = (currentTime) => {
      // Calculate delta time for smoother animation
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      // Debug first few frames
      if (progress < 0.1) {
      }
      
      // Use completely linear animation for immediate start
      const easedProgress = progress;
      
      // Direct position assignment without controls interference
      this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
      this.controls.target.lerpVectors(startTarget, targetTarget, easedProgress);
      
      // Only update controls at the end to avoid interference
      if (progress >= 1) {
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
        // Wait for the camera animation to complete, then start the zoom
        setTimeout(() => {
          this.startCompletionZoom();
        }, 2500); // 2.2s animation + 0.3s buffer
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
      // INSERT_YOUR_CODE
      // Open the "outro" modal if it exists in the DOM
      const outroModal = document.getElementById('outro');
      if (outroModal) {
        outroModal.style.display = 'block';
        // Optionally, focus the modal for accessibility
        outroModal.focus?.();
      }
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
