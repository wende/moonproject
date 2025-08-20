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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8
  //renderer.outputColorSpace = THREE.SRGBColorSpace;
  //renderer.setClearColor(0x000000, 0);
  
  document.body.appendChild(renderer.domElement);

  // Enhanced camera with better settings
  let camera = new THREE.PerspectiveCamera(
    60, // Reduced FOV for more cinematic look
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 5);

  // Advanced lighting setup
  //setupAdvancedLighting(scene);

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

function setupAdvancedLighting(scene) {
  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0x404040, 0.02);
  ///scene.add(ambientLight);

  // Main directional light with shadows
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.08);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  directionalLight.shadow.bias = -0.0001;
  //scene.add(directionalLight);

  // Fill light for softer shadows
  const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.025);
  fillLight.position.set(-5, 5, -5);
  //scene.add(fillLight);

  // Rim light for depth (removed yellow tint)
  const rimLight = new THREE.DirectionalLight(0x87ceeb, 0.015);
  rimLight.position.set(0, 5, -10);
  //scene.add(rimLight);

  // Point light for atmospheric effect
  const pointLight = new THREE.PointLight(0x4a90e2, 0.5, 20);
  pointLight.position.set(0, 3, 0);
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.width = 512;
  pointLight.shadow.mapSize.height = 512;
  //scene.add(pointLight);

  // Add subtle fog for depth
  scene.fog = new THREE.Fog(0x000000, 15, 150);
}

function setupPostProcessing(scene, camera, renderer) {
  const composer = new EffectComposer(renderer);
  
  // Render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom effect for glowing elements
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,  // strength
    0.4,  // radius
    0.85  // threshold
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
