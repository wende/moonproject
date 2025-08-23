# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

"The Box For The Moon" is a narrative-driven 3D interactive puzzle game built with Three.js and Vite. It's a birthday gift featuring multiple interconnected puzzles that tell a story as they're solved in sequence.

## Essential Commands

All commands should be run from the `puzzlebox/` directory:

```bash
# Navigate to the project directory (from repo root)
cd puzzlebox

# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint JavaScript files
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

## Architecture Overview

### Core System Components

**Main Entry Point (`main.js`)**
- Orchestrates the entire game initialization
- Sets up scene, controls, UI, audio, and puzzle management
- Contains the main game loop with delta-time based animations
- Exposes debug methods globally for development

**Scene Management (`scene.js`)**
- Creates the Three.js scene with cosmic background (stars and nebula)
- Sets up post-processing pipeline with bloom effects and anti-aliasing
- Handles window resize events and camera settings
- Uses AgX tone mapping for enhanced visuals

**Puzzle System Architecture**
The game uses a modular puzzle system with clear separation of concerns:

- `Puzzle.js` - Base class for all puzzles with common functionality (light materials, animations, event handling)
- `PuzzleManager.js` - Orchestrates puzzle lifecycle, handles completion flow, manages camera transitions
- Individual puzzle classes extend the base `Puzzle` class with specific mechanics

**Camera System (`cameraAnimator.js`)**
- Manages smooth camera transitions between puzzle positions
- Integrates with puzzle completion to automatically move to next puzzle
- Provides debug methods for testing camera positions

**Audio System (`audio_html5.js`, `audioControls.js`)**
- HTML5 Audio-based system with loading progress tracking
- Handles background music and sound effects
- Respects browser autoplay policies with user interaction detection

### Key Design Patterns

**Event-Driven Architecture**
Puzzles use an event system where puzzle completion triggers camera animations and UI updates through custom events.

**Modular Puzzle Design**
Each puzzle is self-contained with its own button registration, animation handling, and completion logic. New puzzles can be added by extending the base `Puzzle` class.

**Asset-Driven Development**
The game heavily relies on a single GLTF model (`scene.glb`) that contains all 3D assets, animations, and interactive elements. Buttons and objects are identified by name in the 3D scene.

## Development Workflow

### Adding New Puzzles

1. Create a new puzzle class extending `Puzzle.js`
2. Implement required methods: `getExpectedButtonNames()`, `handleButtonClick()`
3. Add puzzle to the sequence in `main.js`
4. Update `PuzzleManager.puzzleNames` array with the puzzle name
5. Add camera position for the puzzle in `cameraAnimator.js`

### Working with 3D Assets

- Main scene file: `public/scene.glb`
- Interactive buttons must be named with prefix `Press_Button_` in the 3D model
- Objects are accessed by name using `scene.getObjectByName()`
- Animations are stored in the GLTF file and accessed via the mixer

### Debug Tools

The game exposes several debug utilities in the browser console:

```javascript
// Camera debugging
window.debugCamera.goToPuzzle('puzzleName')
window.debugCamera.cyclePuzzles()
window.debugCamera.getCurrentPosition()

// Puzzle debugging  
window.debugPuzzles.verifyNames()
window.debugPuzzles.getCompletedNames()
```

### ESLint Configuration

The project uses strict ESLint rules:
- 2-space indentation
- Single quotes for strings
- Semicolons required
- No unused variables (except those prefixed with `_`)
- Console statements generate warnings
- Consistent spacing and formatting enforced

### Audio Development

- Background music and sound effects managed through `audioManager`
- Loading progress is tracked and displayed to users
- Audio context requires user interaction before starting
- Toggle button allows users to mute/unmute

## File Structure

```
puzzlebox/
├── src/
│   ├── puzzles/           # Puzzle implementations and base classes
│   │   ├── Puzzle.js      # Base puzzle class
│   │   ├── PuzzleManager.js # Puzzle orchestration
│   │   └── [Specific puzzle classes]
│   ├── main.js           # Game initialization and main loop
│   ├── scene.js          # Three.js scene setup and post-processing
│   ├── cameraAnimator.js # Camera movement and transitions
│   ├── audio_html5.js    # Audio system implementation
│   ├── materials.js      # Material management and enhancements
│   ├── particles.js      # Particle effects system
│   └── [Other utility modules]
├── public/
│   ├── scene.glb         # Main 3D scene and assets
│   └── audio/            # Sound files
└── index.html            # Entry point with modal dialogs
```

## Deployment

The project is configured for Vercel deployment with the production URL pointing to `https://moonsjourney.vercel.app/`. The build process creates optimized assets in the `dist/` directory.
