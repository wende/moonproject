// Audio constants
const DEFAULT_MUSIC_VOLUME = 0.1;
const DEFAULT_SFX_VOLUME = 0.5;
const DEFAULT_MASTER_VOLUME = 1.0;
const VOLUME_MIN = 0;
const VOLUME_MAX = 1;
const FADE_OUT_DELAY = 500;
const COMPLETE_DELAY = 300;
const BUTTON_CLICK_VOLUME = 0.2;
const PUZZLE_SOLVE_VOLUME = 1;
const PUZZLE_SOLVE_START_TIME = 0.8;
const VOICE_OVER_VOLUME = 0.8;
const NOTE_VO_DELAY = 500;
const MUSIC_FADE_IN = 0.5;
const MOONPROJECT_TRUE_VOLUME = 0.12; // 20% louder than regular music

// Memory optimization constants
const MAX_AUDIO_POOL_SIZE = 3;
const MAX_SIMULTANEOUS_SOUNDS = 8;
const AUDIO_CLEANUP_INTERVAL = 30000;
const FADE_STEPS = 50;

// Timing and delay constants
const BUTTON_CLICK_DEBOUNCE = 100; // ms
const SHOW_BUTTON_DELAY = 100; // ms
const FADE_DURATION_MULTIPLIER = 1.2;
const FADE_CLEANUP_DELAY = 1200; // ms
const PROCESSING_DELAY = 0.1; // seconds
const PLAY_DELAY_COMPENSATION = 0.001; // seconds
const TEMP_MUSIC_VOLUME_REDUCTION = 0.3; // Duck to 30% during voice overs

// Progress and UI constants
const PROGRESS_PERCENTAGE_MULTIPLIER = 100;
const PROGRESS_COMPLETION_THRESHOLD = 100;

