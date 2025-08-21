import { BaseSequencePuzzle } from './BaseSequencePuzzle';

export class StartSequencePuzzle extends BaseSequencePuzzle {
  constructor(actions) {
    
    super(['S', 'E', 'W', 'N'], actions);

    actions["Moon_Panel_Open"].play()
    setTimeout(() => 
      actions["Moon_Panel_Open"].halt()
    , 1)
  }

  markAsCompleted() {
    super.markAsCompleted();

    // Delay sliding door animation by 1 second
    setTimeout(() => {
      this.playAnimation('SlidePanel_E_Open');
    }, 1500);
  }
}
