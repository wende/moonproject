import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.2
  
  document.body.appendChild(renderer.domElement);

  // Enhanced camera with better settings
  let camera = new THREE.PerspectiveCamera(
    60, // Reduced FOV for more cinematic look
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 5);

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
    0.2,  // strength
    0.3,  // radius
    0.5  // threshold
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
