import * as THREE from 'three';
import { setupScene } from './scene';
import { setupControls } from './controls';
import { setupUI } from './ui';
import { setupInput } from './input';
import { PuzzleManager } from './puzzles/PuzzleManager';
import { StartSequencePuzzle } from './puzzles/StartSequencePuzzle';
import { MazeSequencePuzzle } from './puzzles/MazeSequencePuzzle';
import { ScalesPuzzle } from './puzzles/ScalesPuzzle';
import { MoonPuzzle } from './puzzles/MoonPuzzle';
import { CipherSequencePuzzle } from './puzzles/CipherSequencePuzzle';

import { loadGLTFModel } from './loaders';
import { audioManager, startMusicAfterInteraction, initializeAudioSystem } from './audio_html5.js';
import { createAudioToggleButton } from './audioControls';
import { updateHTMLContent } from './htmlContent';
import { materialManager, enhanceModelMaterials } from './materials';
import { ParticleSystem } from './particles';
import { CameraAnimator } from './cameraAnimator';
import { setupDebugHelpers } from './debugHelpers';
import { initializeTimeCounter } from './timeCounter';

// Memory monitoring utility
class MemoryMonitor {
  constructor() {
    this.lastMemoryCheck = Date.now();
    this.memoryCheckInterval = 30000; // Check every 30 seconds
    this.startMonitoring();
  }

  startMonitoring() {
    setInterval(() => {
      this.logMemoryUsage();
    }, this.memoryCheckInterval);
  }

  logMemoryUsage() {
    if (performance.memory) {
      const memory = performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
      
      console.log(`Memory Usage: ${usedMB}MB / ${totalMB}MB (${limitMB}MB limit)`);
      
      // Warn if memory usage is high
      if (usedMB > limitMB * 0.8) {
        console.warn('High memory usage detected! Consider optimizing assets.');
      }
    }
  }

  getMemoryInfo() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }
}

// Initialize memory monitor
const memoryMonitor = new MemoryMonitor();

const { scene, renderer, camera, mixer, mouse, raycaster, composer } = setupScene();
const controls = setupControls(camera, renderer);
const puzzleManager = new PuzzleManager();
const particleSystem = new ParticleSystem(scene);

// Initialize camera animator
const cameraAnimator = new CameraAnimator(camera, controls);
puzzleManager.setCameraAnimator(cameraAnimator);

// Set up star visibility and particle spread updates when puzzles are completed
puzzleManager.onPuzzleComplete((puzzleName, progress) => {
  if (scene.userData.updateStarVisibility) {
    scene.userData.updateStarVisibility(progress);
  }
  
  // Update particle spread based on completion progress
  if (particleSystem) {
    particleSystem.updateParticleSpread(progress);
  }
});

console.log('Camera animator initialized with puzzle positions:', cameraAnimator.getPuzzlePositions());

// Expose debug methods globally for testing
window.debugCamera = {
  goToPuzzle: (puzzleName) => cameraAnimator.debugGoToPuzzle(puzzleName),
  cyclePuzzles: () => cameraAnimator.debugCycleThroughPuzzles(),
  getCurrentPosition: () => cameraAnimator.getCurrentPuzzlePosition(),
  getPuzzlePositions: () => cameraAnimator.getPuzzlePositions()
};

// Expose puzzle manager debug methods
window.debugPuzzles = {
  verifyNames: () => puzzleManager.verifyPuzzleNames(),
  getCompletedNames: () => puzzleManager.getCompletedPuzzleNames(),
  getPuzzleCount: () => puzzleManager.puzzles.length
};

// Expose particle system debug methods
window.debugParticles = {
  getSpreadInfo: () => particleSystem.getCurrentSpreadInfo(),
  getCompletionProgress: () => puzzleManager.getCompletionProgress()
};

// Expose memory monitor debug methods
window.debugMemory = {
  getMemoryInfo: () => memoryMonitor.getMemoryInfo(),
  logMemoryUsage: () => memoryMonitor.logMemoryUsage()
};

loadGLTFModel('/scene.glb', scene, mixer)
  // destructure return from loadGLTFModel to immediately access values
  .then(({ gltf, actions }) => {

    // Create particle effects for atmosphere
    particleSystem.createAllParticles();

    const findTheMoon = gltf.scene.getObjectByName('FindTheMoon');
    if (findTheMoon) findTheMoon.visible = false;

    enhanceModelMaterials(gltf.scene);


    // puzzle setup
    const startPuzzle = new StartSequencePuzzle(actions, gltf.scene);
    const mazePuzzle = new MazeSequencePuzzle(actions, gltf.scene);
    const scalesPuzzle = new ScalesPuzzle(actions, gltf.scene);
    const moonPuzzle = new MoonPuzzle(actions, gltf.scene);
    const cipherPuzzle = new CipherSequencePuzzle(actions, gltf.scene);
    // register puzzles
    puzzleManager.addPuzzle(startPuzzle);
    puzzleManager.addPuzzle(mazePuzzle);
    puzzleManager.addPuzzle(scalesPuzzle);
    puzzleManager.addPuzzle(moonPuzzle);
    puzzleManager.addPuzzle(cipherPuzzle);

    // Verify puzzle names are properly set
    puzzleManager.verifyPuzzleNames();

    puzzleManager.registerButtonsFromGLTF(gltf.scene);

    // Setup debug helpers
    const puzzles = {
      start: startPuzzle,
      maze: mazePuzzle,
      scales: scalesPuzzle,
      moon: moonPuzzle,
      cipher: cipherPuzzle,
    };
    setupDebugHelpers(puzzleManager, cameraAnimator, puzzles);

    // Load saved progress and initialize star visibility and particle spread
    puzzleManager.loadProgress();
    const initialProgress = puzzleManager.getCompletionProgress();
    if (scene.userData.updateStarVisibility) {
      scene.userData.updateStarVisibility(initialProgress);
    }
    
    // Initialize particle spread based on current progress
    if (particleSystem) {
      particleSystem.updateParticleSpread(initialProgress);
    }

    // Setup input handling after model is loaded
    setupInput(raycaster, mouse, camera, puzzleManager, renderer.domElement, gltf.scene, actions);

  });

