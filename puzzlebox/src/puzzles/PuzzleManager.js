import { audioManager } from '../audio_html5.js';

export class PuzzleManager {
  constructor() {
    this.puzzles = [];
    this.meshMap = {};
    this.completedPuzzles = new Set();
    this.allPuzzlesCompleted = false;
    this.cameraAnimator = null;
    this.puzzleNames = ['start', 'maze', 'scales', 'moon', 'cipher'];
    this.puzzleMap = new Map(); // Map puzzle names to puzzle objects
    this.onPuzzleCompleteCallbacks = []; // Callbacks to run when puzzles are completed
  }

  // Add callback to be called when a puzzle is completed
  onPuzzleComplete(callback) {
    this.onPuzzleCompleteCallbacks.push(callback);
  }

  // Get completion progress (0.0 to 1.0)
  getCompletionProgress() {
    return this.completedPuzzles.size / this.puzzles.length;
  }

  // Get number of completed puzzles
  getCompletedCount() {
    return this.completedPuzzles.size;
  }

  // Get total number of puzzles
  getTotalPuzzles() {
    return this.puzzles.length;
  }

  addPuzzle(puzzleObj) {
    this.puzzles.push(puzzleObj);
    puzzleObj.on('completed', () => this.handlePuzzleComplete(puzzleObj));

    // Map puzzle object to its name using a more reliable method
    const puzzleName = this.getPuzzleName(puzzleObj);
    if (puzzleName) {
      this.puzzleMap.set(puzzleName, puzzleObj);
      // Store the puzzle name directly on the object to avoid constructor.name issues
      puzzleObj._puzzleName = puzzleName;

    } else {
      console.warn('Could not determine puzzle name for puzzle object');
    }
  }

  // Debug method to verify all puzzle names are properly set
  verifyPuzzleNames() {
    this.puzzles.forEach((puzzle) => {
      this.getPuzzleName(puzzle);
    });
  }

  getPuzzleName(puzzleObj) {
    // Get the stored puzzle name (should always be available now)
    return puzzleObj._puzzleName;
  }

  setCameraAnimator(cameraAnimator) {
    this.cameraAnimator = cameraAnimator;
  }

  handlePuzzleComplete(puzzleObj) {
    const puzzleName = this.getPuzzleName(puzzleObj);
    this.completedPuzzles.add(puzzleObj);

    // Trigger camera animation to next puzzle
    if (this.cameraAnimator) {
      const completedNames = this.getCompletedPuzzleNames();

      // Reduced delay for faster response
      setTimeout(() => {
        this.cameraAnimator.animateToNextPuzzle(completedNames);
      }, 300);
    }

    if (this.completedPuzzles.size === this.puzzles.length) {
      this.allPuzzlesCompleted = true;
      document.dispatchEvent(new CustomEvent('allPuzzlesCompleted'));
    }

    // Notify callbacks with completion progress
    const progress = this.getCompletionProgress();
    this.onPuzzleCompleteCallbacks.forEach(callback => callback(puzzleName, progress));
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

    // Update star visibility after loading progress
    const completionProgress = this.getCompletionProgress();
    this.onPuzzleCompleteCallbacks.forEach(callback => callback(null, completionProgress));
  }
}