// Audio file configuration
const AUDIO_FILES = {
  // Music tracks
  moonproject: '/audio/moonproject.mp3',
  moonprojecttrue: '/audio/moonprojecttrue.mp3',
  
  // Sound effects
  puzzle_solve: '/audio/puzzle_solve.mp3',
  button_click: '/audio/button_click.mp3',
  
  // Voice overs
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
const VOICE_OVER_METHODS = {
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

class AudioManager {
  constructor() {
    this.audioElements = new Map();
    this.musicElements = new Map();
    this.buttonClickPool = [];
    this.activeAudioElements = new Set();
    
    // State flags
    this.isInitialized = false;
    this.isMuted = false;
    this.voiceOversEnabled = true;
    this.isPlayingVoiceOver = false;
    this.isTemporaryVolumeActive = false;
    
    // Volume settings
    this.musicVolume = DEFAULT_MUSIC_VOLUME;
    this.sfxVolume = DEFAULT_SFX_VOLUME;
    this.masterVolume = DEFAULT_MASTER_VOLUME;
    this.voiceOverVolume = VOICE_OVER_VOLUME;
    
    // Voice over tracking
    this.currentVoiceOverAudio = null;
    this.lastButtonClickTime = 0;
    this.lastCleanupTime = Date.now();
    
    // Audio files
    this.audioFiles = AUDIO_FILES;
    
    this.loadSettings();
    this.startCleanupInterval();
  }

  // ===== SETTINGS MANAGEMENT =====
  
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('puzzleBoxAudioSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.musicVolume = settings.musicVolume ?? DEFAULT_MUSIC_VOLUME;
        this.sfxVolume = settings.sfxVolume ?? DEFAULT_SFX_VOLUME;
        this.masterVolume = settings.masterVolume ?? DEFAULT_MASTER_VOLUME;
        this.voiceOverVolume = settings.voiceOverVolume ?? VOICE_OVER_VOLUME;
        this.isMuted = settings.isMuted ?? false;
        this.voiceOversEnabled = settings.voiceOversEnabled ?? true;
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  }

  saveSettings() {
    if (this.isTemporaryVolumeActive) return;
    
    try {
      const settings = {
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        masterVolume: this.masterVolume,
        voiceOverVolume: this.voiceOverVolume,
        isMuted: this.isMuted,
        voiceOversEnabled: this.voiceOversEnabled
      };
      localStorage.setItem('puzzleBoxAudioSettings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save audio settings:', error);
    }
  }

  // ===== VOLUME MANAGEMENT =====
  
  setVolume(type, volume) {
    const clampedVolume = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volume));
    
    switch (type) {
      case 'music':
        this.musicVolume = clampedVolume;
        break;
      case 'sfx':
        this.sfxVolume = clampedVolume;
        break;
      case 'master':
        this.masterVolume = clampedVolume;
        break;
      case 'voiceOver':
        this.voiceOverVolume = clampedVolume;
        break;
    }
    
    if (type !== 'voiceOver') {
      this.updateAllVolumes();
    }
    this.saveSettings();
  }

  setMusicVolume(volume) { this.setVolume('music', volume); }
  setSFXVolume(volume) { this.setVolume('sfx', volume); }
  setMasterVolume(volume) { this.setVolume('master', volume); }
  setVoiceOverVolume(volume) { this.setVolume('voiceOver', volume); }

  setMusicVolumeTemporary(volume) {
    const originalVolume = this.musicVolume;
    this.musicVolume = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volume));
    this.isTemporaryVolumeActive = true;
    this.updateAllVolumes();
    return originalVolume;
  }

  restoreMusicVolume(originalVolume) {
    this.musicVolume = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, originalVolume));
    this.isTemporaryVolumeActive = false;
    this.updateAllVolumes();
  }

  updateAllVolumes() {
    // Update music volumes
    this.musicElements.forEach((audio, name) => {
      audio.volume = this.isMuted ? 0 : this.getMusicVolume(name);
    });

    // Update button click pool volumes
    this.buttonClickPool.forEach(audio => {
      audio.volume = this.isMuted ? 0 : BUTTON_CLICK_VOLUME * this.sfxVolume * this.masterVolume;
    });
  }

  getMusicVolume(trackName) {
    if (trackName === 'moonprojecttrue') {
      return MOONPROJECT_TRUE_VOLUME * this.masterVolume;
    }
    return this.musicVolume * this.masterVolume;
  }

  // ===== MUTE CONTROLS =====
  
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
    this.isMuted ? this.unmute() : this.mute();
    return this.isMuted;
  }

  // ===== INITIALIZATION =====
  
  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.preloadAudioElements();
      this.isInitialized = true;
      this.retryPendingAudioMethods();
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  }

  async preloadAudioElements() {
    const audioFiles = Object.entries(this.audioFiles);
    let loadedCount = 0;

    // Load all files sequentially to ensure proper progress tracking
    for (const [key, path] of audioFiles) {
      await this.loadAudioFile(key, path, loadedCount, audioFiles.length);
      loadedCount++;
    }

    this.createButtonClickPool();
  }

  async loadAudioFile(key, path, loadedCount, totalFiles) {
    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = this.calculateVolume(key);
      audio.src = path;

      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', reject, { once: true });
        audio.load();
      });

      this.audioElements.set(key, audio);
      // Show progress as completed files (loadedCount + 1 since we just finished loading this file)
      const completedFiles = loadedCount + 1;
      this.updateLoadingProgress((completedFiles / totalFiles) * PROGRESS_PERCENTAGE_MULTIPLIER, `${completedFiles}/${totalFiles} files loaded`);
    } catch (error) {
      console.warn(`Failed to load audio file ${path}:`, error);
      // Even failed files count as "processed"
      const completedFiles = loadedCount + 1;
      this.updateLoadingProgress((completedFiles / totalFiles) * PROGRESS_PERCENTAGE_MULTIPLIER, `Failed to load ${key}`);
    }
  }

  calculateVolume(key) {
    if (this.isMuted) return 0;
    const baseVolume = key.includes('_vo') ? this.voiceOverVolume : 
                      key.includes('music') ? this.musicVolume : this.sfxVolume;
    return baseVolume * this.masterVolume;
  }

  createButtonClickPool() {
    for (let i = 0; i < MAX_AUDIO_POOL_SIZE; i++) {
      const audio = new Audio(this.audioFiles.button_click);
      audio.preload = 'auto';
      audio.volume = BUTTON_CLICK_VOLUME * this.sfxVolume * this.masterVolume;
      audio.load();
      this.buttonClickPool.push(audio);
    }
  }

  updateLoadingProgress(percentage, text) {
    const progressBar = document.getElementById('audio-loading-progress');
    const progressText = document.getElementById('audio-loading-text');
    const loadingContainer = document.getElementById('audio-loading-container');

    if (progressBar && progressText && loadingContainer) {
      if (loadingContainer.classList.contains('fade-out')) {
        loadingContainer.classList.remove('fade-out');
      }

      progressBar.style.width = `${percentage}%`;
      progressText.textContent = `${Math.round(percentage)}% - ${text}`;

      if (percentage >= PROGRESS_COMPLETION_THRESHOLD) {
        setTimeout(() => {
          const loadingContent = loadingContainer.querySelector('.loading-content');
          const continueButton = document.querySelector('.loading-complete-button');
          
          if (loadingContent && continueButton) {
            loadingContent.style.display = 'none';
            continueButton.style.display = 'block';
            setTimeout(() => continueButton.classList.add('show'), SHOW_BUTTON_DELAY);
          }
        }, COMPLETE_DELAY);
      }
    }
  }

  // ===== AUDIO PLAYBACK =====
  
  playSound(soundName, options = {}) {
    if (!this.isInitialized || this.isMuted) return null;

    const originalAudio = this.audioElements.get(soundName);
    if (!originalAudio) {
      console.warn(`Sound not found: ${soundName}`);
      return null;
    }

    this.limitActiveAudioElements();

    const audio = originalAudio.cloneNode();
    const volume = options.volume !== undefined ? options.volume : 1;
    audio.volume = volume * this.sfxVolume * this.masterVolume;

    if (options.startTime) {
      audio.currentTime = options.startTime;
    }

    this.activeAudioElements.add(audio);
    audio.addEventListener('ended', () => this.activeAudioElements.delete(audio), { once: true });

    audio.play().catch(error => {
      console.warn(`Failed to play sound ${soundName}:`, error);
      this.activeAudioElements.delete(audio);
    });

    return audio;
  }

  playMusic(musicName, options = {}) {
    if (!this.isInitialized || this.isMuted) return null;

    const originalAudio = this.audioElements.get(musicName);
    if (!originalAudio) {
      console.warn(`Music not found: ${musicName}`);
      return null;
    }

    const audio = originalAudio.cloneNode();
    const volume = options.volume !== undefined ? options.volume : 1;
    audio.volume = volume * this.getMusicVolume(musicName);

    if (options.loop !== false) audio.loop = true;
    if (options.startTime) audio.currentTime = options.startTime;

    audio.startTime = Date.now();

    if (options.fadeIn && options.fadeIn > 0) {
      audio.volume = 0;
      audio.play().then(() => {
        this.fadeInAudio(audio, volume * this.getMusicVolume(musicName), options.fadeIn);
      }).catch(error => {
        console.warn(`Failed to play music ${musicName}:`, error);
      });
    } else {
      audio.play().catch(error => {
        console.warn(`Failed to play music ${musicName}:`, error);
      });
    }

    this.musicElements.set(musicName, audio);
    return audio;
  }

  // ===== FADE EFFECTS =====
  
  fadeInAudio(audio, targetVolume, duration) {
    this.fadeAudio(audio, 0, targetVolume, duration);
  }

  fadeOutAudio(audio, duration) {
    this.fadeAudio(audio, audio.volume, 0, duration);
  }

  fadeAudio(audio, fromVolume, toVolume, duration) {
    const volumeDifference = toVolume - fromVolume;
    const stepTime = (duration * 1000) / FADE_STEPS;
    const volumeIncrement = volumeDifference / FADE_STEPS;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(0, Math.min(1, fromVolume + (volumeIncrement * currentStep)));

      if (currentStep >= FADE_STEPS) {
        clearInterval(fadeInterval);
      }
    }, stepTime);
  }

  fadeBetweenTracks(fromTrack, toTrack, fadeDuration = 5.0) {
    const fromAudio = this.musicElements.get(fromTrack);

    if (fromAudio) {
      const fromTrackPosition = fromAudio.currentTime;
      const originalAudio = this.audioElements.get(toTrack);
      
      if (!originalAudio) {
        console.warn(`Music not found: ${toTrack}`);
        return;
      }

      const newAudio = originalAudio.cloneNode();
      
      // Account for processing delay when transitioning to outro track
      let targetPosition = fromTrackPosition;
      if (toTrack === 'moonprojecttrue') {
        // Add a small delay to compensate for processing time
        targetPosition = fromTrackPosition + PROCESSING_DELAY;
      }
      
      const playDelayCompensation = PLAY_DELAY_COMPENSATION;
      const compensatedPosition = Math.max(0, targetPosition - playDelayCompensation);
      
      newAudio.currentTime = compensatedPosition;
      newAudio.loop = true;
      newAudio.volume = 0;

      this.musicElements.set(toTrack, newAudio);

      newAudio.play().then(() => {
        this.fadeInAudio(newAudio, this.getMusicVolume(toTrack), fadeDuration);
      }).catch(error => {
        console.warn(`Failed to play music ${toTrack}:`, error);
      });

      this.fadeOutAudio(fromAudio, fadeDuration * FADE_DURATION_MULTIPLIER);

      setTimeout(() => {
        fromAudio.pause();
        this.musicElements.delete(fromTrack);
      }, fadeDuration * FADE_CLEANUP_DELAY);
    } else {
      this.playMusic(toTrack, { fadeIn: fadeDuration, loop: true });
    }
  }

  // ===== MUSIC CONTROL =====
  
  stopMusic(musicName = null) {
    if (musicName) {
      const audio = this.musicElements.get(musicName);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        this.musicElements.delete(musicName);
      }
    } else {
      this.musicElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      this.musicElements.clear();
    }
  }

  // ===== CONVENIENCE METHODS =====
  
  playButtonClick() {
    if (this.lastButtonClickTime && Date.now() - this.lastButtonClickTime < BUTTON_CLICK_DEBOUNCE) {
      return null;
    }
    this.lastButtonClickTime = Date.now();
    return this.playSound('button_click', { volume: BUTTON_CLICK_VOLUME, startTime: 0.2 });
  }

  playPuzzleSolve() {
    return this.playSound('puzzle_solve', { volume: PUZZLE_SOLVE_VOLUME, startTime: PUZZLE_SOLVE_START_TIME });
  }

  // ===== VOICE OVER SYSTEM =====
  
  _playVoiceOver(soundName) {
    if (!this.voiceOversEnabled) return null;
    
    if (this.isPlayingVoiceOver && this.currentVoiceOverAudio) {
      this.currentVoiceOverAudio.pause();
      this.currentVoiceOverAudio.currentTime = 0;
      this.isPlayingVoiceOver = false;
    }
    
    this.isPlayingVoiceOver = true;
    const audio = this.playSound(soundName, { volume: this.voiceOverVolume });
    
    if (audio) {
      this.currentVoiceOverAudio = audio;
      audio.addEventListener('ended', () => {
        this.isPlayingVoiceOver = false;
        this.currentVoiceOverAudio = null;
      }, { once: true });
      
      const originalAudio = this.audioElements.get(soundName);
      if (originalAudio && originalAudio.duration) {
        return { duration: originalAudio.duration, audio: audio };
      }
    } else {
      this.isPlayingVoiceOver = false;
      this.currentVoiceOverAudio = null;
    }
    return audio;
  }

  // Generate voice over methods dynamically
  _generateVoiceOverMethods() {
    Object.entries(VOICE_OVER_METHODS).forEach(([fileKey, methodName]) => {
      this[methodName] = () => this._playVoiceOver(fileKey);
    });
    
    // Special case for note VO with delay
    this.playNoteVO = () => {
      const audioElement = this.audioElements.get('note_vo');
      if (audioElement) {
        setTimeout(() => this._playVoiceOver('note_vo'), NOTE_VO_DELAY);
        return { duration: audioElement.duration, delayed: true };
      }
      return null;
    };
  }

  // ===== VOICE OVER CONTROLS =====
  
  areVoiceOversEnabled() {
    return this.voiceOversEnabled;
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

  // ===== MEMORY MANAGEMENT =====
  
  startCleanupInterval() {
    setInterval(() => this.cleanupUnusedAudio(), AUDIO_CLEANUP_INTERVAL);
  }

  cleanupUnusedAudio() {
    const now = Date.now();
    if (now - this.lastCleanupTime < AUDIO_CLEANUP_INTERVAL) return;

    this.activeAudioElements.forEach(audio => {
      if (audio.ended || audio.paused) {
        this.activeAudioElements.delete(audio);
        audio.onended = audio.onerror = audio.onload = null;
      }
    });

    this.lastCleanupTime = now;
  }

  limitActiveAudioElements() {
    if (this.activeAudioElements.size >= MAX_SIMULTANEOUS_SOUNDS) {
      const oldestAudio = this.activeAudioElements.values().next().value;
      if (oldestAudio) {
        oldestAudio.pause();
        oldestAudio.currentTime = 0;
        this.activeAudioElements.delete(oldestAudio);
      }
    }
  }

  // ===== UTILITY METHODS =====
  
  retryPendingAudioMethods() {
    const dialogueButton = document.querySelector('.dialogue-button');
    if (dialogueButton?.dataset.pendingAudioMethod) {
      const pendingMethod = dialogueButton.dataset.pendingAudioMethod;
      if (typeof this[pendingMethod] === 'function') {
        dialogueButton.dataset.audioMethod = pendingMethod;
        dialogueButton.removeAttribute('data-pending-audio-method');
        
        if (this.areVoiceOversEnabled()) {
          this[pendingMethod]();
        }
      }
    }
  }

  getTempMusicVolumeReduction() {
    return TEMP_MUSIC_VOLUME_REDUCTION; // Duck to 30% during voice overs
  }

  async resumeContext() {
    // No-op for HTML5 Audio
  }

  dispose() {
    this.stopMusic();
    this.audioElements.clear();
    this.isInitialized = false;
  }
}

