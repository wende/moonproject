import { BaseSequencePuzzle } from './BaseSequencePuzzle.js';

export class MazeSequencePuzzle extends BaseSequencePuzzle {
  constructor(actions, scene) {
    super(['N', 'E', 'N', 'W', 'N'], actions, scene, 'maze');
  }

  markAsCompleted() {
    super.markAsCompleted();

    const puzzleClearLight = this.initLightMaterials(this.scene, 'Light_Top_E');
    this.updateLightMaterial(puzzleClearLight, true);
    
    // Delay sliding door animation by 1 second
    setTimeout(() => {
      this.playAnimation('SlidePanel_W_Open');
    }, 1500);
  }
}
