// Debug and console helper functions

export function setupDebugHelpers(puzzleManager, cameraAnimator, puzzles) {
  // Expose helpers for skipping to a specific puzzle from the browser console
  window.puzzleManager = puzzleManager;
  window.puzzles = puzzles;
  window.cameraAnimator = cameraAnimator;
  
  window.skipTo = (target) => {
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
      const puzzle = window.puzzles[key];
      if (puzzle && !puzzle.isCompleted) {
        puzzle.markAsCompleted();
      }
    }
    
    // Animate camera to the target puzzle position
    if (index < order.length - 1) { // Don't animate for 'end'
      const targetPuzzle = order[index];
      setTimeout(() => {
        cameraAnimator.goToPuzzle(targetPuzzle);
      }, 500); // Small delay to let puzzle completion effects play
    }
  };

  // Add camera control helpers
  window.goToPuzzle = (puzzleName) => {
    cameraAnimator.goToPuzzle(puzzleName);
  };

  window.getPuzzlePositions = () => {
    return cameraAnimator.getPuzzlePositions();
  };
}
