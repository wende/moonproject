// Audio constants
const DEFAULT_MUSIC_VOLUME = 0.7; // Reduced from 0.3 to 0.12 (40% of original)
const DEFAULT_SFX_VOLUME = 0.5;
const DEFAULT_MASTER_VOLUME = 1.0;
const TEMP_MUSIC_VOLUME_REDUCTION = 0.3;
const VOLUME_MIN = 0;
const VOLUME_MAX = 1;
const FADE_OUT_DELAY = 500;
const COMPLETE_DELAY = 1000;
const BUTTON_CLICK_VOLUME = 0.2;
const PUZZLE_SOLVE_VOLUME = 1;
const PUZZLE_SOLVE_START_TIME = 0.8;

const VOICE_OVER_VOLUME = 0.8;
const MUSIC_FADE_IN = 2.0;
const MUSIC_LOOP_TIMEOUT = 3.0;
const MOONPROJECT_TRUE_VOLUME = 0.001;

class AudioManager {
  constructor() {
    this.audioElements = new Map(); // HTML5 Audio elements
    this.musicElements = new Map(); // Currently playing music
    this.buttonClickPool = []; // Pool of pre-created button click audio elements
    this.currentButtonIndex = 0; // Index for cycling through button click pool
    this.isInitialized = false;
    this.isMuted = false;
    this.musicVolume = DEFAULT_MUSIC_VOLUME;
    this.sfxVolume = DEFAULT_SFX_VOLUME;
    this.masterVolume = DEFAULT_MASTER_VOLUME;
    this.tempMusicVolumeReduction = TEMP_MUSIC_VOLUME_REDUCTION;
    this.voiceOversEnabled = false;
    
    // Audio file paths
    this.audioFiles = {
      moonproject: '/audio/moonproject.mp3',
      moonprojecttrue: '/audio/moonprojecttrue.mp3',
      puzzle_solve: '/audio/puzzle_solve.mp3',
      button_click: '/audio/button_click.mp3',

      maze_vo: '/audio/vo/maze.wav',
      start_vo: '/audio/vo/start.wav'
    };

    // Load saved settings from localStorage
    this.loadSettings();
  }

