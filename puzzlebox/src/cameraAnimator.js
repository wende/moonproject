import * as THREE from 'three';
import { t } from './i18n.js';

// Camera animation constants
const DEFAULT_ANIMATION_DURATION = 2.0;
const ANIMATION_TIMEOUT_BUFFER = 1000; // 1 second extra buffer
const PROGRESS_COMPLETE_THRESHOLD = 1;
const NEXT_PUZZLE_ANIMATION_DURATION = 2.2;
const PUZZLE_COMPLETION_THRESHOLD = 5;
const UI_FADE_DURATION = 3000; // 3 seconds
const END_ZOOM_DISTANCE = 1.3; // Reduced final position after zoom (was 2.6)
const ZOOM_DURATION = 15.0;
const FAR_ANIMATION_DURATION = 2.0;
const OUTRO_DELAY = 500;
const OUTRO_FADE_DURATION = 2000; // 2 seconds
const COMPASS_GLOW_DELAY = 5.0; // Delay before compass starts glowing
const COMPASS_FADE_IN_DURATION = 4.0; // Duration for compass to fade in

export class CameraAnimator {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.isAnimating = false;
    this.currentAnimation = null;
    this.scene = null; // Will be set when needed

    // Performance optimization: Cache frequently used vectors
    this._tempVector1 = new THREE.Vector3();
    this._tempVector2 = new THREE.Vector3();
    this._tempVector3 = new THREE.Vector3();

    // Compass light materials for outro glow effect
    this.compassLightMaterials = {
      off: null,
      on: null
    };
    this.compassLightObj = null;
    this.compassGlowTriggered = false;

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