// Initialize voice over methods
const audioManager = new AudioManager();
audioManager._generateVoiceOverMethods();

// ===== GLOBAL EXPORTS =====
window.PuzzleBox = window.PuzzleBox || {};
window.PuzzleBox.audioManager = audioManager;
window.PuzzleBox.fadeBetweenTracks = (fromTrack, toTrack, duration) => {
  return audioManager.fadeBetweenTracks(fromTrack, toTrack, duration);
};
window.PuzzleBox.testCipherAudioTransition = () => {
  return audioManager.fadeBetweenTracks('moonproject', 'moonprojecttrue', 2);
};
window.PuzzleBox.resumeAudioContext = async () => {
  // No-op for HTML5 Audio
};

// ===== MUSIC STARTUP =====
let musicStarted = false;

export { AudioManager, audioManager, NOTE_VO_DELAY };

export function startMusicAfterInteraction(event) {
  if (musicStarted) return;

  // Ignore audio control interactions
  if (event?.target) {
    const target = event.target;
    const audioControlSelectors = [
      '.audio-controls', '.audio-toggle-btn', '.volume-slider',
      '#master-volume', '#music-volume', '#sfx-volume', '#mute-btn',
      '.audio-close-btn', '.audio-control-group', '.audio-controls-header',
      '.audio-controls-content', '.audio-control-buttons', '.volume-value'
    ];
    
    if (audioControlSelectors.some(selector => target.closest(selector))) {
      return;
    }
  }

  musicStarted = true;
  const moonprojectAudio = audioManager.audioElements.get('moonproject');
  
  if (moonprojectAudio?.readyState >= 2) {
    audioManager.playMusic('moonproject', { fadeIn: MUSIC_FADE_IN, loop: true, startTime: 0 });
  } else {
    audioManager.initialize().then(() => {
      audioManager.playMusic('moonproject', { fadeIn: MUSIC_FADE_IN, loop: true, startTime: 0 });
    }).catch(error => {
      console.error('Failed to initialize audio:', error);
    });
  }

  // Remove event listeners
  ['click', 'keydown', 'touchstart'].forEach(eventType => {
    document.removeEventListener(eventType, startMusicAfterInteraction);
  });
}

export function initializeAudioSystem() {
  const loadingContainer = document.getElementById('audio-loading-container');
  if (loadingContainer) {
    loadingContainer.classList.remove('fade-out');
  }
}