  // localStorage methods
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('puzzleBoxAudioSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Check if this is an old settings version with high music volume
        if (settings.musicVolume && settings.musicVolume > 0.1) {
          // Convert old music volume to new scale (40% of old value)
          this.musicVolume = settings.musicVolume * 0.4;
          console.log(`Converted old music volume ${settings.musicVolume} to new scale: ${this.musicVolume}`);
        } else {
          this.musicVolume = settings.musicVolume ?? DEFAULT_MUSIC_VOLUME;
        }
        
        this.sfxVolume = settings.sfxVolume ?? DEFAULT_SFX_VOLUME;
        this.masterVolume = settings.masterVolume ?? DEFAULT_MASTER_VOLUME;
        this.isMuted = settings.isMuted ?? false;
        this.voiceOversEnabled = false; // Force disable voice overs
      }
    } catch (error) {
      console.warn('Failed to load audio settings from localStorage:', error);
    }
  }

  saveSettings() {
    try {
      const settings = {
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        masterVolume: this.masterVolume,
        isMuted: this.isMuted,
        voiceOversEnabled: this.voiceOversEnabled
      };
      localStorage.setItem('puzzleBoxAudioSettings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save audio settings to localStorage:', error);
    }
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Initializing audio with HTML5 Audio elements (no microphone permissions needed)');
      
      // Create HTML5 audio elements for each sound
      await this.preloadAudioElements();
      
      this.isInitialized = true;
      console.log('Audio system initialized successfully without Web Audio API');
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  }

  async preloadAudioElements() {
    const audioFiles = Object.entries(this.audioFiles);
    let loadedCount = 0;
    
    const loadPromises = audioFiles.map(async ([key, path]) => {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.volume = this.calculateVolume(key);
        audio.src = path;
        
        // Wait for audio to be ready
        await new Promise((resolve, reject) => {
          audio.addEventListener('canplaythrough', resolve, { once: true });
          audio.addEventListener('error', reject, { once: true });
          audio.load();
        });
        
        this.audioElements.set(key, audio);
        loadedCount++;
        
        // Update loading progress
        const progress = (loadedCount / audioFiles.length) * 100;
        this.updateLoadingProgress(progress, `${loadedCount}/${audioFiles.length} files loaded`);
        
      } catch (error) {
        console.warn(`Failed to load audio file ${path}:`, error);
        loadedCount++;
        
        // Update progress even for failed loads
        const progress = (loadedCount / audioFiles.length) * 100;
        this.updateLoadingProgress(progress, `Failed to load ${key}`);
      }
    });

    await Promise.all(loadPromises);
    
    // Create button click audio pool for instant playback
    this.createButtonClickPool();
  }

  calculateVolume(key) {
    if (this.isMuted) return 0;
    const baseVolume = key.includes('music') ? this.musicVolume : this.sfxVolume;
    return baseVolume * this.masterVolume;
  }

  createButtonClickPool() {
    // Create a pool of 5 pre-loaded button click audio elements for instant playback
    const buttonClickSrc = this.audioFiles.button_click;
    for (let i = 0; i < 5; i++) {
      const audio = new Audio(buttonClickSrc);
      audio.preload = 'auto';
      audio.volume = BUTTON_CLICK_VOLUME * this.sfxVolume * this.masterVolume;
      // Pre-load the audio
      audio.load();
      this.buttonClickPool.push(audio);
    }
    console.log('Button click audio pool created with', this.buttonClickPool.length, 'elements');
  }

  updateLoadingProgress(percentage, text) {
    const progressBar = document.getElementById('audio-loading-progress');
    const progressText = document.getElementById('audio-loading-text');
    const loadingContainer = document.getElementById('audio-loading-container');
    
    if (progressBar && progressText && loadingContainer) {
      // Show loading container if it's hidden
      if (loadingContainer.classList.contains('fade-out')) {
        loadingContainer.classList.remove('fade-out');
      }
      
      progressBar.style.width = `${percentage}%`;
      progressText.textContent = `${Math.round(percentage)}% - ${text}`;
      
      if (percentage >= 100) {
        setTimeout(() => {
          loadingContainer.classList.add('fade-out');
        }, COMPLETE_DELAY);
      }
    }
  }

  playSound(soundName, options = {}) {
    if (!this.isInitialized || this.isMuted) return null;
    
    const originalAudio = this.audioElements.get(soundName);
    if (!originalAudio) {
      console.warn(`Sound not found: ${soundName}`);
      return null;
    }
    
    // Clone the audio element to allow multiple simultaneous plays
    const audio = originalAudio.cloneNode();
    
    // Set volume
    const volume = options.volume !== undefined ? options.volume : 1;
    audio.volume = volume * this.sfxVolume * this.masterVolume;
    
    // Set start time
    if (options.startTime) {
      audio.currentTime = options.startTime;
    }
    
    // Play the sound
    audio.play().catch(error => {
      console.warn(`Failed to play sound ${soundName}:`, error);
    });
    
    return audio;
  }

  playMusic(musicName, options = {}) {
    if (!this.isInitialized || this.isMuted) {
      return null;
    }
    
    const originalAudio = this.audioElements.get(musicName);
    if (!originalAudio) {
      console.warn(`Music not found: ${musicName}`);
      return null;
    }
    
    // Clone the audio element
    const audio = originalAudio.cloneNode();
    
    // Set volume
    const volume = options.volume !== undefined ? options.volume : 1;
    audio.volume = volume * this.musicVolume * this.masterVolume;
    
    // Set loop
    if (options.loop !== false) {
      audio.loop = true;
    }
    
    // Set start time
    if (options.startTime) {
      audio.currentTime = options.startTime;
    }
    
    // Track start time for elapsed time calculation
    const startTime = Date.now();
    audio.startTime = startTime;
    
    // Handle fade in
    if (options.fadeIn && options.fadeIn > 0) {
      audio.volume = 0;
      audio.play().then(() => {
        this.fadeInAudio(audio, volume * this.musicVolume * this.masterVolume, options.fadeIn);
      }).catch(error => {
        console.warn(`Failed to play music ${musicName}:`, error);
      });
    } else {
      audio.play().catch(error => {
        console.warn(`Failed to play music ${musicName}:`, error);
      });
    }
    
    // Store the music element
    this.musicElements.set(musicName, audio);
    
    return audio;
  }

  fadeInAudio(audio, targetVolume, duration) {
    const currentVolume = audio.volume;
    const volumeDifference = targetVolume - currentVolume;
    const steps = 50;
    const stepTime = (duration * 1000) / steps;
    const volumeIncrement = volumeDifference / steps;
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(currentVolume + (volumeIncrement * currentStep), targetVolume);
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
      }
    }, stepTime);
  }

  stopMusic(musicName = null) {
    if (musicName) {
      const audio = this.musicElements.get(musicName);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        this.musicElements.delete(musicName);
      }
    } else {
      // Stop all music
      this.musicElements.forEach((audio, name) => {
        audio.pause();
        audio.currentTime = 0;
      });
      this.musicElements.clear();
    }
  }

  fadeBetweenTracks(fromTrack, toTrack, fadeDuration = 5.0) {
    const fromAudio = this.musicElements.get(fromTrack);
    
    if (fromAudio) {
      // Capture the current position of the from track
      const fromTrackPosition = fromAudio.currentTime;
      
      // Pre-load the new track to minimize start delay
      const originalAudio = this.audioElements.get(toTrack);
      if (!originalAudio) {
        console.warn(`Music not found: ${toTrack}`);
        return;
      }
      
      // Clone and prepare the new audio element
      const newAudio = originalAudio.cloneNode();
      
      // Compensate for play delay by starting slightly ahead
      // The delay varies but is typically 50-200ms, so we start 100ms ahead
      const playDelayCompensation = 0.001; // 100ms
      const compensatedPosition = fromTrackPosition - playDelayCompensation;
      newAudio.currentTime = Math.max(0, compensatedPosition);
      newAudio.loop = true;
      newAudio.volume = 0; // Start at 0 volume for fade-in
      
      // Store the new audio element
      this.musicElements.set(toTrack, newAudio);
      
      // Start playing immediately to minimize delay
      const playPromise = newAudio.play();
      
      // Handle any play errors and start fade-in
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Start fade-in after audio begins playing
          this.fadeInAudio(newAudio, this.musicVolume * this.masterVolume, fadeDuration);
        }).catch(error => {
          console.warn(`Failed to play music ${toTrack}:`, error);
        });
      }
      
      console.log(`Crossfading from ${fromTrack} at ${fromTrackPosition}s to ${toTrack} at ${newAudio.currentTime}s (compensated by ${playDelayCompensation}s)`);
      
      // Now fade out the old track while new track is already playing
      this.fadeOutAudio(fromAudio, fadeDuration * 1.2);
      
      // Stop and clean up the old track after fade completes
      setTimeout(() => {
        fromAudio.pause();
        this.musicElements.delete(fromTrack);
      }, fadeDuration * 1200);
      
    } else {
      // No from track, just start the to track
      this.playMusic(toTrack, { fadeIn: fadeDuration, loop: true });
    }
  }

  fadeOutAudio(audio, duration) {
    const steps = 50;
    const stepTime = (duration * 1000) / steps;
    const volumeDecrement = audio.volume / steps;
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(audio.volume - volumeDecrement, 0);
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
      }
    }, stepTime);
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volume));
    this.updateAllVolumes();
    this.saveSettings();
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volume));
    this.updateAllVolumes();
    this.saveSettings();
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volume));
    this.updateAllVolumes();
    this.saveSettings();
  }

  setMusicVolumeTemporary(volume) {
    // Temporarily set music volume without saving to settings
    const originalVolume = this.musicVolume;
    this.musicVolume = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volume));
    this.updateAllVolumes();
    return originalVolume; // Return original volume for restoration
  }

  updateAllVolumes() {
    // Update all currently playing music volumes
    this.musicElements.forEach((audio, name) => {
      if (this.isMuted) {
        audio.volume = 0;
      } else {
        // Preserve the original volume settings for tracks that should stay at low volume
        if (name === 'moonprojecttrue') {
          // Keep moonprojecttrue at very low volume until game completion
          audio.volume = 0.001 * this.masterVolume;
        } else {
          // Normal music tracks use music volume
          audio.volume = this.musicVolume * this.masterVolume;
        }
      }
    });
    
    // Update button click pool volumes
    this.buttonClickPool.forEach(audio => {
      if (this.isMuted) {
        audio.volume = 0;
      } else {
        audio.volume = BUTTON_CLICK_VOLUME * this.sfxVolume * this.masterVolume;
      }
    });
  }

  mute() {
    this.isMuted = true;
    this.updateAllVolumes();
    this.saveSettings();
  }

  unmute() {
    this.isMuted = false;
    this.updateAllVolumes();
    this.saveSettings();
  }

  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }

  // Convenience methods for common game sounds
  playButtonClick() {
    // Prevent multiple rapid button clicks from playing multiple sounds
    if (this.lastButtonClickTime && Date.now() - this.lastButtonClickTime < 100) {
      return null; // Ignore clicks within 100ms of each other
    }
    this.lastButtonClickTime = Date.now();
    
    // Use the original playSound method for button clicks - simpler and more reliable
    return this.playSound('button_click', { volume: BUTTON_CLICK_VOLUME, startTime: 0.2 });
  }

  playPuzzleSolve() {
    return this.playSound('puzzle_solve', { volume: PUZZLE_SOLVE_VOLUME, startTime: PUZZLE_SOLVE_START_TIME });
  }



  playMazeVO() {
    if (!this.voiceOversEnabled) return null;
    return this.playSound('maze_vo', { volume: VOICE_OVER_VOLUME });
  }

  playStartVO() {
    if (!this.voiceOversEnabled) return null;
    return this.playSound('start_vo', { volume: VOICE_OVER_VOLUME });
  }

  // Voice over control methods
  areVoiceOversEnabled() {
    return false; // Force disable voice overs
  }

  setVoiceOversEnabled(enabled) {
    this.voiceOversEnabled = enabled;
    this.saveSettings();
  }

  toggleVoiceOvers() {
    this.voiceOversEnabled = !this.voiceOversEnabled;
    this.saveSettings();
    return this.voiceOversEnabled;
  }

  // Get the temporary music volume reduction factor
  getTempMusicVolumeReduction() {
    return this.tempMusicVolumeReduction;
  }

  // Resume context (no-op for HTML5 Audio)
  async resumeContext() {
    // No-op for HTML5 Audio
  }

  // Cleanup
  dispose() {
    this.stopMusic();
    this.audioElements.clear();
    this.isInitialized = false;
  }
}

