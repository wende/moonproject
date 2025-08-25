import * as THREE from 'three';
import { t } from './i18n.js';

// Camera animation constants
const DEFAULT_ANIMATION_DURATION = 2.0;
const ANIMATION_TIMEOUT_BUFFER = 1000; // 1 second extra buffer
const PROGRESS_COMPLETE_THRESHOLD = 1;
const NEXT_PUZZLE_ANIMATION_DURATION = 2.2;
const PUZZLE_COMPLETION_THRESHOLD = 5;
const UI_FADE_DURATION = 3000; // 3 seconds
const END_ZOOM_DISTANCE = 1.8; // Reduced final position after zoom (was 2.6)
const ZOOM_DURATION = 15.0;
const FAR_ANIMATION_DURATION = 2.0;
const OUTRO_DELAY = 500;
const OUTRO_FADE_DURATION = 2000; // 2 seconds
const COMPASS_GLOW_DELAY = 5.0; // Delay before compass starts glowing
const COMPASS_FADE_IN_DURATION = 4.0; // Duration for compass to fade in

// Outro text animation constants
const OUTRO_LINE_DELAY = 2000; // Delay between each line
const OUTRO_FADE_IN_DURATION = 1800; // Fade-in duration
const OUTRO_BREAK_INSERT_INDEX = 11; // Insert <br> after the poem
const OUTRO_ANIMATION_DELAY = 500; // Delay after modal fade-in before starting line animation

// Time counter constants
const TIME_COUNTER_START_DATE = '2020-01-19T00:00:00';

export class CameraAnimator {
  // Helper function to calculate time counter text
  static calculateTimeCounterText() {
    const now = new Date();
    const startDate = new Date(TIME_COUNTER_START_DATE);
    const timeDiff = now - startDate;

    const totalSeconds = Math.floor(timeDiff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const totalYears = Math.floor(totalDays / 365.25);

    const remainingDays = totalDays - Math.floor(totalYears * 365.25);
    const remainingHours = totalHours - (totalDays * 24);
    const remainingMinutes = totalMinutes - (totalHours * 60);
    const remainingSeconds = totalSeconds - (totalMinutes * 60);

    return `PS In orbit these past ${totalYears.toLocaleString()} years, ${remainingDays.toLocaleString()} days, ${remainingHours.toLocaleString()} hours, ${remainingMinutes.toLocaleString()} minutes, and ${remainingSeconds.toLocaleString()} seconds`;
  }

  // Helper function to set element styles
  static setElementStyles(element, styles) {
    Object.assign(element.style, styles);
  }

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
    // Defer material initialization to avoid blocking the main thread
    requestAnimationFrame(() => {
      this.initCompassLightMaterials();
    });
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


    // If Graphic_Compass is a mesh with material, use it directly
    if (compassGroup.isMesh && compassGroup.material) {
      this.compassLightObj = compassGroup;
    } else if (compassGroup.children && compassGroup.children.length > 0) {
      // Find the light object within the compass group

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


    }

    if (this.compassLightObj && this.compassLightObj.material) {
      // Store the original "off" material
      this.compassLightMaterials.off = this.compassLightObj.material;

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


    } else {
      console.warn('No suitable light object found in Graphic_Compass');

    }
  }

