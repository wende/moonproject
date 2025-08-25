import { audioManager } from './audio_html5.js';

// Audio controls constants
const VOLUME_SLIDER_MAX = 100;
const VOLUME_CONVERSION_FACTOR = 100; // Convert percentage to decimal

class AudioControls {
  constructor() {
    this.container = null;
    this.isVisible = false;
    this.createControls();
  }

  createControls() {
    // Create audio controls container
    this.container = document.createElement('div');
    this.container.className = 'audio-controls';
    this.container.innerHTML = `
      <div class="audio-controls-header">
        <h3>Audio Settings</h3>
        <button class="audio-close-btn" aria-label="Close audio controls">×</button>
      </div>
      <div class="audio-controls-content">
        <div class="audio-control-group">
          <label for="master-volume">Master Volume</label>
          <div class="volume-control-wrapper">
            <input type="range" id="master-volume" min="0" max="${VOLUME_SLIDER_MAX}" value="0" class="volume-slider" aria-label="Master volume control">
            <div class="volume-indicator">
              <div class="volume-bar" id="master-volume-bar"></div>
            </div>
          </div>
          <span class="volume-value">0%</span>
        </div>
        
        <div class="audio-control-group">
          <label for="music-volume">Music Volume</label>
          <div class="volume-control-wrapper">
            <input type="range" id="music-volume" min="0" max="${VOLUME_SLIDER_MAX}" value="0" class="volume-slider" aria-label="Music volume control">
            <div class="volume-indicator">
              <div class="volume-bar" id="music-volume-bar"></div>
            </div>
          </div>
          <span class="volume-value">0%</span>
        </div>
        
        <div class="audio-control-group">
          <label for="sfx-volume">Sound Effects Volume</label>
          <div class="volume-control-wrapper">
            <input type="range" id="sfx-volume" min="0" max="${VOLUME_SLIDER_MAX}" value="0" class="volume-slider" aria-label="Sound effects volume control">
            <div class="volume-indicator">
              <div class="volume-bar" id="sfx-volume-bar"></div>
            </div>
          </div>
          <span class="volume-value">0%</span>
        </div>
        
        <div class="audio-control-group">
          <label for="voice-over-volume">Voice Over Volume</label>
          <div class="volume-control-wrapper">
            <input type="range" id="voice-over-volume" min="0" max="${VOLUME_SLIDER_MAX}" value="0" class="volume-slider" aria-label="Voice over volume control">
            <div class="volume-indicator">
              <div class="volume-bar" id="voice-over-volume-bar"></div>
            </div>
          </div>
          <span class="volume-value">0%</span>
        </div>
        
        <div class="audio-control-buttons">
          <button class="btn mute-btn" id="mute-btn" aria-label="Mute all audio">
            <span class="mute-icon">🔊</span>
            <span class="mute-text">Mute</span>
          </button>
        </div>
      </div>
    `;

    // Add to page
    document.body.appendChild(this.container);

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close button
    const closeBtn = this.container.querySelector('.audio-close-btn');
    closeBtn.addEventListener('click', () => this.hide());

    // Volume sliders
    const masterSlider = this.container.querySelector('#master-volume');
    const musicSlider = this.container.querySelector('#music-volume');
    const sfxSlider = this.container.querySelector('#sfx-volume');
    const voiceOverSlider = this.container.querySelector('#voice-over-volume');

    masterSlider.addEventListener('input', (e) => {
      const volume = e.target.value / VOLUME_CONVERSION_FACTOR;
      audioManager.setMasterVolume(volume);
      this.updateVolumeDisplay(e.target);
      this.updateVolumeIndicator('master-volume-bar', e.target.value);
    });

    musicSlider.addEventListener('input', (e) => {
      const volume = e.target.value / VOLUME_CONVERSION_FACTOR;
      audioManager.setMusicVolume(volume);
      this.updateVolumeDisplay(e.target);
      this.updateVolumeIndicator('music-volume-bar', e.target.value);
    });

    sfxSlider.addEventListener('input', (e) => {
      const volume = e.target.value / VOLUME_CONVERSION_FACTOR;
      audioManager.setSFXVolume(volume);
      this.updateVolumeDisplay(e.target);
      this.updateVolumeIndicator('sfx-volume-bar', e.target.value);
    });

    voiceOverSlider.addEventListener('input', (e) => {
      const volume = e.target.value / VOLUME_CONVERSION_FACTOR;
      audioManager.setVoiceOverVolume(volume);
      this.updateVolumeDisplay(e.target);
      this.updateVolumeIndicator('voice-over-volume-bar', e.target.value);
    });

    // Voice overs toggle removed - voice overs are always enabled

    // Mute button
    const muteBtn = this.container.querySelector('#mute-btn');
    muteBtn.addEventListener('click', () => {
      const isMuted = audioManager.toggleMute();
      this.updateMuteButton(isMuted);
    });


    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isVisible && !this.container.contains(e.target) && !e.target.closest('.audio-toggle-btn')) {
        this.hide();
      }
    });

    // Initialize controls with current state
    this.updateMuteButton(audioManager.isMuted);
    
    // Initialize volume sliders with current audio manager state
    this.updateControls();
  }

  updateVolumeDisplay(slider) {
    const valueDisplay = slider.closest('.audio-control-group').querySelector('.volume-value');
    if (valueDisplay) {
      valueDisplay.textContent = `${slider.value}%`;
    } else {
      console.warn('Volume value display not found for slider:', slider.id);
    }
  }

  updateVolumeIndicator(barId, value) {
    const volumeBar = document.getElementById(barId);
    if (volumeBar) {
      volumeBar.style.width = `${value}%`;
    }
  }

  updateMuteButton(isMuted) {
    const muteBtn = this.container.querySelector('#mute-btn');
    const muteIcon = muteBtn.querySelector('.mute-icon');
    const muteText = muteBtn.querySelector('.mute-text');

    if (isMuted) {
      muteIcon.textContent = '🔇';
      muteText.textContent = 'Unmute';
    } else {
      muteIcon.textContent = '🔊';
      muteText.textContent = 'Mute';
    }
  }

  updateVoiceOversToggle(isEnabled) {
    const voiceOversToggle = this.container.querySelector('#voice-overs-toggle');
    const toggleIcon = voiceOversToggle.querySelector('.toggle-icon');
    const toggleText = voiceOversToggle.querySelector('.toggle-text');

    if (isEnabled) {
      toggleIcon.textContent = '🎤';
      toggleText.textContent = 'Enabled';
    } else {
      toggleIcon.textContent = '🔇';
      toggleText.textContent = 'Disabled';
    }
  }

  show() {
    this.container.style.display = 'block';
    this.isVisible = true;

    // Update controls with current audio manager state
    this.updateControls();
  }

  updateControls() {
    // Update volume sliders
    const masterSlider = this.container.querySelector('#master-volume');
    const musicSlider = this.container.querySelector('#music-volume');
    const sfxSlider = this.container.querySelector('#sfx-volume');
    const voiceOverSlider = this.container.querySelector('#voice-over-volume');

    masterSlider.value = Math.round(audioManager.masterVolume * VOLUME_CONVERSION_FACTOR);
    musicSlider.value = Math.round(audioManager.musicVolume * VOLUME_CONVERSION_FACTOR);
    sfxSlider.value = Math.round(audioManager.sfxVolume * VOLUME_CONVERSION_FACTOR);
    voiceOverSlider.value = Math.round(audioManager.voiceOverVolume * VOLUME_CONVERSION_FACTOR);

    // Update volume displays
    this.updateVolumeDisplay(masterSlider);
    this.updateVolumeDisplay(musicSlider);
    this.updateVolumeDisplay(sfxSlider);
    this.updateVolumeDisplay(voiceOverSlider);

    // Update volume indicators
    this.updateVolumeIndicator('master-volume-bar', masterSlider.value);
    this.updateVolumeIndicator('music-volume-bar', musicSlider.value);
    this.updateVolumeIndicator('sfx-volume-bar', sfxSlider.value);
    this.updateVolumeIndicator('voice-over-volume-bar', voiceOverSlider.value);

    // Update mute button state
    this.updateMuteButton(audioManager.isMuted);

    // Voice overs are always enabled - no toggle needed
  }

  hide() {
    this.container.style.display = 'none';
    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// Create global audio controls instance
const audioControls = new AudioControls();

// Create audio toggle button for the main UI
function createAudioToggleButton() {
  const audioToggleBtn = document.createElement('button');
  audioToggleBtn.className = 'btn audio-toggle-btn';
  audioToggleBtn.innerHTML = 'Audio';
  audioToggleBtn.setAttribute('aria-label', 'Audio Settings');
  audioToggleBtn.title = 'Audio Settings';

  audioToggleBtn.addEventListener('click', () => {
    audioControls.toggle();
  });

  // Add to navigation at the end (rightmost position)
  const navButtons = document.querySelector('.nav-buttons');
  if (navButtons) {
    navButtons.appendChild(audioToggleBtn);
  }

  return audioToggleBtn;
}

export { AudioControls, audioControls, createAudioToggleButton };
