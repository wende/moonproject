# Audio Files for Puzzle Box Game

This directory should contain the following audio files for the game:

## Required Audio Files

### Background Music
- `moonproject.mp3` - Main background music track
  - Should be subtle and not distracting from puzzle solving
  - Recommended: 2-3 minutes long, seamless loop
  - Mood: Mysterious, contemplative, slightly melancholic
- `moonprojecttrue.mp3` - Secondary background music track
  - Used for transitions and special moments
  - Should complement the main track

### Sound Effects
- `button_click.mp3` - Soft click sound for UI interactions
- `puzzle_solve.mp3` - Satisfying chime when a puzzle is completed
- `success_chime.mp3` - Bright, celebratory sound for major achievements

### Voice Overs
- `maze_vo.wav` - Voice over for maze puzzle
- `start_vo.wav` - Voice over for start sequence

## Audio File Requirements

- **Format**: MP3 (for web compatibility)
- **Quality**: 128-192 kbps (good balance of quality and file size)
- **Duration**: 
  - Background music: 2-3 minutes (looping)
  - Sound effects: 0.5-3 seconds
- **Volume**: Normalized to prevent clipping
- **License**: Ensure you have proper rights to use the audio

## Where to Find Audio

### Free Resources
- **Freesound.org** - Large collection of free sound effects
- **Zapsplat** - Free sound effects library (with attribution)
- **BBC Sound Effects** - Free library of sound effects
- **Incompetech** - Kevin MacLeod's royalty-free music

### Paid Resources
- **AudioJungle** - Professional audio marketplace
- **Pond5** - High-quality stock audio
- **PremiumBeat** - Royalty-free music and sound effects

## Recommended Search Terms

For background music:
- "mysterious ambient"
- "puzzle game music"
- "atmospheric mystery"
- "contemplative ambient"

For sound effects:
- "success chime"
- "gentle click"
- "puzzle solve"

## Implementation Notes

The audio system is designed to:
- Load all audio files on initialization
- Handle browser autoplay restrictions gracefully
- Provide volume controls for music and sound effects separately
- Support looping for background music
- Include fade in/out effects for smooth transitions

All audio files will be automatically loaded when the game starts, and the system will gracefully handle missing files with console warnings.
