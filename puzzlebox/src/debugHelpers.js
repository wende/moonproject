// Debug and console helper functions

export function setupDebugHelpers(puzzleManager, cameraAnimator, puzzles) {
  // Create namespace for debug helpers
  window.PuzzleBox = window.PuzzleBox || {};
  
  // Expose helpers for skipping to a specific puzzle from the browser console
  window.PuzzleBox.puzzleManager = puzzleManager;
  window.PuzzleBox.puzzles = puzzles;
  window.PuzzleBox.cameraAnimator = cameraAnimator;
  
  window.PuzzleBox.skipTo = (target) => {
    const intro = document.getElementById('intro');
    if (intro) intro.style.display = 'none';
    
    const order = ['start', 'maze', 'scales', 'moon', 'cipher', 'end'];
    const index = typeof target === 'number'
      ? target
      : order.indexOf(String(target).toLowerCase());
    if (index < 0 || index > order.length - 1) {
      console.warn('skipTo: invalid target. Use name or index from', order);
      return;
    }
    
    // Complete puzzles up to the target
    for (let i = 0; i < index; i++) {
      const key = order[i];
      const puzzle = window.PuzzleBox.puzzles[key];
      if (puzzle && !puzzle.isCompleted) {
        puzzle.markAsCompleted();
      }
    }
    
    // Handle special case for 'end' - simple direct completion
    if (target === 'end' || index === order.length - 1) {
      // Set all puzzles as completed
      for (let i = 0; i < order.length - 1; i++) {
        const key = order[i];
        const puzzle = window.PuzzleBox.puzzles[key];
        if (puzzle) {
          puzzle.isCompleted = true;
        }
      }
      
      // Update puzzle manager state
      const puzzleManager = window.PuzzleBox.puzzleManager;
      if (puzzleManager) {
        puzzleManager.completedPuzzles.clear();
        for (const puzzle of puzzleManager.puzzles) {
          if (puzzle.isCompleted) {
            puzzleManager.completedPuzzles.add(puzzle);
          }
        }
        puzzleManager.allPuzzlesCompleted = true;
      }
      
      // Trigger the completion sequence - let camera animation handle the outro modal
      document.dispatchEvent(new CustomEvent('allPuzzlesCompleted'));
    } else {
      // Animate camera to the target puzzle position
      const targetPuzzle = order[index];
      setTimeout(() => {
        cameraAnimator.goToPuzzle(targetPuzzle);
      }, 500); // Small delay to let puzzle completion effects play
    }
  };

  // Add camera control helpers
  window.PuzzleBox.goToPuzzle = (puzzleName) => {
    cameraAnimator.goToPuzzle(puzzleName);
  };

  window.PuzzleBox.getPuzzlePositions = () => {
    return cameraAnimator.getPuzzlePositions();
  };
}
