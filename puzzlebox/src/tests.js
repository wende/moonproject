// MOON PUZZLE

class MoonPuzzle {
  constructor() {
    this.buttons = Array.from(document.getElementById('moon-buttons').children);
    this.CORRECT_BUTTONS = [1, 3, 5];

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.buttons.forEach((button) => {
      button.addEventListener('click', (event) => this.toggleButton(event));
    });
  }

  toggleButton(event) {
    const button = event.target;
    button.classList.toggle('button-off');
    button.classList.toggle('button-on');
    this.checkMoonSolveStatus();
  }

  checkMoonSolveStatus() {
    // create new array of booleans with 'true' at indices for all 'on' buttons
    const buttonStates = this.buttons.map((button) => {
      return !button.classList.contains('button-off');
    });

    const solved = this.CORRECT_BUTTONS.every(index => buttonStates[index]) &&
      buttonStates.every((state, index) =>
        this.CORRECT_BUTTONS.includes(index) ? state : !state
      );

    if (solved) {
      const moonSolveStatus = document.getElementById('moon-solve-status');
      moonSolveStatus.textContent = 'solved';

      // Remove event listeners
      this.buttons.forEach((button) => {
        button.removeEventListener('click', this.toggleButton);
      });
    }
  }
}

// DIRECTION PUZZLE

class DirectionPuzzle {
  constructor() {
    this.sequences = [
      {
        sequence: ['N', 'E', 'W', 'S', 'N', 'E', 'W', 'S'],
        solved: false,
      },
      {
        sequence: ['S', 'E', 'W', 'N'],
        solved: false,
      },
      {
        sequence: ['E', 'E', 'W', 'W', 'N', 'N', 'S', 'S', 'E', 'E', 'W', 'W', 'N'],
        solved: false,
      }
    ];
    this.workingArray = Array(13).fill(null);
    this.solvedSequences = 0;
    this.isFullySolved = false;

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.querySelectorAll('.direction-button').forEach(button => {
      button.addEventListener('click', () => this.handleButtonClick(button));
    });
  }

  handleButtonClick(button) {
    const direction = button.textContent;
    this.workingArray.push(direction);
    this.workingArray.shift();

    console.log(this.workingArray);

    this.checkSequences();
    this.updateSolveStatus();
  }

  checkSequences() {
    this.sequences.forEach((sequenceObj, index) => {
      // skip solved sequences
      if (sequenceObj.solved) {
        return;
      }

      const isSequenceSolved = this.workingArray.some((_, startIndex) => {
        // don't continue if not enough elements in working array
        if (startIndex + sequenceObj.sequence.length > this.workingArray.length) {
          return false;
        }

        // only returns true when matching subsequence found
        const subsequence = this.workingArray.slice(startIndex, startIndex + sequenceObj.sequence.length);
        return JSON.stringify(subsequence) === JSON.stringify(sequenceObj.sequence);
      });

      if (isSequenceSolved) {
        sequenceObj.solved = true;
        this.solvedSequences++;
      }
    });

    if (this.solvedSequences === this.sequences.length) {
      this.isFullySolved = true;
    }
  }

  containsSequence() {
    if (this.sequenceFound) {
      return true;
    }

    return this.workingArray.some((_, index) => {
      // make sure slice length matches sequence length
      if (index + this.hiddenSequence.length > this.workingArray.length) {
        return false;
      }

      const subsequence = this.workingArray.slice(index, index + this.hiddenSequence.length);
      return JSON.stringify(subsequence) === JSON.stringify(this.hiddenSequence);
    });
  }

  updateSolveStatus() {
    const fullSolveStatus = document.getElementById('direction-solve-status');
    const numSolvedSequences = document.getElementById('num-solved-sequences');

    numSolvedSequences.textContent = this.solvedSequences;

    if (this.isFullySolved) {
      fullSolveStatus.textContent = 'solved';
    }
  }
}


// BALANCE PUZZLE

