import * as THREE from 'three';
import { Puzzle } from './Puzzle';

export class MoonPuzzle extends Puzzle {
  constructor(actions, scene) {
    super(actions, scene, 'moon');

    this.CORRECT_BUTTONS = [5,6,7];
    this.buttonStates = Array(8).fill(false);
    this.buttonObjs = [];
    this.lightObjs = [];

    this.initializeButtons();
    this.initializeLights();

    
  }

  initializeButtons() {
    for (let i = 0; i < 8; i++) {
      const button = this.scene.getObjectByName(`Press_Button_Moon_${i}`);
      if (button) {
        button.userData.isActive = false;
        this.buttonObjs.push(button);
      }
    }
  }

  initializeLights() {
    for (let i = 0; i < 8; i++) {
      const lightObj = this.initLightMaterials(this.scene, `Light_Moon_${i}`);

      if (lightObj) {
        this.updateLightMaterial(lightObj, false);
        this.lightObjs.push(lightObj);
      }
    }
  }

  handleButtonClick(button) {
    if (this.isCompleted) return;

    // Play button click sound
    if (window.PuzzleBox?.audioManager) {
      window.PuzzleBox.audioManager.playButtonClick();
    }

    const buttonIndex = this.buttonObjs.indexOf(button);
    // indexOf returns -1 if search item not found
    if (buttonIndex === -1) return;

    this.buttonStates[buttonIndex] = !this.buttonStates[buttonIndex];

    this.playAnimation(button.name);

    if (this.lightObjs[buttonIndex]) {
      this.updateLightMaterial(this.lightObjs[buttonIndex], this.buttonStates[buttonIndex]);
    }

    this.checkSolution();
  }

  checkSolution() {
    const solved = this.CORRECT_BUTTONS.every(index => this.buttonStates[index]) &&
      this.buttonStates.every((state, index) => (
        this.CORRECT_BUTTONS.includes(index) ? state : !state
      ));

    if (solved) {
      this.markAsCompleted();
    }
  }

  markAsCompleted() {
    super.markAsCompleted();

    const puzzleClearLight = this.initLightMaterials(this.scene, 'Light_Top_N');
    this.updateLightMaterial(puzzleClearLight, true);

    const findTheMoon = this.scene.getObjectByName('FindTheMoon');
    if (findTheMoon) findTheMoon.visible = true;
  }

  getExpectedButtonNames() {
    return Array.from({ length: 8 }, (_, i) => `Press_Button_Moon_${i}`);
  }
}