  // Update compass light material (on/off) - optimized to avoid stuttering
  updateCompassLightMaterial(isActivated = true) {
    if (!this.compassLightObj || !this.compassLightMaterials.off || !this.compassLightMaterials.on) {
      return;
    }

    // Defer material change to next frame to avoid stuttering during camera animations
    requestAnimationFrame(() => {
      this.compassLightObj.material = isActivated ? this.compassLightMaterials.on : this.compassLightMaterials.off;
    });
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

  // Prepare outro animation by hiding original text - optimized to avoid stuttering
  prepareOutroAnimation() {
    const outroModal = document.getElementById('outro');
    if (!outroModal) return;

    const modalBody = outroModal.querySelector('.modal-body .modal-column:first-child');
    if (!modalBody) return;

    // Defer DOM operations to avoid stuttering during camera animation
    requestAnimationFrame(() => {
      // Store the original height to prevent jumping
      const originalHeight = modalBody.offsetHeight;
      modalBody.style.minHeight = `${originalHeight}px`;

      // Get all elements including standalone <br> tags
      const textElements = Array.from(modalBody.children).filter(element => {
        const hasText = element.textContent.trim() !== '' || element.innerHTML.trim() !== '';
        const isBr = element.tagName.toLowerCase() === 'br';
        return hasText || isBr;
      });

      // Store the text elements for later use
      modalBody.dataset.textElements = JSON.stringify(textElements.map(el => ({
        tagName: el.tagName,
        innerHTML: el.innerHTML,
        textContent: el.textContent
      })));

      // Hide all original text elements immediately
      textElements.forEach((element) => {
        element.dataset.originalDisplay = element.style.display;
        element.dataset.originalVisibility = element.style.visibility;
        element.style.display = 'none';
        element.style.visibility = 'hidden';
      });

      // Hide the flower image immediately
      const flowerImage = outroModal.querySelector('.modal-image');
      if (flowerImage) {
        flowerImage.dataset.originalOpacity = flowerImage.style.opacity || '1';
        flowerImage.dataset.originalTransition = flowerImage.style.transition || '';
        flowerImage.style.opacity = '0';
        flowerImage.style.transition = 'none';
      }
    });
  }

  // Create line elements from text content
  createLineElements(modalBody) {
    const lines = [];
    const textElements = Array.from(modalBody.children).filter(element => {
      return element.textContent.trim() !== '' || element.innerHTML.trim() !== '';
    });

    textElements.forEach((element) => {
      element.dataset.originalHTML = element.innerHTML;

      if (element.tagName.toLowerCase() === 'br') {
        lines.push(this.createBreakElement(element));
      } else {
        const content = element.innerHTML;
        const lineParts = content.split(/<br\s*\/?>/i);

        lineParts.forEach((lineContent, lineIndex) => {
          if (lineContent.trim() === '') {
            lines.push(this.createBreakElement(element, lineIndex));
          } else {
            lines.push(this.createTextElement(element, lineContent.trim(), lineIndex));
          }
        });
      }
    });

    // Add manual break after poem
    lines.splice(OUTRO_BREAK_INSERT_INDEX, 0, this.createBreakElement(null));

    return lines;
  }

  // Create a break element
  createBreakElement(originalElement, lineIndex = 0) {
    const brElement = document.createElement('br');
    brElement.dataset.originalElement = originalElement;
    brElement.dataset.lineIndex = lineIndex;
    brElement.dataset.isBreak = 'true';
    return brElement;
  }

  // Create a text element
  createTextElement(originalElement, content, lineIndex) {
    const lineElement = originalElement.cloneNode(false);
    lineElement.innerHTML = content;
    lineElement.dataset.originalElement = originalElement;
    lineElement.dataset.lineIndex = lineIndex;
    return lineElement;
  }

  // Setup line elements for animation
  setupLineElements(lines, modalBody) {
    lines.forEach((lineElement) => {
      if (lineElement.dataset.isBreak === 'true') {
        CameraAnimator.setElementStyles(lineElement, {
          visibility: 'hidden',
          opacity: '0'
        });
      } else {
        // Store original styles
        ['position', 'top', 'left', 'transform', 'opacity', 'transition', 'margin'].forEach(prop => {
          lineElement.dataset[`original${prop.charAt(0).toUpperCase() + prop.slice(1)}`] = lineElement.style[prop] || '';
        });

        // Set initial animation state
        CameraAnimator.setElementStyles(lineElement, {
          position: 'static',
          opacity: '0',
          transition: 'none',
          margin: '0',
          display: 'block',
          visibility: 'visible'
        });
      }
      modalBody.appendChild(lineElement);
    });
  }

  // Start time counter updates
  startTimeCounterUpdates(lineElement, fadeInDuration) {
    setTimeout(() => {
      const updateTimeCounter = () => {
        lineElement.innerHTML = CameraAnimator.calculateTimeCounterText();
      };
      updateTimeCounter();
      const intervalId = setInterval(updateTimeCounter, 1000);
      lineElement.dataset.timeCounterInterval = intervalId;
    }, fadeInDuration);
  }

  // Animate a single line
  animateLine(lineElement, index, totalLines, fadeInDuration) {
    const fadeIn = () => {
      CameraAnimator.setElementStyles(lineElement, {
        transition: `opacity ${fadeInDuration}ms ease-in`,
        opacity: '1'
      });
    };

    if (lineElement.dataset.isBreak === 'true') {
      lineElement.style.visibility = 'visible';
      fadeIn();
    } else if (lineElement.classList.contains('time-counter')) {
      fadeIn();
      this.startTimeCounterUpdates(lineElement, fadeInDuration);
    } else {
      fadeIn();
    }

    // Animate flower image after last line
    if (index === totalLines - 1) {
      setTimeout(() => {
        this.animateFlowerImage();
      }, fadeInDuration + 500);
    }
  }

  // Animate outro modal body lines with simple fade-in effect
  animateOutroModalLines() {
    const outroModal = document.getElementById('outro');
    if (!outroModal) return;

    const modalBody = outroModal.querySelector('.modal-body .modal-column:first-child');
    if (!modalBody) return;

    const lines = this.createLineElements(modalBody);
    if (lines.length === 0) return;

    this.setupLineElements(lines, modalBody);

    // Animate each line with staggered timing
    lines.forEach((lineElement, index) => {
      const delay = index * OUTRO_LINE_DELAY;
      const fadeInDuration = OUTRO_FADE_IN_DURATION;

      setTimeout(() => {
        this.animateLine(lineElement, index, lines.length, fadeInDuration);
      }, delay);
    });
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

      // Trigger compass glow effect during the zoom - defer material change to avoid stuttering
      if (progress >= 0.3 && !this.compassGlowTriggered) {
        this.compassGlowTriggered = true;
        // Defer material change to next frame to avoid stuttering during camera animation
        requestAnimationFrame(() => {
          setTimeout(() => {
            // Set the glow material but start at 0 intensity to avoid blink
            if (this.compassLightObj && this.compassLightMaterials.on) {
              this.compassLightObj.material = this.compassLightMaterials.on;
              this.compassLightMaterials.on.emissiveIntensity = 0; // Start at 0
            }
            this.animateCompassGlowFadeIn();
          }, COMPASS_GLOW_DELAY * 1000);
        });
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

        // Show the outro modal after completion zoom - defer to avoid stuttering
        // Use requestAnimationFrame to ensure camera animation is completely finished
        requestAnimationFrame(() => {
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

              // Hide original text immediately and start the line animation after modal fade-in
              this.prepareOutroAnimation();
              setTimeout(() => {
                this.animateOutroModalLines();
              }, OUTRO_FADE_DURATION + OUTRO_ANIMATION_DELAY);

              // Optionally, focus the modal for accessibility
              outroModal.focus?.();
            } else {
              console.error('Outro modal element not found!');
            }
          }, OUTRO_DELAY); // Small delay after zoom completes
        });

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
    if (!this.scene) {
      console.warn('Scene not available. Make sure setScene() was called.');
      return;
    }

