import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function setupControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);

  // Performance optimizations
  controls.enableDamping = true;
  controls.dampingFactor = 0.05; // Reduced from default 0.05 for smoother movement
  controls.enablePan = false;
  controls.minDistance = 2.5;
  controls.maxDistance = 24;

  // Reduce sensitivity for smoother rotation
  controls.rotateSpeed = 0.8; // Slightly reduced from default 1.0
  controls.zoomSpeed = 0.8; // Slightly reduced from default 1.0

  // Disable auto-rotation to save performance
  controls.autoRotate = false;

  // Optimize for touch devices
  controls.enableKeys = false; // Disable keyboard controls to save performance
  controls.keyPanSpeed = 0; // Disable key panning

  // Add method to disable/enable controls during animations
  controls.setEnabled = function(enabled) {
    this.enabled = enabled;
  };

  return controls;
}