class ScalesPuzzle {
  constructor() {
    this.colorOptions = [
      { 'colorOne': 2 },
      { 'colorTwo': 3 },
      { 'colorThree': 7 },
      { 'colorFour': 9 },
      { 'colorStatic': 13 },
      { 'colorSuccess': 0 }
    ];

    // give weight variables an index value corresponding to colorOptions
    this.weights = {
      weightA: 0,
      weightB: 0,
      weightC: 0,
      // weightD always set to purple/13
      weightD: 4
    };

    this.indicatorMap = {
      weightA: document.querySelector('.indicator-a'),
      weightB: document.querySelector('.indicator-b'),
      weightC: document.querySelectorAll('.indicator-c'),
      weightD: document.querySelector('.indicator-d'),
    };

    this.colorHexCodes = {
      'colorOne': '#990000',   // dark red
      'colorTwo': '#009900',   // dark green
      'colorThree': '#000099', // dark blue
      'colorFour': '#C99700',  // gold
      'colorStatic': '#900090',// purple
      'colorSuccess': '#FFFFFF', // white
    }

    this.weightCompareStatus = document.getElementById('weight-compare-status');
    this.scalesSolveStatus = document.getElementById('scales-solve-status');

    this.setupEventListeners();

    this.updateAllIndicators();
  }

  setupEventListeners() {
    document.getElementById('button-a').addEventListener('click', () => this.cycleColor('weightA'));
    document.getElementById('button-b').addEventListener('click', () => this.cycleColor('weightB'));
    document.getElementById('button-c').addEventListener('click', () => this.cycleColor('weightC'));
    document.getElementById('button-check').addEventListener('click', () => this.checkBalance());
  }

  checkBalance() {
    const leftSide =
      this.getCurrentValue('weightA') +
      this.getCurrentValue('weightB') +
      this.getCurrentValue('weightC');

    const rightSide =
      this.getCurrentValue('weightC') +
      this.getCurrentValue('weightC') +
      this.getCurrentValue('weightD');

    if (leftSide === rightSide) {
      this.setSolvedState();
    } else if (leftSide < rightSide) {
      this.weightCompareStatus.textContent = 'lighter than';
      this.scalesSolveStatus.textContent = 'unsolved';
    } else {
      this.weightCompareStatus.textContent = 'heavier than';
      this.scalesSolveStatus.textContent = 'unsolved';
    }
  }

  getCurrentValue(weightKey) {
    const weightIndex = this.weights[weightKey];
    const colorName = Object.keys(this.colorOptions[weightIndex])[0];
    // extract value from colorOptions array
    return this.colorOptions[weightIndex][colorName];
  }

  cycleColor(weightKey) {
    if (weightKey !== 'weightD') {
      this.weights[weightKey] = (this.weights[weightKey] + 1) % 4;
      this.updateColorIndicator(weightKey);
    }
  }

  updateColorIndicator(weightKey) {
    const weightIndex = this.weights[weightKey];
    const colorName = Object.keys(this.colorOptions[weightIndex])[0];

    // there are multiple C indicators/weights
    if (weightKey === 'weightC') {
      document.querySelectorAll('.indicator-c').forEach((indicator) => {
        this.setIndicatorColor(indicator, colorName);
      });
    } else {
      // target indicator related to weight
      const indicator = this.indicatorMap[weightKey];
      this.setIndicatorColor(indicator, colorName);
    }
  }

  setIndicatorColor(indicatorElement, colorName) {
    if (indicatorElement) {
      indicatorElement.style.backgroundColor = this.colorHexCodes[colorName];
    }
  }

  updateAllIndicators() {
    // update colors for weight indicators A, B, C
    ['weightA', 'weightB', 'weightC'].forEach((key) => {
      this.updateColorIndicator(key);
    });

    // make sure D is set
    const indicatorD = this.indicatorMap['weightD'];
    this.setIndicatorColor(indicatorD, 'colorStatic');
  }

  setSolvedState() {
    this.weightCompareStatus.textContent = 'equal to';
    this.scalesSolveStatus.textContent = 'solved';

    document.getElementById('button-a').disabled = true;
    document.getElementById('button-b').disabled = true;
    document.getElementById('button-c').disabled = true;
    document.getElementById('button-check').disabled = true;

    console.log('you win');

    ['weightA', 'weightB', 'weightC', 'weightD'].forEach((key) => {
      if (key === 'weightC') {
        document.querySelectorAll('.indicator-c').forEach((indicator) => {
          this.setIndicatorColor(indicator, 'colorSuccess');
        });
      } else {
        const indicator = this.indicatorMap[key];
        this.setIndicatorColor(indicator, 'colorSuccess');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.moonPuzzle = new MoonPuzzle();
  window.directionPuzzle = new DirectionPuzzle();
  window.scalesPuzzle = new ScalesPuzzle();
});
