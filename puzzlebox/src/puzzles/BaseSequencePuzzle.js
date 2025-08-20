import { Puzzle } from './Puzzle'

export class BaseSequencePuzzle extends Puzzle {
  constructor(sequence, actions, scene) {
    super(actions, scene);
    this.sequence = sequence;
    this.workingArray = Array(sequence.length).fill(null);
  }

  getExpectedButtonNames() {
    return [
      'Press_Button_Directional_N',
      'Press_Button_Directional_S',
      'Press_Button_Directional_W',
      'Press_Button_Directional_E'
    ];
  }

  getDirectionFromButton(buttonName) {
    const mapping = {
      Press_Button_Directional_N: 'N',
      Press_Button_Directional_S: 'S',
      Press_Button_Directional_W: 'W',
      Press_Button_Directional_E: 'E'
    };
    // returns mapped character if it exists
    return mapping[buttonName] || null;
  }

  checkSequence() {
    if (this.isCompleted) return;

    const isMatch = this.sequence.every((value, index) => (
      value === this.workingArray[index]
    ));
    if (isMatch) {
      this.markAsCompleted();
    }
  }

  handleButtonClick(button) {
    if (typeof window.audioManager !== 'undefined') {
      window.audioManager.playButtonClick();
    }

    const direction = this.getDirectionFromButton(button.name);
    this.workingArray.push(direction);
    this.workingArray.shift();
    console.log(`Current working array for ${this.constructor.name}: ${this.workingArray}`);
    this.playAnimation(button.name);

    this.checkSequence();
  }
}