setupUI();

// Update HTML content with translations
updateHTMLContent();

// Initialize audio system and create audio toggle button after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  createAudioToggleButton();
  initializeAudioSystem();
  initializeTimeCounter();
});

// Wait for user interaction before starting music (browser requirement)
// Use more specific event listeners to avoid audio control interference
document.addEventListener('click', startMusicAfterInteraction, { passive: true });
document.addEventListener('keydown', startMusicAfterInteraction, { passive: true });
document.addEventListener('touchstart', startMusicAfterInteraction, { passive: true });

// handle mouse stuff - will be set up after model loads

const clock = new THREE.Clock();

// Global function to download birthday card
window.downloadBirthdayCard = function() {
  const link = document.createElement('a');
  link.href = '/neshabababa.png';
  link.download = 'neshabababa.png';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Performance optimization constants - adjusted for better balance
const BACKGROUND_UPDATE_INTERVAL = 50; // Update background every 50ms instead of 100ms
const PARTICLE_UPDATE_INTERVAL = 8; // Update particles every 8ms (120fps equivalent)
const MATERIAL_UPDATE_INTERVAL = 16; // Update materials every 16ms (60fps equivalent)

// Background animation function - optimized with throttling
function updateBackgroundAnimation(delta) {
  const background = scene.userData.earthBackground;
  if (background) {
    const time = Date.now() * 0.0001;

    // Position stars to always be visible - only update when camera moves significantly
    const camera = window.PuzzleBox?.camera;
    if (camera && background.stars) {
      // Cache camera position to avoid unnecessary updates
      if (!background.lastCameraPosition) {
        background.lastCameraPosition = camera.position.clone();
      }

      const cameraMoved = camera.position.distanceTo(background.lastCameraPosition) > 0.1;
      if (cameraMoved) {
        background.stars.position.copy(camera.position);
        // Move stars in the opposite direction of camera look direction
        const lookDirection = new THREE.Vector3();
        camera.getWorldDirection(lookDirection);
        background.stars.position.add(lookDirection.multiplyScalar(-500));
        background.lastCameraPosition.copy(camera.position);
      }
    }

    // Subtle nebula pulsing - only update opacity, not geometry
    const nebulaPulse = Math.sin(time * 2) * 0.05 + 0.95;
    if (background.nebula && background.nebula.material) {
      background.nebula.material.opacity = 0.1 * nebulaPulse;
    }

    // Twinkling stars effect - optimize array access
    if (background.stars && background.stars.geometry && background.stars.geometry.attributes.size) {
      const starSizes = background.stars.geometry.attributes.size.array;
      const originalSizes = background.stars.userData.originalSizes;
      if (originalSizes && starSizes.length === originalSizes.length) {
        // Only update every few frames to reduce CPU load
        const updateFrequency = 3; // Update every 3rd frame
        if (Math.floor(time * 100) % updateFrequency === 0) {
          for (let i = 0; i < starSizes.length; i++) {
            const twinkle = Math.sin(time * 3 + i * 0.1) * 0.3 + 0.7;
            starSizes[i] = originalSizes[i] * twinkle;
          }
          background.stars.geometry.attributes.size.needsUpdate = true;
        }
      }
    }
  }
}

// Performance tracking
let backgroundUpdateTime = 0;
let particleUpdateTime = 0;
let materialUpdateTime = 0;

function animate(currentTime) {
  const delta = clock.getDelta();

  // Update mixer (essential for animations)
  mixer.update(delta);

  // Check if camera is animating
  const isCameraAnimating = cameraAnimator.isAnimating;

  // During camera animations, prioritize smooth camera movement
  if (isCameraAnimating) {
    // Skip all expensive operations during camera animations to ensure smooth movement
    // Only update essential components
    mixer.update(delta);

    // Update controls during animation (needed for smooth camera movement)
    if (controls.enabled) {
      controls.update();
    }

    // Render immediately for smooth camera movement
    composer.render();
    requestAnimationFrame(animate);
    return;
  }

  // Normal operation - throttle expensive operations
  if (currentTime - materialUpdateTime > MATERIAL_UPDATE_INTERVAL) {
    materialManager.updateAnimatedMaterials(delta);
    materialUpdateTime = currentTime;
  }

  if (currentTime - particleUpdateTime > PARTICLE_UPDATE_INTERVAL) {
    particleSystem.update(delta);
    particleUpdateTime = currentTime;
  }

  if (currentTime - backgroundUpdateTime > BACKGROUND_UPDATE_INTERVAL) {
    updateBackgroundAnimation(delta);
    backgroundUpdateTime = currentTime;
  }

  // Memory optimization: Periodic cleanup (every 60 seconds)
  if (currentTime % 60000 < 16) { // Check every ~60 seconds
    // Trigger cleanup in various systems
    if (materialManager.cleanupUnusedMaterials) {
      materialManager.cleanupUnusedMaterials();
    }
  }

  // Update controls if they're enabled
  if (controls.enabled) {
    controls.update();
  }

  composer.render();
  requestAnimationFrame(animate);
}

animate();
