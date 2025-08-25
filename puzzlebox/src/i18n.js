// Internationalization (i18n) file for The Box for Moon
// Contains all text strings used throughout the application

export const translations = {
  en: {
    // Page titles and headers
    pageTitle: 'The Box for Moon',
    siteTitle: 'The Box for Moon',
    congratulations: 'Congratulations!',
    credits: 'Credits',

    // Navigation and buttons
    openIntro: 'Open Intro',
    lookInside: 'Look Inside',
    continue: 'Continue',
    close: 'Close',
    creditsButton: 'Credits',

    // Loading
    loading: 'Loading...',

    // Audio controls
    audioSettings: 'Audio Settings',
    masterVolume: 'Master Volume',
    musicVolume: 'Music Volume',
    soundEffectsVolume: 'Sound Effects Volume',
    voiceOvers: 'Voice Overs',
    enabled: 'Enabled',
    disabled: 'Disabled',
    mute: 'Mute',
    unmute: 'Unmute',
    audioLabel: 'Audio',

    // Puzzle dialogue and text
    startSequence: 'South, East, West, North',
    moonPuzzle: 'She traveled the world. But her darkness wasn\'t vanishing — it was the path she had to take to become full again.',
    cipherPuzzle: 'Sometimes riddles are best solved by just asking yourself',
    scalesPuzzle: 'Cœurs légers. Âmes lourdes. Tout cela ne vaut rien sans équilibre.',
    mazePuzzle: 'هذا المكان لم يكن لها أبدًا ولكن إذا غادرت ستصبح هي نفسها لغزًا',

    // Puzzle status
    solved: 'solved',
    unsolved: 'unsolved',
    lighterThan: 'lighter than',
    heavierThan: 'heavier than',
    equalTo: 'equal to',

    // Puzzle names
    startSequenceName: 'Start Sequence',
    mazePuzzleName: 'Maze Puzzle',
    scalesPuzzleName: 'Scales Puzzle',
    moonPuzzleName: 'Moon Puzzle',
    cipherPuzzleName: 'Cipher Puzzle',
    next: 'Next',

    // Outro text
    helloMoon: 'Hello Moon,',
    outroText1: 'Sometimes it takes too many riddles to realize',
    outroText2: 'Sometimes moon wanes',
    outroText3: 'Happy Birthday Moon!',
    postscript: 'PS2 Did you know that Moon waxes religiously?',
    timeCounterText: 'PS In orbit these past {years} years, {days} days, {hours} hours, {minutes} minutes, and {seconds} seconds',

    // Credits
    gameDesignDevelopment: 'Game Design & Development',
    boxModel: 'Box Model',
    languageInternationalization: 'Language and Internationalization',
    technicalCredits: 'Technical Credits',
    audio: 'Audio',
    dedication: 'Dedication',

    // Credit details
    developer: 'Krzysztof Wende',
    boxModelCreator: 'Some dude on GitHub ¯\\_(ツ)_/¯',
    i18nHelper: 'ChatGPT 4o',
    technicalStack: 'Cursor, Three.js, Logic Pro, Not you Blender, Izotope RX',
    audioTrack: 'Galdive - Teach me how to love',
    dedicationText: 'Moon, Theia, bloo_ness et al.',

    // Test page (if needed)
    hiddenPrototypePuzzles: 'Hidden Prototype Puzzles',
    testPageDescription: 'Congratulations again if you found this page in the process of solving the other puzzles! I built this page in order to test and refine how each puzzle works before moving to 3D. I thought I would in',
    moonPuzzleTest: 'Moon Puzzle',
    scalesPuzzleTest: 'Scales Puzzle',
    puzzleStatus: 'This puzzle is currently',
    weightComparison: 'The left side is evaluated to be',
    theRightSide: 'the right side, so'
  }
};

// Voice over file configuration
export const voiceOverFiles = {
  // Voice over audio files
  maze_vo: '/audio/vo/maze.mp3',
  start_vo: '/audio/vo/start.mp3',
  scales_vo: '/audio/vo/scales.mp3',
  moon_vo: '/audio/vo/moon.mp3',
  riddle_vo: '/audio/vo/riddle.mp3',
  note_vo: '/audio/vo/note.mp3',
  joie_vo: '/audio/vo/joie.mp3',
  tristese_vo: '/audio/vo/tristese.mp3',
  peur_vo: '/audio/vo/peur.mp3',
  amour_vo: '/audio/vo/amour.mp3',
  colere_vo: '/audio/vo/colere.mp3',
  resilience_vo: '/audio/vo/resilience.mp3'
};

// Voice over method mapping
export const voiceOverMethods = {
  start_vo: 'playStartVO',
  scales_vo: 'playScalesVO',
  maze_vo: 'playMazeVO',
  moon_vo: 'playMoonVO',
  riddle_vo: 'playRiddleVO',
  note_vo: 'playNoteVO',
  joie_vo: 'playJoieVO',
  tristese_vo: 'playTristeseVO',
  peur_vo: 'playPeurVO',
  amour_vo: 'playAmourVO',
  colere_vo: 'playColereVO',
      resilience_vo: 'playResilienceVO'
};

// Default language
export const defaultLanguage = 'en';

// Current language (can be changed dynamically)
let currentLanguage = defaultLanguage;

// Get translation function
export function t(key, language = currentLanguage) {
  const lang = translations[language] || translations[defaultLanguage];
  return lang[key] || key;
}

