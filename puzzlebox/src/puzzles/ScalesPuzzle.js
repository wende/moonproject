import * as THREE from 'three';
import { Puzzle } from './Puzzle';
import { ScaleAnimator } from './ScaleAnimator';
import { audioManager } from '../audio_html5.js';

export class ScalesPuzzle extends Puzzle {
  constructor(actions, scene) {
    super(actions, scene, 'scales');

    this.lastBalanceState = [0, 0];
    this.isInitializing = true;

    this.colorOptions = [
      { name: 'Résilience', value: 1, hex: '#00FFD4' }, // Résilience - Bright Cyan
      { name: 'Colère', value: 2, hex: '#FF4444' }, // Colère - Bright Red
      { name: 'Joie', value: 3, hex: '#FFFF00' }, // Joie - Bright Yellow
      { name: 'Tristesse', value: 6, hex: '#0088FF' }, // Tristesse - Bright Blue
      { name: 'Peur', value: 15, hex: '#9932CC' }, // Peur - Bright Purple
      { name: 'Amour', value: 8, hex: '#FF69B4' }, // Amour - Hot Pink
      { name: 'Success', value: 14, hex: '#FFFFFF' }, // Success - White
    ];

    this.weights = {
      weightA: 3,
      weightB: 3,
      weightC: 3,
      weightD: 5, // static weight
    };

    this.lights = {
      weightA: this.getLightChildByMaterialName('Light_Scales_A'),
      weightB: this.getLightChildByMaterialName('Light_Scales_B'),
      weightC: [
        this.getLightChildByMaterialName('Light_Scales_C'),
        this.getLightChildByMaterialName('Light_Scales_C_1'),
        this.getLightChildByMaterialName('Light_Scales_C_2'),
      ],
      weightD: this.getLightChildByMaterialName('Light_Scales_D'),
    };

    this.setupMaterials();
    this.scaleAnimator = new ScaleAnimator(scene);


    Object.keys(this.weights).forEach((key) => {
      this.updateLightColor(key);
    });

    this.isInitializing = false;

    this.checkBalance();

  }

  setupMaterials() {
    this.colorMaterials = {};

    this.colorOptions.forEach(({ name, hex }) => {
      const mat = new THREE.MeshStandardMaterial({
        color: hex,
        emissive: hex,
        emissiveIntensity: 1.0,
      });
      // Store with 'col' prefix to match the material naming convention
      this.colorMaterials['col' + name] = mat;
    });
  }

  getExpectedButtonNames() {
    return [
      'Press_Button_Scales_A',
      'Press_Button_Scales_B',
      'Press_Button_Scales_C',
    ];
  }

  handleButtonClick(button) {
    if (this.isCompleted) return;

    this.playAnimation(button.name);
    audioManager.playButtonClick();


    const buttonMap = {
      Press_Button_Scales_A: 'weightA',
      Press_Button_Scales_B: 'weightB',
      Press_Button_Scales_C: 'weightC',
    };

    const weightKey = buttonMap[button.name];

    if (!weightKey) return;
    const rem = weightKey === 'weightC' ? 6 : 5;

    this.weights[weightKey] = (this.weights[weightKey] + 1) % rem;

    this.updateLightColor(weightKey);

    this.checkBalance();

  }

  updateLightColor(weightKey) {
    const index = this.weights[weightKey];

    // Safety check to prevent array index out of bounds
    if (index >= this.colorOptions.length) {
      console.warn(`Index ${index} is out of bounds for colorOptions array`);
      return;
    }

    const colorName = this.colorOptions[index].name;

    // Only update dialogue button if this is called from button interaction (not constructor)
    if (!this.isInitializing) {
      // Map color names to audio methods
      const audioMap = {
        'Résilience': 'playResilienceVO',
        'Colère': 'playColereVO',
        'Joie': 'playJoieVO',
        'Tristesse': 'playTristeseVO',
        'Peur': 'playPeurVO',
        'Amour': 'playAmourVO',
        'Success': null // No audio for success
      };
      
      const audioMethod = audioMap[colorName];
      window.PuzzleBox?.setDialogueButton(colorName, audioMethod);
    }

    // Add 'col' prefix to match the material naming convention
    const materialName = 'col' + colorName;
    const material = this.colorMaterials[materialName];

    if (!material) {
      console.warn(`Material not found for: ${materialName}`);
      return;
    }

    const lights = this.lights[weightKey];

    if (Array.isArray(lights)) {
      lights.forEach((light) => {
        if (light?.material) {
          light.material = material;
        }
      });
    } else if (lights?.material) {
      lights.material = material;
    }
  }

  checkBalance() {
    const value = (key) => {
      const index = this.weights[key];
      return this.colorOptions[index].value;
    };

    const leftSide = value('weightA') + value('weightB') + value('weightC');
    const rightSide = value('weightC') + value('weightC') + value('weightD');


    this.handleStateChange(leftSide, rightSide);
  }

  getLightChildByMaterialName(parentName) {
    const groupObj = this.scene.getObjectByName(parentName);
    if (!groupObj) return null;

    return groupObj.children.find((child) => (
      child.material?.name === 'Light_Display'
    ));
  }

  handleStateChange(leftSide, rightSide) {
    const startState = this.lastBalanceState;
    const endState = [leftSide, rightSide];

    if (startState !== endState) {
      this.scaleAnimator.transition(startState, endState);
    }

    if (endState[0] === endState[1]) {
      // Disable scales buttons immediately when puzzle is solved
      this.disableScalesButtons();
      
      // Mark as completed after 1 second (for visual effects)
      setTimeout(() => {
        this.markAsCompleted();
      }, 1000);
    }

    this.lastBalanceState = [leftSide, rightSide];

  }

  disableScalesButtons() {
    // Disable only the scales puzzle buttons immediately
    this.interactiveButtons.forEach(button => {
      // Remove button from interactive objects by setting a flag
      button.userData.disabled = true;
    });
    
    // Scales puzzle buttons disabled immediately after puzzle solved
  }

  markAsCompleted() {
    super.markAsCompleted();

    const puzzleClearLight = this.initLightMaterials(this.scene, 'Light_Top_W');
    this.updateLightMaterial(puzzleClearLight, true);
    Object.keys(this.weights).forEach((key) => {
      const mat = this.colorMaterials['colSuccess'];
      const lights = this.lights[key];
      if (Array.isArray(lights)) {
        lights.forEach((light) => {
          if (light?.material) {
            light.material = mat;
          }
        });
      } else if (lights?.material) {
        lights.material = mat;
      }
    });

    // Delay Moon panel animation by 1 second
    setTimeout(() => {
      this.playAnimation('Moon_Panel_Open');
    }, 2000);
  }
}