// Create global audio manager instance
const audioManager = new AudioManager();

// Create namespace for global access
window.PuzzleBox = window.PuzzleBox || {};

// Make audioManager globally accessible
window.PuzzleBox.audioManager = audioManager;

// Expose fadeBetweenTracks for testing
window.PuzzleBox.fadeBetweenTracks = (fromTrack, toTrack, duration) => {
  return audioManager.fadeBetweenTracks(fromTrack, toTrack, duration);
};

// Expose cipher puzzle completion audio transition for testing
window.PuzzleBox.testCipherAudioTransition = () => {
  return audioManager.fadeBetweenTracks('moonproject', 'moonprojecttrue', 2);
};

// Global function to ensure audio context is resumed (no-op for HTML5 Audio)
window.PuzzleBox.resumeAudioContext = async () => {
  // No-op for HTML5 Audio
};

// Flag to track if music has been started
let musicStarted = false;

export { AudioManager, audioManager };

// Function to start music after user interaction
export function startMusicAfterInteraction(event) {
  // Check if music has already been started
  if (musicStarted) {
    return;
  }

  // Ignore clicks on audio control elements
  if (event && event.target) {
    const target = event.target;
    
    // Ignore clicks on any audio control elements
    if (target.closest('.audio-controls') || 
        target.closest('.audio-toggle-btn') ||
        target.closest('.volume-slider') ||
        target.closest('#master-volume') ||
        target.closest('#music-volume') ||
        target.closest('#sfx-volume') ||
        target.closest('#mute-btn') ||
        target.closest('.audio-close-btn') ||
        target.closest('.audio-control-group') ||
        target.closest('.audio-controls-header') ||
        target.closest('.audio-controls-content') ||
        target.closest('.audio-control-buttons') ||
        target.closest('.volume-value')) {
      console.log('Ignoring audio control interaction:', target.tagName, target.className, target.id);
      return; // Don't start music for audio control clicks
    }
  }

  console.log('Starting music after interaction:', event?.type, event?.target?.tagName, event?.target?.className);
  musicStarted = true;
  
  // Initialize audio first if not already done
  audioManager.initialize().then(() => {
    // Start only the main moonproject track initially
    const moonprojectAudio = audioManager.playMusic('moonproject', { fadeIn: MUSIC_FADE_IN, loop: true, startTime: 0 });
    
    console.log('Started main music track: moonproject');
  }).catch(error => {
    console.error('Failed to initialize audio:', error);
  });
  
  // Remove the event listener after first interaction
  document.removeEventListener('click', startMusicAfterInteraction);
  document.removeEventListener('keydown', startMusicAfterInteraction);
  document.removeEventListener('touchstart', startMusicAfterInteraction);
}

// Initialize audio system and create audio toggle button after DOM is ready
export function initializeAudioSystem() {
  // Show loading bar (but don't start audio loading yet)
  const loadingContainer = document.getElementById('audio-loading-container');
  if (loadingContainer) {
    loadingContainer.classList.remove('fade-out');
  }
  
  // Don't initialize audio system yet - wait for user interaction
  // This prevents microphone permission requests on page load
}
