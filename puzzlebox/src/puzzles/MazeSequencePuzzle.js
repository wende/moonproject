import { BaseSequencePuzzle } from './BaseSequencePuzzle';

export class MazeSequencePuzzle extends BaseSequencePuzzle {
  constructor(actions, scene) {
    super(['N', 'E', 'N', 'W', 'N'], actions, scene);
  }

  markAsCompleted() {
    super.markAsCompleted();

    window.setDialogueButton("Cœurs légers. Âmes lourdes. Tout cela ne vaut rien sans équilibre.")

    const puzzleClearLight = this.initLightMaterials(this.scene, 'Light_Top_E');
    this.updateLightMaterial(puzzleClearLight, true);
    this.playAnimation('SlidePanel_W_Open');
  }
}
