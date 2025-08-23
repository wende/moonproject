# The Box For The Moon

An interactive 3D puzzle game built with Three.js and Vite. Players explore a mysterious box containing a series of interconnected puzzles that must be solved in sequence.

## About

This is a narrative-driven puzzle experience where players interact with a 3D environment to solve various challenges. The game features atmospheric audio, smooth 3D graphics, and an engaging story that unfolds as puzzles are completed.

## Features

- **3D Interactive Environment**: Built with Three.js for immersive gameplay
- **Multiple Puzzle Types**: Various puzzle mechanics including ciphers, mazes, and interactive sequences
- **Atmospheric Audio**: Background music and sound effects that enhance the experience
- **Responsive Design**: Works on desktop and mobile devices
- **Smooth Animations**: Camera transitions and puzzle interactions
- **Narrative Elements**: Story-driven progression through puzzle completion

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics**: Three.js
- **Build Tool**: Vite
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

## Project Structure

```
puzzlebox/
├── src/
│   ├── puzzles/          # Puzzle logic and mechanics
│   ├── audio.js          # Audio management
│   ├── cameraAnimator.js # Camera controls and transitions
│   ├── controls.js       # User input handling
│   ├── main.js          # Main game initialization
│   └── scene.js         # 3D scene setup
├── public/
│   ├── audio/           # Game audio files
│   └── scene.glb        # 3D model assets
└── index.html           # Main entry point
```

## Gameplay

Players begin by opening the intro to learn about the mysterious box and its purpose. The game consists of multiple interconnected puzzles that must be solved in sequence. Each puzzle reveals more of the story and brings players closer to understanding the box's secrets.

## Development

The game is built with modern web technologies and follows modular architecture patterns. The puzzle system is extensible, allowing for easy addition of new puzzle types and mechanics.

## License

This project is private and not intended for public distribution.
