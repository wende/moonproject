import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function setupControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 2.5;
  controls.maxDistance = 12;

  return controls;
}
