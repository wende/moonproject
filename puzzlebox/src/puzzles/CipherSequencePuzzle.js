import { BaseSequencePuzzle } from './BaseSequencePuzzle';

export class CipherSequencePuzzle extends BaseSequencePuzzle {
  constructor(actions, scene) {
    super(['N', 'E', 'S'], actions, scene);
  }

  markAsCompleted() {
    if(!this.scene.getObjectByName('FindTheMoon')?.visible) return;
    super.markAsCompleted();

    const puzzleClearLight = this.initLightMaterials(this.scene, 'Light_Top_S');
    this.updateLightMaterial(puzzleClearLight, true);

    this.triggerEpicBackgroundFlash();
  }
}
