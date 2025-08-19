import { audioManager } from './audio.js';

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
          <input type="range" id="master-volume" min="0" max="100" value="100" class="volume-slider">
          <span class="volume-value">100%</span>
        </div>
        
        <div class="audio-control-group">
          <label for="music-volume">Music Volume</label>
          <input type="range" id="music-volume" min="0" max="100" value="30" class="volume-slider">
          <span class="volume-value">30%</span>
        </div>
        
        <div class="audio-control-group">
          <label for="sfx-volume">Sound Effects Volume</label>
          <input type="range" id="sfx-volume" min="0" max="100" value="50" class="volume-slider">
          <span class="volume-value">50%</span>
        </div>
        
        <div class="audio-control-buttons">
          <button class="btn mute-btn" id="mute-btn">
            <span class="mute-icon">Audio</span>
            <span class="mute-text">Mute</span>
          </button>
          <button class="btn test-sound-btn" id="test-sound-btn">Test Sound</button>
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

    masterSlider.addEventListener('input', (e) => {
      const volume = e.target.value / 100;
      audioManager.setMasterVolume(volume);
      this.updateVolumeDisplay(e.target);
    });

    musicSlider.addEventListener('input', (e) => {
      const volume = e.target.value / 100;
      audioManager.setMusicVolume(volume);
      this.updateVolumeDisplay(e.target);
    });

    sfxSlider.addEventListener('input', (e) => {
      const volume = e.target.value / 100;
      audioManager.setSFXVolume(volume);
      this.updateVolumeDisplay(e.target);
    });

    // Mute button
    const muteBtn = this.container.querySelector('#mute-btn');
    muteBtn.addEventListener('click', () => {
      const isMuted = audioManager.toggleMute();
      this.updateMuteButton(isMuted);
    });

    // Test sound button
    const testBtn = this.container.querySelector('#test-sound-btn');
    testBtn.addEventListener('click', () => {
      audioManager.playButtonClick();
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
  }

  updateVolumeDisplay(slider) {
    const valueDisplay = slider.parentNode.querySelector('.volume-value');
    valueDisplay.textContent = `${slider.value}%`;
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

  show() {
    console.log('Showing audio controls...');
    this.container.style.display = 'block';
    this.isVisible = true;
    
    // Update mute button state
    this.updateMuteButton(audioManager.isMuted);
    console.log('Audio controls shown');
  }

  hide() {
    console.log('Hiding audio controls...');
    this.container.style.display = 'none';
    this.isVisible = false;
    console.log('Audio controls hidden');
  }

  toggle() {
    console.log('Toggling audio controls, current state:', this.isVisible);
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
  console.log('Creating audio toggle button...');
  
  const audioToggleBtn = document.createElement('button');
  audioToggleBtn.className = 'btn audio-toggle-btn';
  audioToggleBtn.innerHTML = 'Audio';
  audioToggleBtn.setAttribute('aria-label', 'Audio Settings');
  audioToggleBtn.title = 'Audio Settings';
  
  audioToggleBtn.addEventListener('click', () => {
    console.log('Audio toggle button clicked');
    audioControls.toggle();
  });

  // Add to navigation
  const navButtons = document.querySelector('.nav-buttons');
  console.log('Looking for nav-buttons element:', navButtons);
  
  if (navButtons) {
    navButtons.appendChild(audioToggleBtn);
    console.log('Audio toggle button added to nav-buttons');
  } else {
    console.warn('nav-buttons element not found, audio toggle button not added');
  }

  return audioToggleBtn;
}

export { AudioControls, audioControls, createAudioToggleButton };
