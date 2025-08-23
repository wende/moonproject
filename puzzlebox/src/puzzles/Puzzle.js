import * as THREE from 'three';
import { PuzzleManager } from './PuzzleManager';
import { audioManager } from '../audio_html5.js';

export class Puzzle {
  constructor(actions = {}, scene = null, puzzleName = null) {
    this.isCompleted = false;
    this.interactiveButtons = [];
    this.actions = actions;
    this.scene = scene;
    this.listeners = [];
    this._puzzleName = puzzleName; // Store puzzle name to avoid constructor.name issues

    this.lightMaterials = {
      off: null,
      on: null,
    };
  }

  handleButtonClick(button) {
    if (this.isCompleted) {
      console.log('Puzzle already complete. Button clicks will be ignored.');
      return;
    }
    console.warn('handleButtonClick should be implemented in child classes');
  }

  getExpectedButtonNames() {
    console.warn('Child classes should implement a return array of expected values if buttons are needed');
    return false;
  }

  markAsCompleted() {
    this.isCompleted = true;
    this.emit('completed');
    this.triggerBackgroundFlash();
  }

  triggerBackgroundFlash() {
    const flashElement = document.getElementById('background-flash');
    if (!flashElement) return;

    // Play puzzle solve sound for epic completion
    audioManager.playPuzzleSolve();

    flashElement.style.transition = 'none';
    flashElement.style.opacity = '0.25';

    // NOTE: Look more into how this works
    void flashElement.offsetWidth;

    flashElement.style.transition = 'opacity 1s ease-out';
    flashElement.style.opacity = '0';
  }

  triggerEpicBackgroundFlash() {
    const flashElement = document.getElementById('background-flash');
    const backgroundElement = document.getElementById('background');
    if (!flashElement) return;

    // Helper to set opacity and transition
    const setFlash = (opacity, duration = 0) => {
      flashElement.style.transition = duration ? `opacity ${duration}s ease-out` : 'none';
      flashElement.style.opacity = opacity;
    };

    // Sequence of flashes: [opacity, duration (fade out)]
    const flashSequence = [
      { opacity: '0.9', hold: 120 },   // Initial intense flash, hold for 120ms
      { opacity: '0',   fade: 0.5 },   // Fade out over 0.5s
      { opacity: '0.7', hold: 80 },    // Second flash, hold for 80ms
      { opacity: '0',   fade: 0.4 },   // Fade out over 0.4s
      { opacity: '0.5', hold: 60 },    // Third flash, hold for 60ms
      { opacity: '0',   fade: 0.3 },   // Fade out over 0.3s
      { opacity: '0.3', hold: 40 },    // Final subtle flash, hold for 40ms
      { opacity: '0',   fade: 1.2 },   // Long fade out
    ];

    let step = 0;

    const runFlash = () => {
      if (step >= flashSequence.length) {
        // Create a green overlay that fades in over the original background
        const greenOverlay = document.createElement('div');
        greenOverlay.style.position = 'fixed';
        greenOverlay.style.top = '0';
        greenOverlay.style.left = '0';
        greenOverlay.style.width = '100%';
        greenOverlay.style.height = '100%';
        greenOverlay.style.backgroundImage = 'radial-gradient(white, rgba(0,0,0,0.7))';
        greenOverlay.style.opacity = '0';
        greenOverlay.style.pointerEvents = 'none';
        greenOverlay.style.zIndex = '-2';
        greenOverlay.style.transition = 'opacity 3s ease-in-out';

        document.body.appendChild(greenOverlay);

        // Force reflow and then fade in
        void greenOverlay.offsetWidth;
        greenOverlay.style.opacity = '1';

        return;
      }
      const current = flashSequence[step];

      if (current.hold !== undefined) {
        setFlash(current.opacity, 0);
        // Force reflow to apply style immediately
        void flashElement.offsetWidth;
        setTimeout(() => {
          step++;
          runFlash();
        }, current.hold);
      } else if (current.fade !== undefined) {
        setFlash(current.opacity, current.fade);
        setTimeout(() => {
          step++;
          runFlash();
        }, current.fade * 1000);
      }
    };

    runFlash();
  }

  registerButton(button) {
    this.interactiveButtons.push(button);
  }

  playAnimation(name, isScaleTransition = false) {
    if (!this.actions || !this.actions[name]) {
      console.warn(`Animation not found: ${name}`);
      return;
    }

    const action = this.actions[name];

    // Stop and reset the action to ensure it starts cleanly
    action.stop();

    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;

    // Make sliding door animations slower
    if (name.includes('SlidePanel')) {
      action.timeScale = 0.2; // Make it 5x slower (0.2 = 1/5 speed)
    } else if (name.includes('Moon_Panel')) {
      action.timeScale = 0.4; // Make it 3x slower (0.33 = 1/3 speed)
    } else {
      action.timeScale = 1.0; // Normal speed for other animations
    }

    action.play();
  }

  initLightMaterials(scene, lightName) {
    const groupObj = scene.getObjectByName(lightName);
    const lightObj = groupObj?.children.find((child) => (
      child.material?.name === 'Light_Display'
    ));

    if (lightObj) {
      this.lightMaterials.off = lightObj.material;

      // create "on" light material by creating, modifying copy of existing "off" material
      this.lightMaterials.on = this.lightMaterials.off.clone();
      this.lightMaterials.on.name = 'Light_Display_White';
      this.lightMaterials.on.emissive.setHex(0xffffff);
      this.lightMaterials.on.emissiveIntensity = 1.0;
    }

    return lightObj;
  }

  updateLightMaterial(lightObj, isActivated = true) {
    if (!lightObj || !this.lightMaterials) {
      console.warn('Cannot update light material - missing references');
      return;
    }

    lightObj.material = isActivated ? this.lightMaterials.on : this.lightMaterials.off;
  }

  on(event, callback) {
    this.listeners.push({ event, callback });
  }

  emit(event) {
    this.listeners.forEach((listener) => {
      if (listener.event === event) {
        listener.callback();
      }
    });
  }
}
