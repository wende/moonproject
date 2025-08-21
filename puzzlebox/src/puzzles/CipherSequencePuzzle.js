import { BaseSequencePuzzle } from './BaseSequencePuzzle';
import { audioManager } from '../audio.js';

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
    
    // Debug: Check track status before fade
    console.log('Track status before fade:', audioManager.getTrackStatus());
    
    // Fade from moonost to moonosttrue with a longer fade for better overlap
    audioManager.fadeBetweenTracks('moonost', 'moonosttrue', 2.0);
  }
}