    // Cache puzzle name lookups for performance
    this._puzzleNameCache = new Map();
    this._buildPuzzleNameCache();
  }

  // Set scene reference for compass light functionality
  setScene(scene) {
    this.scene = scene;
    this.initCompassLightMaterials();
  }

  // Initialize compass light materials similar to puzzle lights
  initCompassLightMaterials() {
    if (!this.scene) return;

    // Try to find Graphic_Compass element in the scene
    const compassGroup = this.scene.getObjectByName('Graphic_Compass');
    if (!compassGroup) {
      console.warn('Graphic_Compass element not found in scene');
      return;
    }

    console.log('Found Graphic_Compass:', compassGroup);
    console.log('Graphic_Compass type:', compassGroup.type);
    console.log('Graphic_Compass isMesh:', compassGroup.isMesh);
    console.log('Graphic_Compass has material:', !!compassGroup.material);
    console.log('Graphic_Compass children:', compassGroup.children);

    // If Graphic_Compass is a mesh with material, use it directly
    if (compassGroup.isMesh && compassGroup.material) {
      console.log('Using Graphic_Compass as direct mesh with material');
      this.compassLightObj = compassGroup;
    } else if (compassGroup.children && compassGroup.children.length > 0) {
      // Find the light object within the compass group
      console.log('Searching for light object in Graphic_Compass children...');
      
      // First, try to find objects with specific material names
      this.compassLightObj = compassGroup.children.find((child) => (
        child.material?.name === 'Light_Display' || 
        child.material?.name === 'Compass_Light' ||
        child.material?.name === 'Graphic_Compass_Light'
      ));

      if (!this.compassLightObj) {
        // If no specific light found, try to use any mesh with a material
        this.compassLightObj = compassGroup.children.find((child) => 
          child.isMesh && child.material
        );
      }

      if (!this.compassLightObj) {
        // If still no mesh found, try any object with a material
        this.compassLightObj = compassGroup.children.find((child) => 
          child.material
        );
      }

      if (this.compassLightObj) {
        console.log('Found light object in Graphic_Compass:', this.compassLightObj);
        console.log('Light object material:', this.compassLightObj.material);
      }
    }

    if (this.compassLightObj && this.compassLightObj.material) {
      console.log('Setting up compass light materials...');
      
      // Store the original "off" material
      this.compassLightMaterials.off = this.compassLightObj.material;
      console.log('Original material:', this.compassLightMaterials.off);

      // Create "on" material by cloning and modifying the original
      this.compassLightMaterials.on = this.compassLightMaterials.off.clone();
      this.compassLightMaterials.on.name = 'Compass_Light_Glow';
      
      // Set glowing properties - make it much brighter
      this.compassLightMaterials.on.emissive.setHex(0xffffff);
      this.compassLightMaterials.on.emissiveIntensity = 5.0; // Much higher initial intensity
      
      // Add some additional glow properties if it's a standard material
      if (this.compassLightMaterials.on.isMeshStandardMaterial) {
        this.compassLightMaterials.on.metalness = 0.1;
        this.compassLightMaterials.on.roughness = 0.1; // Lower roughness for more shine
      }

      console.log('Glow material created:', this.compassLightMaterials.on);
      console.log('Compass light setup complete!');
    } else {
      console.warn('No suitable light object found in Graphic_Compass');
      console.log('Available children:', compassGroup.children?.map(child => ({
        name: child.name,
        type: child.type,
        isMesh: child.isMesh,
        hasMaterial: !!child.material,
        materialName: child.material?.name
      })));
    }
  }

  // Update compass light material (on/off)
  updateCompassLightMaterial(isActivated = true) {
    if (!this.compassLightObj || !this.compassLightMaterials.off || !this.compassLightMaterials.on) {
      return;
    }

    this.compassLightObj.material = isActivated ? this.compassLightMaterials.on : this.compassLightMaterials.off;
  }

  // Animate compass glow with pulsing effect
  animateCompassGlow() {
    if (!this.compassLightObj || !this.compassLightMaterials.on) return;

    const startTime = performance.now();
    const pulseSpeed = 1.5; // Speed of the pulse (higher = faster)

    const animateGlow = (currentTime) => {
      const elapsed = (currentTime - startTime) / 1000;
      
      // Create a continuous pulsing effect
      const pulse = Math.sin(elapsed * pulseSpeed * Math.PI) * 0.4 + 0.8; // Pulse between 0.4 and 1.2
      
      // Make it much brighter - increase base intensity and pulse range
      const baseIntensity = 10.0; // Much higher base intensity
      const pulseRange = 8.0; // Larger pulse range
      const finalIntensity = baseIntensity + (pulse * pulseRange);
      
      this.compassLightMaterials.on.emissiveIntensity = finalIntensity;

      // Continue the animation indefinitely
      requestAnimationFrame(animateGlow);
    };

    requestAnimationFrame(animateGlow);
  }

  // Animate compass glow fade-in during zoom sequence
  animateCompassGlowFadeIn() {
    if (!this.compassLightObj || !this.compassLightMaterials.on) return;

    const startTime = performance.now();
    const fadeInDuration = COMPASS_FADE_IN_DURATION * 1000; // Convert to milliseconds
    const pulseSpeed = 1.5;

    const animateFadeIn = (currentTime) => {
      const elapsed = currentTime - startTime;
      const fadeProgress = Math.min(elapsed / fadeInDuration, 1);
      
      // Smooth fade-in curve (ease-in)
      const easedProgress = fadeProgress * fadeProgress;
      
      // Create a continuous pulsing effect
      const pulse = Math.sin((elapsed / 1000) * pulseSpeed * Math.PI) * 0.4 + 0.8;
      
      // Make it much brighter - increase base intensity and pulse range
      const baseIntensity = 10.0;
      const pulseRange = 8.0;
      const maxIntensity = baseIntensity + (pulse * pulseRange);
      
      // Apply fade-in to the intensity
      const finalIntensity = maxIntensity * easedProgress;
      
      this.compassLightMaterials.on.emissiveIntensity = finalIntensity;

      if (fadeProgress >= 1) {
        // Fade-in complete, continue with normal pulsing
        this.animateCompassGlow();
      } else {
        // Continue fade-in animation
        requestAnimationFrame(animateFadeIn);
      }
    };

    requestAnimationFrame(animateFadeIn);
  }

  // Reset compass light to off state
  resetCompassLight() {
    this.updateCompassLightMaterial(false);
    this.compassGlowTriggered = false;
  }

  // Build cache for puzzle name lookups
  _buildPuzzleNameCache() {
    for (const [puzzleName, puzzlePosition] of Object.entries(this.puzzlePositions)) {
      const key = `${puzzlePosition.position.x},${puzzlePosition.position.y},${puzzlePosition.position.z}`;
      this._puzzleNameCache.set(key, puzzleName);
    }
  }

  // Get the next puzzle position based on current completion state
  getNextPuzzlePosition(completedPuzzleNames) {
    // Ensure completedPuzzleNames is a Set
    if (!(completedPuzzleNames instanceof Set)) {
      console.warn('completedPuzzleNames is not a Set, converting...');
      completedPuzzleNames = new Set(completedPuzzleNames);
    }

    // Check if we have a valid completion state
    if (completedPuzzleNames.size === 0) {
      return this.puzzlePositions.start;
    }

    // Find the next incomplete puzzle
    for (const puzzleName of this.puzzleOrder) {
      if (!completedPuzzleNames.has(puzzleName)) {
        return this.puzzlePositions[puzzleName];
      }
    }

    // If all puzzles are completed, return to start view
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
      return this.puzzlePositions.start;
    }

    // Go to next puzzle in sequence
    const nextIndex = (currentPuzzleIndex + 1) % this.puzzleOrder.length;
    const nextPuzzleName = this.puzzleOrder[nextIndex];

    return this.puzzlePositions[nextPuzzleName];
  }

  // Animate camera to a specific position - optimized version
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

    // Store initial positions - reuse cached vectors
    const startPosition = this._tempVector1.copy(this.camera.position);
    const startTarget = this._tempVector2.copy(this.controls.target);

    // Add safety timeout to prevent getting stuck
    const safetyTimeout = setTimeout(() => {
      if (this.isAnimating) {
        console.warn('Camera animation timeout - forcing completion');
        this.forceAnimationComplete(targetPosition, targetTarget);
      }
    }, (duration + 1) * ANIMATION_TIMEOUT_BUFFER);

    // Start immediately with first frame
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Use completely linear animation for immediate start
      const easedProgress = progress;

      // Direct position assignment without controls interference - reuse cached vectors
      this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
      this.controls.target.lerpVectors(startTarget, targetTarget, easedProgress);

      // Update controls every frame for smooth camera movement
      this.controls.update();

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
      '.intro-button',
      '.audio-toggle-btn',
      '.dialogue-button',
      '.audio-controls'
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

    let nextPosition;

    // Try to get next position based on completion state
    if (completedPuzzleNames && completedPuzzleNames.size > 0) {
      nextPosition = this.getNextPuzzlePosition(completedPuzzleNames);
    } else {
      nextPosition = this.getNextPuzzlePositionByCurrentPosition();
    }

    if (nextPosition) {
      // Find the puzzle name for this position
      const nextPuzzleName = this.getPuzzleNameForPosition(nextPosition.position);


      // If all puzzles are completed, skip the normal transition and go directly to far distance
      if (completedPuzzleNames && completedPuzzleNames.size >= PUZZLE_COMPLETION_THRESHOLD) {
        this.goToFarDistance();
      } else {
        // Only do normal animation if not all puzzles are completed
        this.animateToPosition(nextPosition.position, nextPosition.target, NEXT_PUZZLE_ANIMATION_DURATION);
      }
    } else {
      console.warn('No next puzzle position found');
    }
  }

  // Go to far distance first, then start the completion zoom
  goToFarDistance() {
    if (this.isAnimating) {
      // Stop current animation
      if (this.currentAnimation) {
        cancelAnimationFrame(this.currentAnimation);
      }
    }

    this.isAnimating = true;

    // Reset compass glow trigger for new completion sequence
    this.compassGlowTriggered = false;

    // Fade out UI buttons during the zoom
    this.fadeOutUI();

    // Store original controls and target
    const originalControls = this.controls;
    const currentTarget = this.controls.target.clone();
    this.controls = null;

    // Calculate transition parameters
    const currentPosition = this.camera.position.clone();
    
    // Double the zoom out distance after all puzzles are solved
    const baseFarDistance = 11.0;
    const completionMultiplier = 2.0; // Double the distance
    const farDistance = baseFarDistance * completionMultiplier;
    const farPosition = new THREE.Vector3(0, farDistance, 0.01); // Within OrbitControls maxDistance
    const targetTarget = new THREE.Vector3(0, 0, 0);

    // Animate to far position
    const startTime = performance.now();

    const animateToFar = (currentTime) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / FAR_ANIMATION_DURATION, 1);
      // Explosion-like easing: fast start, slow end
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      // Move to far position
      this.camera.position.lerpVectors(currentPosition, farPosition, easedProgress);

      // Restore controls and handle rotation (only once)
      if (progress >= 0.1 && !this.controls) {
        this.controls = originalControls;
        this.controls.enableDamping = false;
      }

      // Update target smoothly
      if (this.controls && progress >= 0.1) {
        const targetProgress = (progress - 0.1) / 0.9;
        const easedTargetProgress = Math.sin(targetProgress * Math.PI / 2);

        this.controls.target.x = THREE.MathUtils.lerp(currentTarget.x, targetTarget.x, easedTargetProgress);
        this.controls.target.y = THREE.MathUtils.lerp(currentTarget.y, targetTarget.y, easedTargetProgress);
        this.controls.target.z = THREE.MathUtils.lerp(currentTarget.z, targetTarget.z, easedTargetProgress);
      }

      // Update controls every frame for smooth movement
      if (this.controls) {
        this.controls.update();
      }

      if (progress >= 0.99) {
        // Ensure final position and restore controls
        this.camera.position.copy(farPosition);

        if (!this.controls) {
          this.controls = originalControls;
        }
        this.controls.target.copy(targetTarget);
        this.controls.enableDamping = true;
        this.controls.update();

        // Start completion zoom
        setTimeout(() => {
          this.startCompletionZoom(farPosition);
        }, 500);
      } else {
        this.currentAnimation = requestAnimationFrame(animateToFar);
      }
    };

    this.currentAnimation = requestAnimationFrame(animateToFar);
  }

  // Smooth easing function for natural camera movement
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Start a slow linear zoom as far as possible after completion
  startCompletionZoom(farPosition) {
    if (this.isAnimating) {
      // Stop current animation
      if (this.currentAnimation) {
        cancelAnimationFrame(this.currentAnimation);
      }
    }

    this.isAnimating = true;

    // Fade out UI buttons during the zoom
    this.fadeOutUI();

    // Disable controls during animation (if they exist)
    if (this.controls) {
      this.controls.setEnabled(false);
      
      // Temporarily remove distance limits for closer zoom
      this.controls.minDistance = 0.1; // Allow very close zoom
      this.controls.maxDistance = 1000; // Allow far zoom
    }

    // Use the provided far position as starting point and calculate final position
    const startPosition = farPosition.clone();
    const targetPosition = new THREE.Vector3(0, END_ZOOM_DISTANCE, 0); // Top-down final position

    // Start immediately with first frame
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / ZOOM_DURATION, 1);

      // Use completely linear animation for smooth zoom
      const easedProgress = progress;

      // Direct position assignment without controls interference
      this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress);

      // Update controls every frame for smooth movement
      if (this.controls) {
        this.controls.update();
      }

      // Trigger compass glow effect during the zoom
      if (progress >= 0.3 && !this.compassGlowTriggered) {
        this.compassGlowTriggered = true;
        setTimeout(() => {
          // Set the glow material but start at 0 intensity to avoid blink
          if (this.compassLightObj && this.compassLightMaterials.on) {
            this.compassLightObj.material = this.compassLightMaterials.on;
            this.compassLightMaterials.on.emissiveIntensity = 0; // Start at 0
          }
          this.animateCompassGlowFadeIn();
        }, COMPASS_GLOW_DELAY * 1000);
      }

      // Only update controls at the very end to avoid interference
      if (progress >= 0.99) {
        if (this.controls) {
          this.controls.update();
          this.controls.setEnabled(true);
        }
        this.isAnimating = false;
        this.currentAnimation = null;

        // Make dialogue button reappear as "Look Inside"
        const dialogueButton = document.querySelector('.dialogue-button');
        if (dialogueButton) {
          dialogueButton.textContent = t('lookInside');
          dialogueButton.style.transition = 'opacity 3s ease-in 2s';
          dialogueButton.style.opacity = '1';
        }

        // Show the outro modal after completion zoom
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

  // Optimized puzzle name lookup using cache
  getPuzzleNameForPosition(position) {
    const key = `${position.x},${position.y},${position.z}`;
    return this._puzzleNameCache.get(key) || null;
  }


  // Get current puzzle position name based on camera position - optimized
  getCurrentPuzzlePosition() {
    const currentPos = this.camera.position;
    let closestPuzzle = 'start';
    let closestDistance = Infinity;

    // Use cached distance calculations
    for (const [puzzleName, position] of Object.entries(this.puzzlePositions)) {
      const distance = currentPos.distanceToSquared(position.position); // Use squared distance for performance
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
          audio: 'playStartVO'
        },
        maze: {
          text: t('mazePuzzle'),
          audio: 'playMazeVO'
        },
        scales: {
          text: t('scalesPuzzle'),
          audio: 'playScalesVO'
        },
        moon: {
          text: t('moonPuzzle'),
          audio: 'playMoonVO'
        },
        cipher: {
          text: t('cipherPuzzle'),
          audio: 'playRiddleVO'
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

    this.debugGoToPuzzle(nextPuzzleName);
  }

  // Debug method to test compass glow
  debugTestCompassGlow() {
    console.log('Testing compass glow...');
    
    if (!this.scene) {
      console.warn('Scene not available. Make sure setScene() was called.');
      return;
    }

    // Log all objects in the scene to help find the compass
    console.log('Searching for compass-related objects in scene...');
    const allObjects = [];
    const compassCandidates = [];
    
    this.scene.traverse((object) => {
      allObjects.push(object.name);
      
      // Look for objects that might be the compass
      if (object.name.toLowerCase().includes('compass') || 
          object.name.toLowerCase().includes('graphic') ||
          object.name.toLowerCase().includes('rose') ||
          object.name.toLowerCase().includes('direction')) {
        compassCandidates.push({
          name: object.name,
          type: object.type,
          isMesh: object.isMesh,
          hasMaterial: !!object.material,
          children: object.children?.length || 0
        });
      }
    });

    console.log('All objects in scene:', allObjects);
    console.log('Compass candidates found:', compassCandidates);

    // Try to find Graphic_Compass specifically
    const compassGroup = this.scene.getObjectByName('Graphic_Compass');
    if (compassGroup) {
      console.log('Found Graphic_Compass group:', compassGroup);
      console.log('Graphic_Compass children:', compassGroup.children);
      
      // If Graphic_Compass is a mesh with material, use it directly
      if (compassGroup.isMesh && compassGroup.material) {
        console.log('Using Graphic_Compass as direct mesh with material');
        this.compassLightObj = compassGroup;
        this.initCompassLightMaterials();
        // Set the glow material but start at 0 intensity to avoid blink
        if (this.compassLightObj && this.compassLightMaterials.on) {
          this.compassLightObj.material = this.compassLightMaterials.on;
          this.compassLightMaterials.on.emissiveIntensity = 0; // Start at 0
        }
        this.animateCompassGlowFadeIn();
        return;
      }
      
      // Look for light objects within the compass group
      const lightObjects = compassGroup.children.filter(child => 
        child.material?.name === 'Light_Display' || 
        child.material?.name === 'Compass_Light' ||
        child.name.toLowerCase().includes('light') ||
        child.isMesh
      );
      
      console.log('Light objects in Graphic_Compass:', lightObjects);
      
      if (lightObjects.length > 0) {
        this.compassLightObj = lightObjects[0];
        console.log('Using first light object:', this.compassLightObj);
        this.initCompassLightMaterials();
        // Set the glow material but start at 0 intensity to avoid blink
        if (this.compassLightObj && this.compassLightMaterials.on) {
          this.compassLightObj.material = this.compassLightMaterials.on;
          this.compassLightMaterials.on.emissiveIntensity = 0; // Start at 0
        }
        this.animateCompassGlowFadeIn();
        return;
      }
    }

    // If Graphic_Compass not found, try alternative names
    const alternativeNames = [
      'Compass', 'GraphicCompass', 'Compass_Graphic', 'Graphic_Compass_Group',
      'Rose', 'CompassRose', 'Direction', 'Directional', 'Compass_Light'
    ];

    for (const name of alternativeNames) {
      const obj = this.scene.getObjectByName(name);
      if (obj) {
        console.log(`Found alternative compass object: ${name}`, obj);
        if (obj.isMesh && obj.material) {
          this.compassLightObj = obj;
          this.initCompassLightMaterials();
          // Set the glow material but start at 0 intensity to avoid blink
          if (this.compassLightObj && this.compassLightMaterials.on) {
            this.compassLightObj.material = this.compassLightMaterials.on;
            this.compassLightMaterials.on.emissiveIntensity = 0; // Start at 0
          }
          this.animateCompassGlowFadeIn();
          return;
        }
      }
    }

    console.warn('Compass light object not found. Make sure Graphic_Compass element exists in the scene.');
    console.log('Available object names that might be relevant:', allObjects.filter(name => 
      name.toLowerCase().includes('compass') || 
      name.toLowerCase().includes('graphic') || 
      name.toLowerCase().includes('light') ||
      name.toLowerCase().includes('rose') ||
      name.toLowerCase().includes('direction')
    ));
  }
}
