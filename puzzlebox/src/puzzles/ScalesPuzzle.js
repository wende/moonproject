import * as THREE from 'three';
import { Puzzle } from './Puzzle';
import { ScaleAnimator } from './ScaleAnimator';

export class ScalesPuzzle extends Puzzle {
  constructor(actions, scene) {
    super(actions, scene);

    this.lastBalanceState = [0, 0];

    this.colorOptions = [
      { name: 'colOne', value: 1, hex: '#990000' },
      { name: 'colTwo', value: 2, hex: '#009900' },
      { name: 'colThree', value: 3, hex: '#000099' },
      { name: 'colFour', value: 5, hex: '#C99700' },
      { name: 'colStatic', value: 9, hex: '#900090' },
      { name: 'colSuccess', value: 11, hex: '#FFFFFF' },
    ];

    this.weights = {
      weightA: 0,
      weightB: 0,
      weightC: 0,
      weightD: 4, // static weight
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

  }

  setupMaterials() {
    this.colorMaterials = {};

    this.colorOptions.forEach(({ name, hex }) => {
      const mat = new THREE.MeshStandardMaterial({
        color: hex,
        emissive: hex,
        emissiveIntensity: 1.0,
      });
      this.colorMaterials[name] = mat;
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

    this.weights[weightKey] = (this.weights[weightKey] + 1) % 4;

    this.updateLightColor(weightKey);

    this.checkBalance();

  }

  updateLightColor(weightKey) {
    const index = this.weights[weightKey];
    const colorName = this.colorOptions[index].name;
    const material = this.colorMaterials[colorName];

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
      this.markAsCompleted();
    }

    this.lastBalanceState = [leftSide, rightSide];

  }

  markAsCompleted() {
    super.markAsCompleted();

    window.setDialogueButton("The dark was never vanishing. It was the space she needed to become whole again", () => null)

    console.log('Available color materials:', Object.keys(this.colorMaterials)); // Debug
    console.log('colorSuccess exists?', 'colorSuccess' in this.colorMaterials); // Debug

    const puzzleClearLight = this.initLightMaterials(this.scene, 'Light_Top_W');
    this.updateLightMaterial(puzzleClearLight, true);
    Object.keys(this.weights).forEach((key) => {
      const mat = this.colorMaterials['colSuccess'];
      const lights = this.lights[key];
      if (Array.isArray(lights)) {
        lights.forEach((light) => (
          light.material = mat
        ));
      } else if (lights) {
        lights.material = mat;
      }
    });

    this.playAnimation('Moon_Panel_Open');
  }
}
