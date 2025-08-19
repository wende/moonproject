import { BaseSequencePuzzle } from './BaseSequencePuzzle';

export class MazeSequencePuzzle extends BaseSequencePuzzle {
  constructor(actions, scene) {
    super(['N', 'E', 'N', 'W', 'N'], actions, scene);
  }

  markAsCompleted() {
    super.markAsCompleted();

    window.setDialogueButton("Light hearts. Heavy souls. It all would be nothing without balance.", () => null)

    const puzzleClearLight = this.initLightMaterials(this.scene, 'Light_Top_E');
    this.updateLightMaterial(puzzleClearLight, true);
    this.playAnimation('SlidePanel_W_Open');
  }
}
