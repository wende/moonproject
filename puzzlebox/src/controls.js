import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function setupControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 2.5;
  controls.maxDistance = 12;

  // Add method to disable/enable controls during animations
  controls.setEnabled = function(enabled) {
    this.enabled = enabled;
  };

  return controls;
}
