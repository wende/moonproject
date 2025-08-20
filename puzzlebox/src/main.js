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

const { scene, renderer, camera, mixer, mouse, raycaster, composer } = setupScene();
const controls = setupControls(camera, renderer);
const puzzleManager = new PuzzleManager();
const particleSystem = new ParticleSystem(scene);

loadGLTFModel('/scene.glb', scene, mixer)
  // destructure return from loadGLTFModel to immediately access values
  .then(({ gltf, actions }) => {
    console.log(Object.keys(actions));

    // Create particle effects for atmosphere
    particleSystem.createAllParticles();

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
    intro.style.display = 'none';
    window.skipTo = (target) => {
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
      console.log('Found mesh:', object.name, 'Material:', object.material ? 'Yes' : 'No');
      
      // Enable shadows for all meshes
      object.castShadow = true;
      object.receiveShadow = true;
      
      // Only modify materials for specific objects, enhance brass for polish
      if (object.material) {
        console.log('Processing material for:', object.name, 'Type:', object.material.type);
        
        // Special handling for brass - log and try to restore original properties
        if (object.name.toLowerCase().includes('brass')) {
          console.log('BRASS MATERIAL FOUND:', object.name);
          console.log('Current properties:', {
            roughness: object.material.roughness,
            metalness: object.material.metalness,
            envMapIntensity: object.material.envMapIntensity,
            clearcoat: object.material.clearcoat,
            color: object.material.color ? object.material.color.getHexString() : 'none'
          });
          
          // Try to restore brass to typical brass properties
          object.material.roughness = 0.2;
          object.material.metalness = 0.8;
          object.material.envMapIntensity = 1.0;
          object.material.clearcoat = 0.0;
          object.material.clearcoatRoughness = 0.0;
        }
        
        // Apply changes to materials (except buttons and brass)
        if (!object.name.toLowerCase().includes('button') && 
            !object.name.toLowerCase().includes('brass')) {
          // Focus on making wood less reflective
          if (object.name.toLowerCase().includes('wood')) {
            
            // Make wood much less reflective
            if (object.material.envMapIntensity !== undefined) {
              object.material.envMapIntensity = 0.1; // Very low reflection for wood
            }
            if (object.material.metalness !== undefined) {
              object.material.metalness = 0.0; // No metalness for wood
            }
            if (object.material.roughness !== undefined) {
              object.material.roughness = Math.max(object.material.roughness, 0.8); // Very rough wood
            }
            if (object.material.clearcoat !== undefined) {
              object.material.clearcoat = 0.0; // No clearcoat for wood
            }
          } else {
            
            if (object.material.envMapIntensity !== undefined) {
              object.material.envMapIntensity = 0.3; // Low reflection
            }
            if (object.material.metalness !== undefined) {
              object.material.metalness = Math.min(object.material.metalness * 0.6, 0.7); // Reduce metalness
            }
            if (object.material.roughness !== undefined) {
              object.material.roughness = Math.max(object.material.roughness, 0.3); // Increase roughness
            }
            if (object.material.clearcoat !== undefined) {
              object.material.clearcoat = 0.2; // Low clearcoat
            }
          }
        }
        
        // Mark material for update
        object.material.needsUpdate = true;
      }
      
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
