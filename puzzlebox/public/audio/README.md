# Audio Files for Puzzle Box Game

This directory should contain the following audio files for the game:

## Required Audio Files

### Background Music
- `ambient_mystery.mp3` - Atmospheric, mysterious background music that loops
  - Should be subtle and not distracting from puzzle solving
  - Recommended: 2-3 minutes long, seamless loop
  - Mood: Mysterious, contemplative, slightly melancholic

### Sound Effects
- `button_click.mp3` - Soft click sound for UI interactions
- `puzzle_solve.mp3` - Satisfying chime when a puzzle is completed
- `box_open.mp3` - Wooden box opening sound with creaking
- `paper_rustle.mp3` - Subtle paper movement sound
- `success_chime.mp3` - Bright, celebratory sound for major achievements
- `error_buzz.mp3` - Gentle error sound for incorrect attempts
- `wind_chimes.mp3` - Ethereal wind chime sound for magical moments
- `heartbeat.mp3` - Subtle heartbeat sound for tense moments
- `footsteps.mp3` - Soft footsteps on wooden surface

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
- "wooden box open"
- "paper rustle"
- "success chime"
- "gentle click"
- "wind chimes"
- "heartbeat"
- "footsteps wood"

## Implementation Notes

The audio system is designed to:
- Load all audio files on initialization
- Handle browser autoplay restrictions gracefully
- Provide volume controls for music and sound effects separately
- Support looping for background music
- Include fade in/out effects for smooth transitions

All audio files will be automatically loaded when the game starts, and the system will gracefully handle missing files with console warnings.
