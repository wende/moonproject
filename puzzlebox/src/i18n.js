// Internationalization (i18n) file for The Box For The Moon
// Contains all text strings used throughout the application

export const translations = {
  en: {
    // Page titles and headers
    pageTitle: "The Box For The Moon",
    siteTitle: "The box for the Moon",
    congratulations: "Congratulations",
    credits: "Credits",
    
    // Navigation and buttons
    openIntro: "Open Intro",
    lookInside: "Look Inside",
    continue: "Continue",
    close: "Close",
    creditsButton: "Credits",
    
    // Loading
    loading: "Loading...",
    
    // Audio controls
    audioSettings: "Audio Settings",
    masterVolume: "Master Volume",
    musicVolume: "Music Volume",
    soundEffectsVolume: "Sound Effects Volume",
    voiceOvers: "Voice Overs",
    enabled: "Enabled",
    disabled: "Disabled",
    mute: "Mute",
    unmute: "Unmute",
    audio: "Audio",
    
    // Puzzle dialogue and text
    startSequence: "South, East, West, North",
    mazePuzzle: "هذا المكان لم يكن لها أبدًا ولكن إذا غادرت ستصبح هي نفسها لغزًا",
    scalesPuzzle: "Cœurs légers. Âmes lourdes. Tout cela ne vaut rien sans équilibre.",
    moonPuzzle: "She traveled the world. But her darkness wasn't vanishing — it was the path she had to take to become full again.",
    cipherPuzzle: "Sometimes riddles are best solved by just asking yourself",
    
    // Puzzle status
    solved: "solved",
    unsolved: "unsolved",
    lighterThan: "lighter than",
    heavierThan: "heavier than",
    equalTo: "equal to",
    
    // Puzzle names
    startSequenceName: "Start Sequence",
    mazePuzzleName: "Maze Puzzle",
    scalesPuzzleName: "Scales Puzzle",
    moonPuzzleName: "Moon Puzzle",
    cipherPuzzleName: "Cipher Puzzle",
    next: "Next",
    
    // Outro text
    helloMoon: "Hello Moon",
    outroText1: "Sometimes it takes too many riddles to realize",
    outroText2: "Sometimes moon wanes",
    outroText3: "Happy Birthday Moon",
    postscript: "PS. Did you know that Moon waxes religiously?",
    
    // Credits
    gameDesignDevelopment: "Game Design & Development",
    boxModel: "Box Model",
    languageInternationalization: "Language and Internationalization",
    technicalCredits: "Technical Credits",
    audio: "Audio",
    dedication: "Dedication",
    
    // Credit details
    developer: "Krzysztof Wende",
    boxModelCreator: "Some dude on GitHub ¯\\_(ツ)_/¯",
    i18nHelper: "ChatGPT 4o",
    technicalStack: "Cursor, Three.js, Logic Pro, Not you Blender, Izotope RX",
    audioTrack: "Galdive - Teach me how to love",
    dedicationText: "Moon, Theia, bloo_ness et al.",
    
    // Test page (if needed)
    hiddenPrototypePuzzles: "Hidden Prototype Puzzles",
    testPageDescription: "Congratulations again if you found this page in the process of solving the other puzzles! I built this page in order to test and refine how each puzzle works before moving to 3D. I thought I would in",
    moonPuzzleTest: "Moon Puzzle",
    directionPuzzleTest: "Direction Puzzle",
    scalesPuzzleTest: "Scales Puzzle",
    puzzleStatus: "This puzzle is currently",
    directionSequences: "This puzzle has 3 hidden sequences. You have found",
        weightComparison: "The left side is evaluated to be",
    theRightSide: "the right side, so"
  }
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

// Set current language
export function setLanguage(language) {
  if (translations[language]) {
    currentLanguage = language;
    return true;
  }
  return false;
}

// Get current language
export function getCurrentLanguage() {
  return currentLanguage;
}

// Get available languages
export function getAvailableLanguages() {
  return Object.keys(translations);
}
