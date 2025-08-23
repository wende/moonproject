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

const { scene, renderer, camera, mixer, mouse, raycaster, composer } = setupScene();
const controls = setupControls(camera, renderer);
const puzzleManager = new PuzzleManager();
const particleSystem = new ParticleSystem(scene);

// Initialize camera animator
const cameraAnimator = new CameraAnimator(camera, controls);
puzzleManager.setCameraAnimator(cameraAnimator);

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

  });

setupUI();

// Update HTML content with translations
updateHTMLContent();

// Initialize audio system and create audio toggle button after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  createAudioToggleButton();
  initializeAudioSystem();
});

// Wait for user interaction before starting music (browser requirement)
// Use more specific event listeners to avoid audio control interference
document.addEventListener('click', startMusicAfterInteraction, { passive: true });
document.addEventListener('keydown', startMusicAfterInteraction, { passive: true });
document.addEventListener('touchstart', startMusicAfterInteraction, { passive: true });

// handle mouse stuff
setupInput(raycaster, mouse, camera, puzzleManager, renderer.domElement);

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

// Background animation function
function updateBackgroundAnimation(delta) {
  const background = scene.userData.earthBackground;
  if (background) {
    const time = Date.now() * 0.0001;
    
    // Position stars to always be visible
    const camera = window.PuzzleBox?.camera;
    if (camera && background.stars) {
      // Position stars relative to camera but in a way that ensures visibility
      background.stars.position.copy(camera.position);
      // Move stars in the opposite direction of camera look direction
      const lookDirection = new THREE.Vector3();
      camera.getWorldDirection(lookDirection);
      background.stars.position.add(lookDirection.multiplyScalar(-500));
    }
    
    // Subtle nebula pulsing
    const nebulaPulse = Math.sin(time * 2) * 0.05 + 0.95;
    background.nebula.material.opacity = 0.1 * nebulaPulse;
    
    // Twinkling stars effect
    const starSizes = background.stars.geometry.attributes.size.array;
    const originalSizes = background.stars.userData.originalSizes;
    for (let i = 0; i < starSizes.length; i++) {
      const twinkle = Math.sin(time * 3 + i * 0.1) * 0.3 + 0.7;
      starSizes[i] = originalSizes[i] * twinkle;
    }
    background.stars.geometry.attributes.size.needsUpdate = true;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  mixer.update(delta);
  
  // Update animated materials
  materialManager.updateAnimatedMaterials(delta);
  
  // Update particle effects
  particleSystem.update(delta);
  
  // Update background animation
  updateBackgroundAnimation(delta);

  controls.update();
  composer.render();
}

animate();