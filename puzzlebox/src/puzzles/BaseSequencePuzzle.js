import { Puzzle } from './Puzzle.js';

export class BaseSequencePuzzle extends Puzzle {
  constructor(sequence, actions, scene, puzzleName) {
    super(actions, scene, puzzleName);
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
    if (window.PuzzleBox?.audioManager) {
      window.PuzzleBox.audioManager.playButtonClick();
    }

    const direction = this.getDirectionFromButton(button.name);
    this.workingArray.push(direction);
    this.workingArray.shift();

    this.playAnimation(button.name);

    this.checkSequence();
  }
}
