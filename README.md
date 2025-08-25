# The Box for Moon

An interactive 3D puzzle game built with Three.js and Vite. Players explore a mysterious box containing a series of interconnected puzzles that must be solved in sequence.

## About

This is a narrative-driven puzzle experience where players interact with a 3D environment to solve various challenges. The game features atmospheric audio, smooth 3D graphics, and an engaging story that unfolds as puzzles are completed.

## Features

- **3D Interactive Environment**: Built with Three.js for immersive gameplay
- **Multiple Puzzle Types**: Various puzzle mechanics including ciphers, mazes, scales, and interactive sequences
- **Atmospheric Audio**: Background music, sound effects, and voice-overs that enhance the experience
- **Advanced Audio Controls**: Granular volume controls for music, sound effects, and voice-overs
- **Internationalization ready**: Multi-language support with easy text management
- **Mobile Optimization**: Responsive design with touch-friendly controls and mobile-specific UI elements
- **Smooth Animations**: Camera transitions and puzzle interactions with performance optimization
- **Time Tracking**: Real-time counter showing time since a significant date
- **Memory Management**: Built-in memory monitoring and optimization
- **Narrative Elements**: Story-driven progression through puzzle completion

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics**: Three.js
- **Build Tool**: Vite
- **Code Quality**: ESLint for code linting and formatting
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the puzzlebox directory:
   ```bash
   cd puzzlebox
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and visit `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Code Quality

```bash
npm run lint          # Check for linting issues
npm run lint:fix      # Automatically fix linting issues
```

## Project Structure

```
puzzlebox/
├── src/
│   ├── puzzles/          # Puzzle logic and mechanics
│   ├── audio_html5.js    # Audio management and playback
│   ├── audioControls.js  # Audio UI controls and settings
│   ├── cameraAnimator.js # Camera controls and transitions
│   ├── controls.js       # User input handling
│   ├── i18n.js          # Internationalization and translations
│   ├── main.js          # Main game initialization
│   ├── scene.js         # 3D scene setup
│   ├── materials.js     # Material management and enhancement
│   ├── particles.js     # Particle system effects
│   ├── timeCounter.js   # Time tracking functionality
│   ├── textAnimator.js  # Text animation system
│   ├── ui.js            # User interface management
│   ├── input.js         # Input handling and mobile controls
│   ├── microInteractions.js # Micro-interaction effects
│   └── debugHelpers.js  # Debug utilities
├── public/
│   ├── audio/           # Game audio files
│   │   ├── vo/         # Voice-over files
│   │   └── ...         # Music and sound effects
│   └── scene.glb       # 3D model assets
└── index.html          # Main entry point
```

## Gameplay

Players begin by opening the intro to learn about the mysterious box and its purpose. The game consists of multiple interconnected puzzles that must be solved in sequence. Each puzzle reveals more of the story and brings players closer to understanding the box's secrets.

### Puzzle Types

- **Start Sequence**: Initial puzzle introducing the game mechanics
- **Maze Puzzle**: Navigation challenge with cultural elements
- **Scales Puzzle**: Balance-based puzzle with philosophical themes
- **Moon Puzzle**: Celestial-themed puzzle with narrative significance
- **Cipher Puzzle**: Text-based puzzle requiring lateral thinking

## Development

The game is built with modern web technologies and follows modular architecture patterns. The puzzle system is extensible, allowing for easy addition of new puzzle types and mechanics.

### Key Features for Developers

- **Modular Architecture**: Clean separation of concerns with dedicated modules
- **Performance Monitoring**: Built-in memory usage tracking and optimization
- **Internationalization**: Centralized text management for easy localization
- **Audio System**: Comprehensive audio management with HTML5 audio API
- **Mobile-First Design**: Responsive design with touch-optimized controls
- **Debug Tools**: Development utilities for testing and debugging

## License

This project is private and not intended for public distribution.
