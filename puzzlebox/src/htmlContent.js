import { t } from './i18n.js';

// Helper function to get current time values
function getCurrentTimeValues() {
  const startDate = new Date('2020-01-19T00:00:00');
  const now = new Date();
  const timeDiff = now - startDate;
  
  const totalSeconds = Math.floor(timeDiff / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  const totalYears = Math.floor(totalDays / 365.25);
  
  const remainingDays = totalDays - Math.floor(totalYears * 365.25);
  const remainingHours = totalHours - (totalDays * 24);
  const remainingMinutes = totalMinutes - (totalHours * 60);
  const remainingSeconds = totalSeconds - (totalMinutes * 60);
  
  return { 
    years: totalYears, 
    days: remainingDays, 
    hours: remainingHours, 
    minutes: remainingMinutes, 
    seconds: remainingSeconds 
  };
}

// Function to update HTML content with translations
export function updateHTMLContent() {
  // Update page title
  document.title = t('pageTitle');

  // Update meta tags
  const metaTitle = document.querySelector('meta[name="title"]');
  if (metaTitle) metaTitle.setAttribute('content', t('pageTitle'));

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', t('pageTitle'));

  const twitterTitle = document.querySelector('meta[property="twitter:title"]');
  if (twitterTitle) twitterTitle.setAttribute('content', t('pageTitle'));

  // Update navigation buttons
  const introButton = document.querySelector('.intro-button');
  if (introButton) introButton.textContent = t('openIntro');

  const outroButton = document.querySelector('.outro-button');
  if (outroButton) outroButton.textContent = t('lookInside');

  // Update intro modal
  const siteTitle = document.querySelector('.site-title');
  if (siteTitle) siteTitle.textContent = t('siteTitle');

  const continueButton = document.querySelector('.continue-button.intro-close');
  if (continueButton) continueButton.textContent = t('continue');

  // Update outro modal
  const congratulationsText = document.querySelector('.congratulations-text');
  if (congratulationsText) congratulationsText.textContent = t('congratulations');

  const helloMoon = document.querySelector('#outro p:first-of-type');
  if (helloMoon) helloMoon.textContent = t('helloMoon');

  const outroText1 = document.querySelector('#outro p:nth-of-type(2)');
  if (outroText1) {
    outroText1.innerHTML = t('outroText1') + '<br>' +
      'the answer was to ask within all along.<br>' +
      'Congratulations on completing the puzzle.<br>' +
      'I leave you with a short stanza that I hope you\'ll resonate with:';
  }

  const outroText2 = document.querySelector('#outro i p');
  if (outroText2) {
    outroText2.innerHTML = t('outroText2') + '<br>' +
      'Sometimes she hides<br>' +
      'But she always has<br>' +
      'a grip on the sea<br>' +
      'And so does on me';
  }

  const outroText3 = document.querySelector('#outro p:nth-of-type(4)');
  if (outroText3) outroText3.textContent = t('outroText3');

  const postscript = document.querySelector('#outro .postscript');
  if (postscript) postscript.textContent = t('postscript');

  // Initialize time counter text
  const timeCounter = document.querySelector('#outro .time-counter');
  if (timeCounter) {
    const { years, days, hours, minutes, seconds } = getCurrentTimeValues();
    const text = t('timeCounterText')
      .replace('{years}', years.toLocaleString())
      .replace('{days}', days.toLocaleString())
      .replace('{hours}', hours.toLocaleString())
      .replace('{minutes}', minutes.toLocaleString())
      .replace('{seconds}', seconds.toLocaleString());
    timeCounter.innerHTML = text;
  }

  const creditsButton = document.querySelector('.end-button');
  if (creditsButton) creditsButton.textContent = t('creditsButton');

  // Update credits modal
  const creditsTitle = document.querySelector('.credits-title');
  if (creditsTitle) creditsTitle.textContent = t('credits');

  const gameDesign = document.querySelector('#credits h3:first-of-type');
  if (gameDesign) gameDesign.textContent = t('gameDesignDevelopment');

  const developer = document.querySelector('#credits p:first-of-type');
  if (developer) developer.textContent = t('developer');

  const boxModel = document.querySelector('#credits h3:nth-of-type(2)');
  if (boxModel) boxModel.textContent = t('boxModel');

  const boxModelCreator = document.querySelector('#credits p:nth-of-type(2)');
  if (boxModelCreator) boxModelCreator.textContent = t('boxModelCreator');

  const i18nHelper = document.querySelector('#credits h3:nth-of-type(3)');
  if (i18nHelper) i18nHelper.textContent = t('languageInternationalization');

  const i18nHelperText = document.querySelector('#credits p:nth-of-type(3)');
  if (i18nHelperText) i18nHelperText.textContent = t('i18nHelper');

  const technicalCredits = document.querySelector('#credits h3:nth-of-type(4)');
  if (technicalCredits) technicalCredits.textContent = t('technicalCredits');

  const technicalStack = document.querySelector('#credits h3:nth-of-type(4) + p');
  if (technicalStack) technicalStack.textContent = t('technicalStack');

  const audio = document.querySelector('#credits h3:nth-of-type(5)');
  if (audio) audio.textContent = t('audio');

  const audioTrack = document.querySelector('#credits h3:nth-of-type(5) + p');
  if (audioTrack) audioTrack.textContent = t('audioTrack');

  const dedication = document.querySelector('#credits h3:nth-of-type(6)');
  if (dedication) dedication.textContent = t('dedication');

  const dedicationText = document.querySelector('#credits h3:nth-of-type(6) + p');
  if (dedicationText) dedicationText.textContent = t('dedicationText');


  // Update loading text
  const loadingText = document.querySelector('#audio-loading-container p');
  if (loadingText) loadingText.textContent = t('loading');
}
