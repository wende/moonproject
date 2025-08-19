import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// scene, renderer elements
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// updates animation every frame
const clock = new THREE.Clock();

// create backup camera
let currentCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
currentCamera.position.set(0, 2, 5);
currentCamera.aspect = window.innerWidth / window.innerHeight;
currentCamera.updateProjectionMatrix();

// orbit functionality
const controls = new OrbitControls(currentCamera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2.5;
controls.maxDistance = 12;

// raycast/mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// interactive buttons
const interactiveObjects = [];

// mixer for animations
let mixer;
const actions = {};
let gltfAnimations = [];


function loadGLTFModel(modelFilePath) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      modelFilePath,
      (gltf) => {
        scene.add(gltf.scene);

        // populate gltfAnimations and expose globally
        gltfAnimations = gltf.animations;
        // window.gltfAnimations = gltf.animations;

        // set up animation mixer
        mixer = new THREE.AnimationMixer(gltf.scene);

        gltf.scene.traverse((child) => {
          if (child.isMesh && child.name.startsWith('Press_Button_')) {
            // save button obj to list for later
            interactiveObjects.push(child);

            // determine the action name for associated button
            const actionName = child.name;

            // store action name on parent bone obj
            const parentBone = child.parent;

            if (actionName && parentBone) {
              const clip = THREE.AnimationClip.findByName(gltf.animations, actionName);

              if (clip) {
                const action = mixer.clipAction(clip, parentBone);
                child.userData.animationAction = action;
              }

              console.log(
                `button: ${child.name}, parent bone: ${parentBone}, loaded action: ${actionName}`
              );
            } else {
              console.warn(`no action found for button: ${child.name}`);
            }
          }
        });

        // Set up the GLTF camera if available
        if (gltf.cameras.length > 0) {
          currentCamera = gltf.cameras[0];
          controls.object = currentCamera;
          currentCamera.aspect = window.innerWidth / window.innerHeight;
          currentCamera.updateProjectionMatrix();
        }

        console.log('GLTF loaded successfully:', gltf);
        resolve(gltf); // Resolve the promise when the model is fully loaded
      },
      undefined,
      (error) => {
        console.error('Error loading GLTF:', error);
        reject(error); // Reject the promise if there's an error
      }
    );
  });
}

function handleButtonClick(button) {
  const action = button.userData.animationAction;

  if (action) {
    action.reset();
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.play();
    console.log(`Playing animation: ${action}`);
  } else {
    console.warn(`no animation found for button: ${button}`);
  }
}

// animation player
function playAnimation(animName) {
  if (!mixer || gltfAnimations.length === 0) {
    console.warn('No animations loaded or mixer is not initialized.');
    return;
  }

  console.log('Available animations:', gltfAnimations.map((clip) => clip.name));
  console.log(`Searching for animation: ${animName}`);

  const clip = THREE.AnimationClip.findByName(gltfAnimations, animName);
  if (!clip) {
    console.warn(`Animation '${animName}' not found.`);
    return;
  }

  const action = mixer.clipAction(clip);

  // Always reset the action before playing
  action.reset();
  action.setLoop(THREE.LoopOnce); // Ensure it plays only once
  action.clampWhenFinished = true; // Retain final frame state
  action.play();

  console.log(`Playing animation: ${clip.name}`);
}

window.playAnimation = playAnimation;

class Puzzle {
  constructor(actions) {
    this.actions = actions;
    this.isCompleted = false;
    this.interactiveButtons = [];
  }

  handleButtonClick(button) {
    if (this.isCompleted) {
      console.log('Puzzle already complete. Button clicks will be ignored.');
      return;
    }
    console.warn('handleButtonClick should be implemented in child classes');
  }

  markAsCompleted() {
    this.isCompleted = true;

    // empties interactive objects array of buttons from this puzzle
    puzzleManager.interactiveObjects = puzzleManager.interactiveObjects.filter((object) => {
      // return needed?
      return !this.interactiveButtons.includes(object);
    });

    // ensure interactive buttons array is empty (just in case)
    this.interactiveButtons.length = 0;

    console.log('Puzzle marked as complete. Interactions disabled.');
  }

  registerButton(button) {
    this.interactiveButtons.push(button);
    puzzleManager.registerButton(button);
  }

  playAnimation(name) {
    if (!this.actions || !this.actions[name]) {
      console.warn(`Animation not found: ${name}`);
      return;
    }
    const action = this.actions[name];
    action.reset();
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.play();
    console.log(`Playing animation: ${name}`);
  }
}