    const compassGroup = this.scene.getObjectByName('Graphic_Compass');
    if (compassGroup) {
      if (compassGroup.isMesh && compassGroup.material) {
        this.compassLightObj = compassGroup;
        this.initCompassLightMaterials();
        this.startCompassGlow();
        return;
      }

      const lightObjects = compassGroup.children.filter(child =>
        child.material?.name === 'Light_Display' ||
        child.material?.name === 'Compass_Light' ||
        child.name.toLowerCase().includes('light') ||
        child.isMesh
      );

      if (lightObjects.length > 0) {
        this.compassLightObj = lightObjects[0];
        this.initCompassLightMaterials();
        this.startCompassGlow();
        return;
      }
    }

    // Try Compass_Graphic specifically
    const compassGraphic = this.scene.getObjectByName('Compass_Graphic');
    if (compassGraphic && compassGraphic.isMesh && compassGraphic.material) {
      this.compassLightObj = compassGraphic;
      this.initCompassLightMaterials();
      this.startCompassGlow();
      return;
    }

    console.warn('Compass light object not found. Make sure Graphic_Compass element exists in the scene.');
  }

  // Helper method to start compass glow - optimized to avoid stuttering
  startCompassGlow() {
    if (this.compassLightObj && this.compassLightMaterials.on) {
      // Defer material change to next frame to avoid stuttering
      requestAnimationFrame(() => {
        this.compassLightObj.material = this.compassLightMaterials.on;
        this.compassLightMaterials.on.emissiveIntensity = 0;
      });
    }
    this.animateCompassGlowFadeIn();
  }

  // Animate the flower image in the outro modal
  animateFlowerImage() {
    const outroModal = document.getElementById('outro');
    if (!outroModal) return;

    const flowerImage = outroModal.querySelector('.modal-image');
    if (!flowerImage) return;


    // Fade in the flower image
    flowerImage.style.transition = `opacity ${OUTRO_FADE_IN_DURATION}ms ease-in`;
    flowerImage.style.opacity = '1';
  }

  // Debug method to restart the outro text animation
  debugRestartOutroAnimation() {


    const outroModal = document.getElementById('outro');
    if (!outroModal) {
      console.error('Outro modal not found!');
      return;
    }

    // Make sure the modal is visible
    if (outroModal.style.display !== 'block') {
      outroModal.style.display = 'block';
      outroModal.style.opacity = '1';
    }

    // Reset all text elements to their original state first
    const modalBody = outroModal.querySelector('.modal-body .modal-column:first-child');
    if (!modalBody) {
      console.error('Modal body not found!');
      return;
    }

    // Remove any existing animated line elements
    const existingAnimatedLines = modalBody.querySelectorAll('[data-original-element]');
    existingAnimatedLines.forEach(line => line.remove());

    // Also remove any standalone <br> elements that were added
    const standaloneBreaks = modalBody.querySelectorAll('br[data-is-break]');
    standaloneBreaks.forEach(br => br.remove());

    // Reset original elements to their original state
    const textElements = Array.from(modalBody.children).filter(element => {
      return element.textContent.trim() !== '' || element.innerHTML.trim() !== '';
    });

    textElements.forEach((element) => {
      // Restore original HTML if it was stored
      if (element.dataset.originalHTML) {
        element.innerHTML = element.dataset.originalHTML;
      }

      // Restore original display and visibility state
      element.style.display = element.dataset.originalDisplay || '';
      element.style.visibility = element.dataset.originalVisibility || '';

      // Clear any existing animation styles
      element.style.opacity = element.dataset.originalOpacity || '1';
      element.style.transition = element.dataset.originalTransition || 'none';
    });

    // Restore original height
    modalBody.style.minHeight = '';

    // Reset flower image
    const flowerImage = outroModal.querySelector('.modal-image');
    if (flowerImage) {
      flowerImage.style.opacity = flowerImage.dataset.originalOpacity || '';
      flowerImage.style.transition = flowerImage.dataset.originalTransition || '';
    }


    // Force a reflow
    void modalBody.offsetWidth;

    // Start the animation
    this.animateOutroModalLines();
  }
}
