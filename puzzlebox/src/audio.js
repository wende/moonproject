class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.currentMusic = null;
    this.sounds = new Map();
    this.isInitialized = false;
    this.isMuted = false;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.5;
    
    // Audio file paths
    this.audioFiles = {
      background: '/audio/ambient_mystery.mp3',
      moonost: '/audio/moonost.mp3',
      puzzle_solve: '/audio/puzzle_solve.mp3',
      button_click: '/audio/button_click.mp3',
      box_open: '/audio/box_open.mp3',
      paper_rustle: '/audio/paper_rustle.mp3',
      success_chime: '/audio/success_chime.mp3',
      error_buzz: '/audio/error_buzz.mp3',
      wind_chimes: '/audio/wind_chimes.mp3',
      heartbeat: '/audio/heartbeat.mp3',
      footsteps: '/audio/footsteps.mp3'
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create gain nodes for mixing
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      
      // Connect the audio graph
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      
      // Set initial volumes
      this.musicGain.gain.value = this.musicVolume;
      this.sfxGain.gain.value = this.sfxVolume;
      this.masterGain.gain.value = 1.0;
      
      // Preload all audio files
      await this.preloadAudio();
      
      this.isInitialized = true;
      console.log('Audio system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  }

  async preloadAudio() {
    console.log('Starting to preload audio files...');
    const loadPromises = Object.entries(this.audioFiles).map(async ([key, path]) => {
      try {
        console.log(`Loading audio file: ${key} from ${path}`);
        const audioBuffer = await this.loadAudioFile(path);
        this.sounds.set(key, audioBuffer);
        console.log(`Successfully loaded audio: ${key}`);
      } catch (error) {
        console.warn(`Failed to load audio file ${path}:`, error);
      }
    });

    await Promise.all(loadPromises);
    console.log('Finished preloading audio files. Loaded sounds:', Array.from(this.sounds.keys()));
  }

  async loadAudioFile(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  playSound(soundName, options = {}) {
    if (!this.isInitialized || this.isMuted) return null;
    
    const audioBuffer = this.sounds.get(soundName);
    if (!audioBuffer) {
      console.warn(`Sound not found: ${soundName}`);
      return null;
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    // Apply options
    if (options.volume !== undefined) {
      gainNode.gain.value = options.volume * this.sfxVolume;
    } else {
      gainNode.gain.value = this.sfxVolume;
    }
    
    if (options.loop) {
      source.loop = true;
    }
    
    if (options.playbackRate) {
      source.playbackRate.value = options.playbackRate;
    }
    
    source.start(0);
    return source;
  }

  playMusic(musicName, options = {}) {
    console.log(`Attempting to play music: ${musicName}`);
    console.log(`Audio initialized: ${this.isInitialized}, Muted: ${this.isMuted}`);
    
    if (!this.isInitialized || this.isMuted) {
      console.warn(`Cannot play music: initialized=${this.isInitialized}, muted=${this.isMuted}`);
      return null;
    }
    
    // Stop current music if playing
    this.stopMusic();
    
    const audioBuffer = this.sounds.get(musicName);
    if (!audioBuffer) {
      console.warn(`Music not found: ${musicName}`);
      console.log('Available sounds:', Array.from(this.sounds.keys()));
      return null;
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(this.musicGain);
    
    // Apply options
    if (options.volume !== undefined) {
      gainNode.gain.value = options.volume * this.musicVolume;
    } else {
      gainNode.gain.value = this.musicVolume;
    }
    
    if (options.loop !== false) {
      source.loop = true; // Music loops by default
    }
    
    if (options.fadeIn) {
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        (options.volume || 1) * this.musicVolume,
        this.audioContext.currentTime + options.fadeIn
      );
    }
    
    source.start(0);
    this.currentMusic = { source, gainNode, name: musicName };
    return source;
  }

  stopMusic(fadeOut = 0.5) {
    if (!this.currentMusic) return;
    
    const { source, gainNode } = this.currentMusic;
    
    if (fadeOut > 0) {
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeOut);
      setTimeout(() => {
        source.stop();
      }, fadeOut * 1000);
    } else {
      source.stop();
    }
    
    this.currentMusic = null;
  }

  pauseMusic() {
    if (this.currentMusic) {
      this.currentMusic.source.stop();
    }
  }

  resumeMusic() {
    if (this.currentMusic && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }

  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  mute() {
    this.isMuted = true;
    if (this.masterGain) {
      this.masterGain.gain.value = 0;
    }
  }

  unmute() {
    this.isMuted = false;
    if (this.masterGain) {
      this.masterGain.gain.value = 1;
    }
  }

  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return !this.isMuted;
  }

  // Convenience methods for common game sounds
  playButtonClick() {
    return this.playSound('button_click', { volume: 0.6 });
  }

  playPuzzleSolve() {
    return this.playSound('puzzle_solve', { volume: 0.8 });
  }

  playBoxOpen() {
    return this.playSound('box_open', { volume: 0.7 });
  }

  playSuccessChime() {
    return this.playSound('success_chime', { volume: 0.9 });
  }

  playErrorBuzz() {
    return this.playSound('error_buzz', { volume: 0.5 });
  }

  playPaperRustle() {
    return this.playSound('paper_rustle', { volume: 0.4 });
  }

  playWindChimes() {
    return this.playSound('wind_chimes', { volume: 0.6 });
  }

  playHeartbeat() {
    return this.playSound('heartbeat', { volume: 0.3, loop: true });
  }

  playFootsteps() {
    return this.playSound('footsteps', { volume: 0.4 });
  }

  // Resume audio context when user interacts (required by browsers)
  resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Cleanup
  dispose() {
    if (this.currentMusic) {
      this.currentMusic.source.stop();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.sounds.clear();
    this.isInitialized = false;
  }
}

// Create global audio manager instance
const audioManager = new AudioManager();

// Initialize audio on first user interaction
function initializeAudioOnInteraction() {
  console.log('User interaction detected, initializing audio...');
  audioManager.initialize().then(() => {
    console.log('Audio initialized on user interaction');
    // Resume audio context
    audioManager.resumeContext();
  });
  document.removeEventListener('click', initializeAudioOnInteraction);
  document.removeEventListener('keydown', initializeAudioOnInteraction);
  document.removeEventListener('touchstart', initializeAudioOnInteraction);
}

document.addEventListener('click', initializeAudioOnInteraction);
document.addEventListener('keydown', initializeAudioOnInteraction);
document.addEventListener('touchstart', initializeAudioOnInteraction);

export { AudioManager, audioManager };