class DirectionPuzzle extends Puzzle {
  constructor(actions) {
    super(actions);
    this.sequences = [
      {
        sequence: ['S', 'W', 'E', 'N'],
        solved: false
      },
      {
        sequence: ['E', 'N', 'W', 'W', 'S', 'N', 'E', 'S'],
        solved: false
      },
      {
        sequence: ['N', 'W', 'S', 'W', 'N', 'W', 'N', 'E', 'N', 'E', 'N', 'W', 'N'],
        solved: false
      },
    ];
    this.workingArray = Array(13).fill(null);
    this.solvedSequences = 0;
    this.isFullySolved = false;
    console.log('Direction Puzzle initialized');
  }

  handleButtonClick(button) {
    const direction = this.getDirectionFromButton(button.name);

    if (!direction) {
      console.warn(`Unknown button: ${button.name}`);
      return;
    }

    this.workingArray.push(direction);
    this.workingArray.shift();
    console.log(this.workingArray);

    this.checkSequences(direction);
  }

  getDirectionFromButton(buttonName) {
    const mapping = {
      Press_Button_Directional_S: 'S',
      Press_Button_Directional_W: 'W',
      Press_Button_Directional_E: 'E',
      Press_Button_Directional_N: 'N',
    };
    return mapping[buttonName] || null;
  }

  checkSequences(lastDirection) {
    this.sequences.forEach((sequenceObj) => {
      if (sequenceObj.solved) return;

      const isSequenceSolved = this.workingArray.some((_, startIndex) => {
        // don't continue if not enough elements in working array
        if (startIndex + sequenceObj.sequence.length > this.workingArray.length) {
          return false;
        }

        // only returns true when matching subsequence found
        const subsequence = this.workingArray.slice(startIndex, startIndex + sequenceObj.sequence.length);
        return JSON.stringify(subsequence) === JSON.stringify(sequenceObj.sequence);
      });

      if (isSequenceSolved) {
        sequenceObj.solved = true;
        this.solvedSequences++;
      }
    });

    this.isFullySolved = this.solvedSequences === this.sequences.length;

    if (this.isFullySolved) {
      this.markAsCompleted();
    }
  }
}

class PuzzleManager {
  constructor() {
    this.puzzles = [];
    this.interactiveObjects = [];
  }

  addPuzzle(puzzle) {
    this.puzzles.push(puzzle);
  }

  registerButton(button) {
    this.interactiveObjects.push(button);
  }

  handleClick(button) {
    this.puzzles.forEach((puzzle) => {
      if (!puzzle.isCompleted) {
        puzzle.handleButtonClick(button);
      }
    });
  }
}


loadGLTFModel('/puzzlebox.glb')
  .then((gltf) => {
    gltf.scene.traverse((child) => {
      if (child.isMesh && child.name.startsWith('Press_Button_Directional_')) {
        directionPuzzle.registerButton(child);
      }
    });
    console.log('Animations loaded:', gltfAnimations.map((clip) => clip.name));
  })
  .catch((error) => {
    console.error('Failed to load GLTF model:', error);
  });

// handle window resize
window.addEventListener('resize', () => {
  currentCamera.aspect = window.innerWidth / window.innerHeight;
  currentCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const directionPuzzle = new DirectionPuzzle(actions);

window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, currentCamera);

  const intersects = raycaster.intersectObjects(interactiveObjects);

  if (intersects.length > 0) {
    const clickedButton = intersects[0].object;
    handleButtonClick(clickedButton);
    directionPuzzle.handleButtonClick(clickedButton);
  }
});

// animation loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) {
    mixer.update(delta);
  }

  controls.update();
  renderer.render(scene, currentCamera);
}


// modal code
const intro = document.getElementById('intro');
const introBtn = document.getElementById('intro-button');
const introClose = document.getElementById('intro-close');

introBtn.addEventListener('click', function() {
  intro.style.display = 'block';
});

introClose.addEventListener('click', function() {
  intro.style.display = 'none';
});

const outro = document.getElementById('outro');
const outroBtn = document.getElementById('outro-button');
const outroClose = document. getElementById('outro-close');

outroBtn.addEventListener('click', function() {
  outro.style.display = 'block';
});

outroClose.addEventListener('click', function() {
  outro.style.display = 'none';
});

animate();
