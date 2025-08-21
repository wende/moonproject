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

    // Apply any saved progress if present
    puzzleManager.loadProgress();
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



function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  mixer.update(delta);
  
  // Update animated materials
  materialManager.updateAnimatedMaterials(delta);
  
  // Update particle effects
  particleSystem.update(delta);

  controls.update();
  composer.render();
}

animate();