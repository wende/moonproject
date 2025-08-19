import { audioManager } from '../audio.js';

export class PuzzleManager {
  constructor() {
    this.puzzles = [];
    this.meshMap = {};
    this.completedPuzzles = new Set();
    this.allPuzzlesCompleted = false;
  }

  addPuzzle(puzzleObj) {
    this.puzzles.push(puzzleObj);
    puzzleObj.on('completed', () => this.handlePuzzleComplete(puzzleObj));
  }

  handlePuzzleComplete(puzzleObj) {
    this.completedPuzzles.add(puzzleObj);

    if (this.completedPuzzles.size === this.puzzles.length) {
      this.allPuzzlesCompleted = true;
      document.dispatchEvent(new CustomEvent('allPuzzlesCompleted'));
      
      // Play special completion sound when all puzzles are done
      audioManager.playSuccessChime();
    }
  }

  registerButtonsFromGLTF(gltfScene) {
    // only populate meshMap once
    if (Object.keys(this.meshMap).length === 0) {
      console.log('[PuzzleManager] populating meshMap')
      gltfScene.traverse((child) => {
        if (child.isMesh && child.name.startsWith('Press_Button_')) {
          this.meshMap[child.name] = child;
          console.log(`Found mesh: ${child.name}`);
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
      console.log(`${puzzle.constructor.name} buttons: ${expectedNames}`);

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
