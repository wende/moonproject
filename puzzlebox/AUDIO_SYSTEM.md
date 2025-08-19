# Audio System Documentation

## Overview

The puzzle box game now includes a comprehensive audio system that provides background music and sound effects to enhance the gaming experience. The system is designed to be user-friendly, accessible, and performant.

## Features

### 🎵 Background Music
- Atmospheric ambient music that loops seamlessly
- Volume control with fade in/out effects
- Automatic playback when the game starts

### 🔊 Sound Effects
- Button click sounds for UI interactions
- Puzzle completion sounds
- Success and error feedback sounds
- Environmental sounds (paper rustle, footsteps, etc.)

### 🎛️ Audio Controls
- Master volume control
- Separate music and sound effects volume
- Mute/unmute functionality
- Test sound button
- Accessible via audio button in the navigation

## How to Use

### For Players

1. **Audio Button**: Click the 🔊 button in the top navigation to open audio controls
2. **Volume Sliders**: Adjust master, music, and sound effects volumes independently
3. **Mute Button**: Quickly mute/unmute all audio
4. **Test Sound**: Click "Test Sound" to verify audio is working
5. **Close**: Click the × button or press Escape to close the audio panel

### For Developers

#### Basic Usage

```javascript
import { audioManager } from './audio.js';

// Play a sound effect
audioManager.playSound('button_click');

// Play background music
audioManager.playMusic('background', { fadeIn: 2.0 });

// Stop music with fade out
audioManager.stopMusic(1.0);
```

#### Available Sound Methods

```javascript
// UI Sounds
audioManager.playButtonClick();
audioManager.playErrorBuzz();

// Puzzle Sounds
audioManager.playPuzzleSolve();
audioManager.playSuccessChime();

// Environmental Sounds
audioManager.playPaperRustle();
audioManager.playFootsteps();
audioManager.playWindChimes();
audioManager.playHeartbeat(); // Loops automatically

// Box Sounds
audioManager.playBoxOpen();
```

#### Volume Control

```javascript
// Set volumes (0.0 to 1.0)
audioManager.setMasterVolume(0.8);
audioManager.setMusicVolume(0.3);
audioManager.setSFXVolume(0.5);

// Mute/unmute
audioManager.mute();
audioManager.unmute();
audioManager.toggleMute();
```

## File Structure

```
puzzlebox/
├── src/
│   ├── audio.js              # Main audio manager
│   ├── audioControls.js      # UI controls component
│   └── ...
├── public/
│   └── audio/
│       ├── README.md         # Audio file requirements
│       ├── ambient_mystery.mp3
│       ├── button_click.mp3
│       ├── puzzle_solve.mp3
│       └── ... (other audio files)
└── scripts/
    └── generate-placeholder-audio.js
```

## Audio Files

### Required Files

The system expects these audio files in `/public/audio/`:

| File | Purpose | Duration | Loop |
|------|---------|----------|------|
| `ambient_mystery.mp3` | Background music | 2-3 min | Yes |
| `button_click.mp3` | UI interactions | 0.5-1s | No |
| `puzzle_solve.mp3` | Puzzle completion | 1-2s | No |
| `box_open.mp3` | Box opening | 1-3s | No |
| `paper_rustle.mp3` | Paper movement | 0.5-1s | No |
| `success_chime.mp3` | Major achievements | 2-3s | No |
| `error_buzz.mp3` | Incorrect attempts | 0.5-1s | No |
| `wind_chimes.mp3` | Magical moments | 1-2s | No |
| `heartbeat.mp3` | Tense moments | 1-2s | Yes |
| `footsteps.mp3` | Movement sounds | 0.5-1s | No |

### Adding New Audio Files

1. Add the audio file to `/public/audio/`
2. Update the `audioFiles` object in `audio.js`:

```javascript
this.audioFiles = {
  // ... existing files
  new_sound: '/audio/new_sound.mp3'
};
```

3. Add a convenience method if needed:

```javascript
playNewSound() {
  return this.playSound('new_sound', { volume: 0.6 });
}
```

## Technical Details

### Browser Compatibility

- Uses Web Audio API for high-quality audio processing
- Falls back gracefully if audio is not supported
- Handles browser autoplay restrictions automatically
- Initializes on first user interaction (required by modern browsers)

### Performance

- Audio files are preloaded on initialization
- Uses AudioBuffer for efficient memory usage
- Separate gain nodes for music and sound effects
- Automatic cleanup of finished audio sources

### Error Handling

- Graceful fallback if audio files are missing
- Console warnings for debugging
- No crashes if audio system fails to initialize

## Integration Points

The audio system is integrated into:

1. **Main Game Loop** (`main.js`): Background music starts automatically
2. **UI Interactions** (`ui.js`): Button clicks trigger sound effects
3. **Puzzle Completion** (`Puzzle.js`): Success sounds on puzzle solve
4. **Game Completion** (`PuzzleManager.js`): Special chime when all puzzles complete

## Customization

### Changing Default Volumes

Edit the constructor in `audio.js`:

```javascript
constructor() {
  // ... other properties
  this.musicVolume = 0.3;  // Default music volume
  this.sfxVolume = 0.5;    // Default sound effects volume
}
```

### Adding New Sound Categories

1. Create a new gain node in the constructor
2. Connect it to the master gain
3. Add volume control methods
4. Update the UI controls

### Styling Audio Controls

The audio controls use CSS classes that can be customized in `style.css`:

- `.audio-controls` - Main container
- `.audio-control-group` - Individual control sections
- `.volume-slider` - Volume sliders
- `.mute-btn`, `.test-sound-btn` - Buttons

## Troubleshooting

### Audio Not Playing

1. Check browser console for errors
2. Ensure audio files exist in `/public/audio/`
3. Verify browser supports Web Audio API
4. Check if browser is blocking autoplay

### Missing Audio Files

Run the placeholder generator:

```bash
node scripts/generate-placeholder-audio.js
```

### Volume Issues

1. Check master volume is not muted
2. Verify individual volume sliders
3. Ensure audio context is not suspended

## Future Enhancements

Potential improvements for the audio system:

- [ ] Audio file streaming for large files
- [ ] 3D spatial audio for immersive experience
- [ ] Dynamic music that changes with puzzle progress
- [ ] Audio presets (quiet, normal, loud)
- [ ] Audio visualization
- [ ] Accessibility features (audio descriptions)

## License

The audio system code is part of the puzzle box project. Audio files should be properly licensed for your use case.
