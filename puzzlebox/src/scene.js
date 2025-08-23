import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Scene and camera constants
const CAMERA_FOV = 60;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 3000; // Much larger to ensure stars are visible
const CAMERA_INITIAL_POSITION = [0, 2, 5];
const MAX_PIXEL_RATIO = 2;
const TONE_MAPPING_EXPOSURE = 1.2;
const BLOOM_STRENGTH = 0.2;
const BLOOM_RADIUS = 0.3;
const BLOOM_THRESHOLD = 0.5;

export function setupScene() {
  const scene = new THREE.Scene();

  // Enhanced renderer with better settings
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
    logarithmicDepthBuffer: false
  });

  // Add cosmic background
  setupCosmicBackground(scene);

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;

  document.body.appendChild(renderer.domElement);

  // Enhanced camera with better settings
  let camera = new THREE.PerspectiveCamera(
    CAMERA_FOV, // Reduced FOV for more cinematic look
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR
  );
  camera.position.set(...CAMERA_INITIAL_POSITION);

  const mixer = new THREE.AnimationMixer(scene);
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  // Post-processing setup
  const composer = setupPostProcessing(scene, camera, renderer);

  // handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, renderer, camera, mixer, mouse, raycaster, composer };
}

function setupPostProcessing(scene, camera, renderer) {
  const composer = new EffectComposer(renderer);

  // Render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom effect for glowing elements
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    BLOOM_STRENGTH,  // strength
    BLOOM_RADIUS,  // radius
    BLOOM_THRESHOLD  // threshold
  );
  composer.addPass(bloomPass);

  // Anti-aliasing
  const fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * renderer.getPixelRatio());
  fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * renderer.getPixelRatio());
  composer.addPass(fxaaPass);

  // Output pass for proper color space
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return composer;
}

function setupCosmicBackground(scene) {
  // Remove Earth sphere - just use stars and nebula for cleaner look

  // Add stars to the background
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 3000; // More stars to fill the larger space
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    // Position stars in a very large cube to ensure they're always visible
    const size = 500; // Very large size to ensure coverage
    starPositions[i * 3] = (Math.random() - 0.5) * size; // X
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * size; // Y
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * size; // Z

    // Vary star colors (white, blue, yellow)
    const starType = Math.random();
    if (starType < 0.7) {
      // White stars
      starColors[i * 3] = 1;
      starColors[i * 3 + 1] = 1;
      starColors[i * 3 + 2] = 1;
    } else if (starType < 0.85) {
      // Blue stars
      starColors[i * 3] = 0.7;
      starColors[i * 3 + 1] = 0.8;
      starColors[i * 3 + 2] = 1;
    } else {
      // Yellow stars
      starColors[i * 3] = 1;
      starColors[i * 3 + 1] = 0.9;
      starColors[i * 3 + 2] = 0.7;
    }

    // Vary star sizes
    starSizes[i] = 0.1 + Math.random() * 0.3;
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  starsGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

  const starsMaterial = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    //blending: THREE.NormalBlending,
    sizeAttenuation: true,
    depthWrite: false, // Prevent depth buffer issues
    depthTest: true   // Ensure stars always render
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  stars.userData = { originalSizes: [...starSizes] };
  stars.frustumCulled = false; // Disable frustum culling to prevent stars from disappearing
  stars.renderOrder = -1; // Render stars first (behind everything)
  scene.add(stars);

  // Add a subtle nebula effect
  const nebulaGeometry = new THREE.SphereGeometry(70, 32, 32);
  const nebulaMaterial = new THREE.MeshBasicMaterial({
    color: 0x1a2a4a, // Deep navy blue nebula
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
  });

  const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
  nebula.position.set(0, 0, -60);
  nebula.frustumCulled = false; // Disable frustum culling for nebula
  scene.add(nebula);

  // Store references for animation
  scene.userData.earthBackground = {
    stars,
    nebula,
    originalStarOpacity: 0.8 // Store original opacity for reference
  };

  // Function to update star visibility based on puzzle completion
  scene.userData.updateStarVisibility = function(completionProgress) {
    const background = scene.userData.earthBackground;
    if (background && background.stars && background.stars.material) {
      // Star opacity progression:
      // Puzzles 0-1: 0 opacity
      // Puzzle 2: 0.5 opacity
      // Puzzle 3: 0.9 opacity
      // Puzzle 4: 1.0 opacity
      let starOpacity;
      if (completionProgress <= 0.4) { // First 2 puzzles (0.4 = 2/5)
        starOpacity = 0;
      } else if (completionProgress <= 0.6) { // Puzzle 3 (0.6 = 3/5)
        starOpacity = 0.5;
      } else if (completionProgress <= 0.8) { // Puzzle 4 (0.8 = 4/5)
        starOpacity = 0.9;
      } else { // Puzzle 4 completed (1.0 = 5/5)
        starOpacity = 1.0;
      }
      
      // Calculate final star opacity (0 to 0.8 range)
      const finalStarOpacity = starOpacity * background.originalStarOpacity;
      
      // Smooth transition for star opacity
      const currentOpacity = background.stars.material.opacity;
      const opacityDiff = finalStarOpacity - currentOpacity;
      if (Math.abs(opacityDiff) > 0.01) {
        background.stars.material.opacity = finalStarOpacity;
      }
      
      // Also increase star size based on star opacity
      const minSize = 0.3;
      const maxSize = 0.5;
      const newSize = minSize + (maxSize - minSize) * starOpacity;
      background.stars.material.size = newSize;
      
      // Update nebula visibility based on star opacity
      if (background.nebula && background.nebula.material) {
        const minNebulaOpacity = 0.05;
        const maxNebulaOpacity = 0.15;
        const newNebulaOpacity = minNebulaOpacity + (maxNebulaOpacity - minNebulaOpacity) * starOpacity;
        background.nebula.material.opacity = newNebulaOpacity;
      }
      
      console.log(`Stars updated: opacity=${finalStarOpacity.toFixed(2)}, size=${newSize.toFixed(2)}, progress=${(completionProgress * 100).toFixed(0)}%, starOpacity=${starOpacity.toFixed(1)}`);
    }
  };
}
