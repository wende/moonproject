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

const { scene, renderer, camera, mixer, mouse, raycaster } = setupScene();
const controls = setupControls(camera, renderer);
const puzzleManager = new PuzzleManager();

loadGLTFModel('/scene.glb', scene, mixer)
  // destructure return from loadGLTFModel to immediately access values
  .then(({ gltf, actions }) => {
    console.log(Object.keys(actions));

    const findTheMoon = gltf.scene.getObjectByName('FindTheMoon');
    if (findTheMoon) findTheMoon.visible = false;

    


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
      for (let i = 0; i < index; i++) {
        const key = order[i];
        const puzzle = window.puzzles[key];
        if (puzzle && !puzzle.isCompleted) {
          puzzle.markAsCompleted();
        }
      }
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
    const musicSource = audioManager.playMusic('moonost', { fadeIn: 2.0 });
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

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  mixer.update(delta);

  controls.update();
  renderer.render(scene, camera);
}

animate();
