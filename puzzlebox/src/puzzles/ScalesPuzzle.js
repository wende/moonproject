import * as THREE from 'three';
import { Puzzle } from './Puzzle';
import { ScaleAnimator } from './ScaleAnimator';

export class ScalesPuzzle extends Puzzle {
  constructor(actions, scene) {
    super(actions, scene);

    this.lastBalanceState = [0, 0];

    this.colorOptions = [
      { name: 'Résilience', value: 1, hex: '#00FFD4' }, // Résilience - Bright Cyan
      { name: 'Colère', value: 2, hex: '#FF4444' }, // Colère - Bright Red
      { name: 'Joie', value: 3, hex: '#FFFF00' }, // Joie - Bright Yellow
      { name: 'Tristesse', value: 5, hex: '#0088FF' }, // Tristesse - Bright Blue
      { name: 'Peur', value: 12, hex: '#9932CC' }, // Peur - Bright Purple
      { name: 'Amour', value: 7, hex: '#FF69B4' }, // Amour - Hot Pink
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



    const buttonMap = {
      Press_Button_Scales_A: 'weightA',
      Press_Button_Scales_B: 'weightB',
      Press_Button_Scales_C: 'weightC',
    };

    const weightKey = buttonMap[button.name];

    if (!weightKey) return;

    this.weights[weightKey] = (this.weights[weightKey] + 1) % 5;

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
    window.setDialogueButton(colorName, () => null);
    
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

    console.log(`weightA: ${value('weightA')} weightB: ${value('weightB')} weightC: ${value('weightC')}`);
    console.log(`left side weight: ${leftSide} | right side weight: ${rightSide}`);

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
      console.log('HELLO?');
      this.scaleAnimator.transition(startState, endState);
    }

    if (endState[0] === endState[1]) {
      // Delay marking as completed by 500ms so the solution is visible
      setTimeout(() => {
        this.markAsCompleted();
      }, 500);
    }

    this.lastBalanceState = [leftSide, rightSide];

  }

  markAsCompleted() {
    super.markAsCompleted();

    window.setDialogueButton("She traveled the world. But the dark was never vanishing — it was the space she needed to become whole again.", () => null)

    console.log('Available color materials:', Object.keys(this.colorMaterials)); // Debug
    console.log('colorSuccess exists?', 'colorSuccess' in this.colorMaterials); // Debug

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

    this.playAnimation('Moon_Panel_Open');
  }
}
