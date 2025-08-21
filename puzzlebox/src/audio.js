class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.currentMusic = null;
    this.musicTracks = new Map(); // Support multiple music tracks
    this.sounds = new Map();
    this.isInitialized = false;
    this.isMuted = false;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.5;
    this.masterVolume = 1.0;
    this.tempMusicVolumeReduction = 0.3; // Factor to reduce music volume during voice overs
    this.voiceOversEnabled = false; // Whether voice overs are enabled - disabled by default
    
    // Audio file paths
    this.audioFiles = {
      moonproject: '/audio/moonproject.mp3',
      moonprojecttrue: '/audio/moonprojecttrue.mp3',
      puzzle_solve: '/audio/puzzle_solve.mp3',
      button_click: '/audio/button_click.mp3',
      success_chime: '/audio/success_chime.mp3',
      maze_vo: '/audio/vo/maze.wav',
      start_vo: '/audio/vo/start.wav'
    };

    // Load saved settings from localStorage
    this.loadSettings();
  }

  // localStorage methods
  loadSettings() {
    try {
      // Clear any existing voice over settings to force disable
      const savedSettings = localStorage.getItem('puzzleBoxAudioSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.musicVolume = settings.musicVolume ?? 0.3;
        this.sfxVolume = settings.sfxVolume ?? 0.5;
        this.masterVolume = settings.masterVolume ?? 1.0;
        this.isMuted = settings.isMuted ?? false;
        // Force voice overs to be disabled regardless of saved setting
        this.voiceOversEnabled = false;
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
      
      // Set initial volumes from loaded settings
      this.musicGain.gain.value = this.musicVolume;
      this.sfxGain.gain.value = this.sfxVolume;
      this.masterGain.gain.value = this.masterVolume;
      
      // Apply mute state if saved
      if (this.isMuted) {
        this.masterGain.gain.value = 0;
      }
      
      // Preload all audio files
      await this.preloadAudio();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  }

  async preloadAudio() {
    const audioFiles = Object.entries(this.audioFiles);
    let loadedCount = 0;
    
    const loadPromises = audioFiles.map(async ([key, path]) => {
      try {
        const audioBuffer = await this.loadAudioFile(path);
        this.sounds.set(key, audioBuffer);
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
  }

  updateLoadingProgress(percentage, text) {
    const progressBar = document.getElementById('audio-loading-progress');
    const progressText = document.getElementById('audio-loading-text');
    const loadingContainer = document.getElementById('audio-loading-container');
    
    if (progressBar && progressText && loadingContainer) {
      progressBar.style.width = `${percentage}%`;
      progressText.textContent = `${Math.round(percentage)}% - ${text}`;
      
      if (percentage >= 100) {
        setTimeout(() => {
          loadingContainer.classList.add('fade-out');
          // Remove the element from DOM after fade completes
          setTimeout(() => {
            loadingContainer.style.display = 'none';
          }, 500);
        }, 1000);
      }
    }
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
    
    // Ensure audio context is running
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
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
    
    // Handle startTime option
    const startTime = options.startTime || 0;
    source.start(0, startTime);
    return source;
  }

  playMusic(musicName, options = {}) {
    if (!this.isInitialized || this.isMuted) {
      return null;
    }
    
    // Ensure audio context is running
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    const audioBuffer = this.sounds.get(musicName);
    if (!audioBuffer) {
      console.warn(`Music not found: ${musicName}`);
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
      // Handle looping with optional timeout
      if (options.loopTimeout) {
        // Don't use native loop, we'll handle it manually
        source.loop = false;
        
        // Set up manual looping with timeout
        const loopWithTimeout = () => {
          const newSource = this.audioContext.createBufferSource();
          const newGainNode = this.audioContext.createGain();
          
          newSource.buffer = audioBuffer;
          newSource.connect(newGainNode);
          newGainNode.connect(this.musicGain);
          
          // Apply same options
          if (options.volume !== undefined) {
            newGainNode.gain.value = options.volume * this.musicVolume;
          } else {
            newGainNode.gain.value = this.musicVolume;
          }
          
          // Start at the same offset for consistency
          const startTime = options.startTime || 0;
          newSource.start(0, startTime);
          
          // Update track reference
          const loopCurrentTime = this.audioContext.currentTime;
          this.musicTracks.set(musicName, { source: newSource, gainNode: newGainNode, name: musicName, startTime: loopCurrentTime, initialOffset: startTime });
          
          // Set up next loop
          newSource.onended = () => {
            setTimeout(() => {
              if (this.musicTracks.has(musicName)) {
                loopWithTimeout();
              }
            }, options.loopTimeout * 1000);
          };
        };
        
        // Set up the first loop
        source.onended = () => {
          setTimeout(() => {
            if (this.musicTracks.has(musicName)) {
              loopWithTimeout();
            }
          }, options.loopTimeout * 1000);
        };
      } else {
        source.loop = true; // Use native loop if no timeout specified
      }
    }
    
    if (options.fadeIn && options.fadeIn > 0) {
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        (options.volume || 1) * this.musicVolume,
        this.audioContext.currentTime + options.fadeIn
      );
    }
    
    const startTime = options.startTime || 0;
    const currentTime = this.audioContext.currentTime;
    
    // For looping music, stop 100ms before the end to avoid artifact
    if (options.loop !== false && options.loopTimeout) {
      const duration = audioBuffer.duration - 0.1; // Remove last 100ms
      source.start(currentTime, startTime, duration);
    } else {
      source.start(currentTime, startTime);
    }
    
    this.musicTracks.set(musicName, { source, gainNode, name: musicName, startTime: currentTime, initialOffset: startTime });
    
    // Keep currentMusic for backward compatibility
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

  fadeBetweenTracks(fromTrack, toTrack, fadeDuration = 5.0) {
    const fromTrackData = this.musicTracks.get(fromTrack);
    
    if (!fromTrackData) {
      console.warn(`From track not found for fade: ${fromTrack}`);
      return;
    }
    
    // Get the current playback time of the from track
    const currentTime = this.audioContext.currentTime;
    const fromTrackElapsed = currentTime - fromTrackData.startTime;
    // Account for the initial offset when calculating current position
    const initialOffset = fromTrackData.initialOffset || 0;
    const fromTrackCurrentTime = (fromTrackElapsed + initialOffset) % fromTrackData.source.buffer.duration;
    
    // Fade out the current from track
    fromTrackData.gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeDuration * 1.5);
    setTimeout(() => {
      fromTrackData.source.stop();
      this.musicTracks.delete(fromTrack);
    }, (fadeDuration + fadeDuration * 0.5) * 1000);
    
    // Start the new track at the same relative position
    const audioBuffer = this.sounds.get(toTrack);
    if (!audioBuffer) {
      console.warn(`To track not found for fade: ${toTrack}`);
      return;
    }
    
    const newSource = this.audioContext.createBufferSource();
    const newGainNode = this.audioContext.createGain();
    
    newSource.buffer = audioBuffer;
    newSource.connect(newGainNode);
    newGainNode.connect(this.musicGain);
    
    // Start with volume 0 and fade in
    newGainNode.gain.setValueAtTime(0, currentTime);
    newGainNode.gain.linearRampToValueAtTime(this.musicVolume, currentTime + fadeDuration);
    
    // Start the new track at the exact same time position in seconds
    const toTrackStartTime = Math.min(fromTrackCurrentTime, audioBuffer.duration - 0.1);
    newSource.start(currentTime, toTrackStartTime);
    

    
    // Don't loop the new track (it's the final track)
    newSource.loop = false;
    
    // Store the new track data
    this.musicTracks.set(toTrack, { 
      source: newSource, 
      gainNode: newGainNode, 
      name: toTrack,
      startTime: currentTime
    });
    
    // Update currentMusic for backward compatibility
    this.currentMusic = { source: newSource, gainNode: newGainNode, name: toTrack };
    

  }


  getTrackStatus() {
    const status = {};
    this.musicTracks.forEach((track, name) => {
      status[name] = {
        volume: track.gainNode.gain.value,
        playing: true // Assuming if it's in the map, it's playing
      };
    });
    return status;
  }

  pauseMusic() {
    if (this.currentMusic) {
      this.currentMusic.source.stop();
    }
    // Pause all music tracks
    this.musicTracks.forEach(track => {
      track.source.stop();
    });
  }

  resumeMusic() {
    if (this.currentMusic && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    // Resume audio context for all tracks
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }
    this.saveSettings();
  }

  // Set music volume temporarily without saving to localStorage
  setMusicVolumeTemporary(volume) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain) {
      this.musicGain.gain.value = clampedVolume;
    }
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
    this.saveSettings();
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
    this.saveSettings();
  }

  mute() {
    this.isMuted = true;
    if (this.masterGain) {
      this.masterGain.gain.value = 0;
    }
    this.saveSettings();
  }

  unmute() {
    this.isMuted = false;
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
    this.saveSettings();
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
    if (!this.isInitialized || this.isMuted) return null;
    
    // Ensure audio context is running
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    return this.playSound('button_click', { volume: 0.2 });
  }

  playPuzzleSolve() {
    return this.playSound('puzzle_solve', { volume: 1, startTime: 0.8 });
  }

  playSuccessChime() {
    return this.playSound('success_chime', { volume: 0.9 });
  }

  playMazeVO() {
    if (!this.voiceOversEnabled) return null;
    return this.playSound('maze_vo', { volume: 0.8 });
  }

  playStartVO() {
    if (!this.voiceOversEnabled) return null;
    return this.playSound('start_vo', { volume: 0.8 });
  }

  // Get the temporary music volume reduction factor
  getTempMusicVolumeReduction() {
    return this.tempMusicVolumeReduction;
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

  // Resume audio context when user interacts (required by browsers)
  async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Cleanup
  dispose() {
    if (this.currentMusic) {
      this.currentMusic.source.stop();
    }
    // Stop all music tracks
    this.musicTracks.forEach(track => {
      track.source.stop();
    });
    this.musicTracks.clear();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.sounds.clear();
    this.isInitialized = false;
  }
}

// Create global audio manager instance
const audioManager = new AudioManager();

// Make audioManager globally accessible
window.audioManager = audioManager;

// Global function to ensure audio context is resumed
window.resumeAudioContext = async () => {
  if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
    await audioManager.audioContext.resume();
  }
};

export { AudioManager, audioManager };
