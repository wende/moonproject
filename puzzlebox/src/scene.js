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
const CAMERA_FAR = 1000;
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
    powerPreference: "high-performance",
    stencil: false,
    depth: true,
    logarithmicDepthBuffer: false
  });
  
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
