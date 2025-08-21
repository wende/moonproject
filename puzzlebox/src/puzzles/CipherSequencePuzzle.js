import { BaseSequencePuzzle } from './BaseSequencePuzzle.js';
import { audioManager } from '../audio_html5.js';

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
    

    
    // Fade from moonproject to moonprojecttrue with a longer fade for better overlap
    audioManager.fadeBetweenTracks('moonproject', 'moonprojecttrue', 2);
  }
}
