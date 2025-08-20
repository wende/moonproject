import { audioManager } from '../audio.js';

export class PuzzleManager {
  constructor() {
    this.puzzles = [];
    this.meshMap = {};
    this.completedPuzzles = new Set();
    this.allPuzzlesCompleted = false;
    this.cameraAnimator = null;
    this.puzzleNames = ['start', 'maze', 'scales', 'moon', 'cipher'];
    this.puzzleMap = new Map(); // Map puzzle names to puzzle objects
  }

  addPuzzle(puzzleObj) {
    this.puzzles.push(puzzleObj);
    puzzleObj.on('completed', () => this.handlePuzzleComplete(puzzleObj));
    
    // Map puzzle object to its name based on constructor
    const puzzleName = this.getPuzzleName(puzzleObj);
    if (puzzleName) {
      this.puzzleMap.set(puzzleName, puzzleObj);
    }
  }

  getPuzzleName(puzzleObj) {
    const constructorName = puzzleObj.constructor.name;
    const nameMap = {
      'StartSequencePuzzle': 'start',
      'MazeSequencePuzzle': 'maze',
      'ScalesPuzzle': 'scales',
      'MoonPuzzle': 'moon',
      'CipherSequencePuzzle': 'cipher'
    };
    return nameMap[constructorName];
  }

  setCameraAnimator(cameraAnimator) {
    this.cameraAnimator = cameraAnimator;
  }

  handlePuzzleComplete(puzzleObj) {
    this.completedPuzzles.add(puzzleObj);

    // Trigger camera animation to next puzzle
    if (this.cameraAnimator) {
      // Reduced delay for faster response
      setTimeout(() => {
        this.cameraAnimator.animateToNextPuzzle(this.getCompletedPuzzleNames());
      }, 300);
    }

    if (this.completedPuzzles.size === this.puzzles.length) {
      this.allPuzzlesCompleted = true;
      document.dispatchEvent(new CustomEvent('allPuzzlesCompleted'));
      
      // Play special completion sound when all puzzles are done
      audioManager.playSuccessChime();
    }
  }

  getCompletedPuzzleNames() {
    const completedNames = new Set();
    for (const puzzleObj of this.completedPuzzles) {
      const puzzleName = this.getPuzzleName(puzzleObj);
      if (puzzleName) {
        completedNames.add(puzzleName);
      }
    }
    return completedNames;
  }

  registerButtonsFromGLTF(gltfScene) {
    // only populate meshMap once
    if (Object.keys(this.meshMap).length === 0) {
      gltfScene.traverse((child) => {
        if (child.isMesh && child.name.startsWith('Press_Button_')) {
          this.meshMap[child.name] = child;
        }
      });
    }

    // register buttons for each puzzle
    this.puzzles.forEach((puzzle) => {
      if (typeof puzzle.getExpectedButtonNames !== 'function') {
        console.warn(`[PuzzleManager] ${puzzle.constructor.name} does not implement getExpectedButtonNames`);
        return;
      }

      const expectedNames = puzzle.getExpectedButtonNames();

      if (!Array.isArray(expectedNames)) {
        console.warn(`[PuzzleManager] getExpectedButtonNames() for ${puzzle.constructor.name} does not return array`);
        return;
      }

      expectedNames.forEach((name) => {
        const button = this.meshMap[name];
        if (button) {
          puzzle.registerButton(button);
        } else {
          console.warn(`Button not found: ${name}`);
        }
      });
    });
  }

  handleClick(button) {
    for (const puzzle of this.puzzles) {
      if (puzzle.isCompleted) continue;
      if (puzzle.interactiveButtons.includes(button)) {
        puzzle.handleButtonClick(button);
      }
    }
  }

  saveProgress() {
    const progress = this.puzzles.map(puzzle => ({
      isCompleted: puzzle.isCompleted
    }));
    localStorage.setItem('puzzleProgress', JSON.stringify(progress));
  }

  loadProgress() {
    const progress = JSON.parse(localStorage.getItem('puzzleProgress'));
    if (!progress) return;

    progress.forEach((puzzleData, index) => {
      const puzzle = this.puzzles[index];
      if (puzzleData.isCompleted) {
        puzzle.markAsCompleted();
      }
    });
  }
}
