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
    console.log('Looking for next puzzle position...');
    console.log('Completed puzzles:', Array.from(completedPuzzleNames));
    
    for (const puzzleName of this.puzzleOrder) {
      if (!completedPuzzleNames.has(puzzleName)) {
        console.log(`Next puzzle: ${puzzleName}`);
        return this.puzzlePositions[puzzleName];
      }
    }
    // If all puzzles are completed, return to front view
    console.log('All puzzles completed, returning to start position');
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
    
    console.log(`Animating camera to position: ${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z}`);
    console.log('Animation starting immediately...');
    
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
    } else {
      console.warn('No next puzzle position found');
    }
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
