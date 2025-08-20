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
import { audioManager } from './audio';
import { createAudioToggleButton } from './audioControls';
import { materialManager } from './materials';
import { ParticleSystem } from './particles';
import { CameraAnimator } from './cameraAnimator';

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
    console.log(Object.keys(actions));

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

    // Expose helpers for skipping to a specific puzzle from the browser console
    window.puzzleManager = puzzleManager;
    window.puzzles = {
      start: startPuzzle,
      maze: mazePuzzle,
      scales: scalesPuzzle,
      moon: moonPuzzle,
      cipher: cipherPuzzle,
    };
    window.cameraAnimator = cameraAnimator;
    window.skipTo = (target) => {
      intro.style.display = 'none';
      const order = ['start', 'maze', 'scales', 'moon', 'cipher', 'end'];
      const index = typeof target === 'number'
        ? target
        : order.indexOf(String(target).toLowerCase());
      if (index < 0 || index > order.length - 1) {
        console.warn('skipTo: invalid target. Use name or index from', order);
        return;
      }
      
      // Complete puzzles up to the target
      for (let i = 0; i < index; i++) {
        const key = order[i];
        const puzzle = window.puzzles[key];
        if (puzzle && !puzzle.isCompleted) {
          puzzle.markAsCompleted();
        }
      }
      
      // Animate camera to the target puzzle position
      if (index < order.length - 1) { // Don't animate for 'end'
        const targetPuzzle = order[index];
        setTimeout(() => {
          cameraAnimator.goToPuzzle(targetPuzzle);
        }, 500); // Small delay to let puzzle completion effects play
      }
    };

    // Add camera control helpers
    window.goToPuzzle = (puzzleName) => {
      cameraAnimator.goToPuzzle(puzzleName);
    };

    window.getPuzzlePositions = () => {
      return cameraAnimator.getPuzzlePositions();
    };

    // Test camera animation
    window.testCameraAnimation = () => {
      console.log('Testing camera animation...');
      cameraAnimator.goToPuzzle('maze');
    };

    // Apply any saved progress if present
    puzzleManager.loadProgress();
  });

setupUI();

// Initialize audio system and create audio toggle button after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  createAudioToggleButton();
});

// Function to start music after user interaction
function startMusicAfterInteraction() {
  console.log('Starting music after user interaction...');
  // Initialize audio first if not already done
  audioManager.initialize().then(() => {
    const musicSource = audioManager.playMusic('moonost', { fadeIn: 2.0, loopTimeout: 3.0 });
    if (musicSource) {
      console.log('Moonost music started successfully');
    } else {
      console.warn('Failed to start moonost music');
    }
  }).catch(error => {
    console.error('Failed to initialize audio:', error);
  });
  
  // Remove the event listener after first interaction
  document.removeEventListener('click', startMusicAfterInteraction);
  document.removeEventListener('keydown', startMusicAfterInteraction);
  document.removeEventListener('touchstart', startMusicAfterInteraction);
}

// Wait for user interaction before starting music (browser requirement)
document.addEventListener('click', startMusicAfterInteraction);
document.addEventListener('keydown', startMusicAfterInteraction);
document.addEventListener('touchstart', startMusicAfterInteraction);

// handle mouse stuff
setupInput(raycaster, mouse, camera, puzzleManager, renderer.domElement);

const clock = new THREE.Clock();

// Function to enhance model materials
function enhanceModelMaterials(scene) {
  console.log('enhanceModelMaterials called with scene:', scene);
  let meshCount = 0;
  
  scene.traverse((object) => {
    if (object.isMesh) {
      meshCount++;
      
      // Enable shadows for all meshes
      object.castShadow = true;
      object.receiveShadow = true;
      
      
      
      // Apply specific enhanced materials for certain objects (excluding brass and buttons)
      if (object.name.toLowerCase().includes('metal') && 
          !object.name.toLowerCase().includes('brass') && 
          !object.name.toLowerCase().includes('button')) {
        materialManager.applyEnhancedMaterials(object, 'enhancedMetal');
      } else if (object.name.toLowerCase().includes('wood') && 
                 !object.name.toLowerCase().includes('brass')) {
        materialManager.applyEnhancedMaterials(object, 'enhancedWood');
      } else if (object.name.toLowerCase().includes('glass') && 
                 !object.name.toLowerCase().includes('brass')) {
        materialManager.applyEnhancedMaterials(object, 'glass');
      } else if (object.name.toLowerCase().includes('light') && 
                 !object.name.toLowerCase().includes('brass')) {
        materialManager.applyEnhancedMaterials(object, 'glowing');
      }
      // Note: Brass and buttons keep their original materials completely untouched
    }
  });
  
  console.log('Total meshes processed:', meshCount);
}

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
