import { BaseSequencePuzzle } from './BaseSequencePuzzle';

export class StartSequencePuzzle extends BaseSequencePuzzle {
  constructor(actions) {
    
    super(['S', 'E', 'W', 'N'], actions);

    actions["Moon_Panel_Open"].play()
    setTimeout(() => 
      actions["Moon_Panel_Open"].halt()
    , 1)

    console.log(actions["Moon_Panel_Open"])
    console.log(this.actions)
  }

  markAsCompleted() {
    super.markAsCompleted();

    window.setDialogueButton("This place was never hers. But leaving meant becoming a riddle herself", () => null)

    this.playAnimation('SlidePanel_E_Open');
  }
}
