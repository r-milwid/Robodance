// ── Robot Dance – standalone choreography ────────────────────
// Extracted from test-analytics-prototype/admin-assistant.js
// Stripped of onboarding/FAB dependencies for standalone playback.

function createRobotElement() {
  const robot = document.createElement('div');
  robot.className = 'robot-runner';
  robot.innerHTML = `<div class="robot-runner-scale">
    <div class="robot-runner-inner">
      <div class="robot-antenna"></div>
      <div class="robot-head">
        <div class="robot-hat" aria-hidden="true"></div>
        <div class="robot-eye robot-eye-left"></div>
        <div class="robot-eye robot-eye-right"></div>
      </div>
      <div class="robot-body"></div>
      <div class="robot-arm robot-arm-left"></div>
      <div class="robot-arm robot-arm-right"></div>
      <div class="robot-leg robot-leg-left"></div>
      <div class="robot-leg robot-leg-right"></div>
    </div>
  </div>
  <div class="robot-speech-bubble" aria-hidden="true"></div>`;
  return robot;
}

function createRobotTransitionScene() {
  const scene = document.createElement('div');
  scene.className = 'robot-transition-scene';
  return scene;
}

function positionRobotTransitionScene(scene) {
  if (!scene) return;
  scene.style.left = '0';
  scene.style.right = '0';
  scene.style.width = '';   // let left+right define width (works correctly in iframes)
  scene.style.height = '100%';
}

function setRobotSpeech(robot, text = '', side = 'left') {
  if (!robot) return;
  const bubble = robot.querySelector('.robot-speech-bubble');
  if (!bubble) return;
  bubble.textContent = text;
  bubble.classList.toggle('visible', !!text);
  bubble.classList.toggle('right', side === 'right');
  bubble.setAttribute('aria-hidden', text ? 'false' : 'true');
}

function setRobotMotion(robot, motionClass) {
  if (!robot) return;
  const animatedParts = robot.querySelectorAll('.robot-runner-inner, .robot-head, .robot-body, .robot-arm, .robot-leg');

  // Force animation restart when we switch choreography states.
  animatedParts.forEach(part => {
    part.style.animation = 'none';
  });
  void robot.offsetWidth;

  robot.className = 'robot-runner';
  robot.removeAttribute('data-motion');

  if (motionClass) {
    robot.dataset.motion = motionClass;
    robot.classList.add(motionClass);
  }

  animatedParts.forEach(part => {
    part.style.animation = '';
  });
  void robot.offsetWidth;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const introCountdownSeconds = 10;
let introCountdownDone = false;
let introDimensionsReady = false;
let introShowStarted = false;

function getIntroOverlay() {
  return document.querySelector('.show-intro-overlay');
}

function getIntroCountdownElement() {
  return document.querySelector('[data-countdown]');
}

function hideIntroOverlay() {
  const overlay = getIntroOverlay();
  if (!overlay) return;

  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.display = 'none';
}

function startIntroShow() {
  if (introShowStarted) return;
  introShowStarted = true;

  hideIntroOverlay();
  audioTitleScreen.currentTime = 0;
  audioTitleScreen.play().catch(() => {});
  startDance();
}

function maybeStartIntroShow() {
  if (!introCountdownDone || !introDimensionsReady || introShowStarted) return;
  startIntroShow();
}

function startIntroCountdown() {
  const countdownElement = getIntroCountdownElement();
  let remaining = introCountdownSeconds;

  if (countdownElement) {
    countdownElement.textContent = String(remaining);
  }

  const timerId = window.setInterval(() => {
    remaining -= 1;

    if (countdownElement) {
      countdownElement.textContent = String(Math.max(remaining, 0));
    }

    if (remaining <= 0) {
      window.clearInterval(timerId);
      introCountdownDone = true;
      maybeStartIntroShow();
    }
  }, 1000);
}

// Play a sound effect, duck background music to 50%, restore on end
function playSfx(sfx, bg) {
  bg.volume = 0.5;
  sfx.currentTime = 0;
  sfx.play().catch(() => {});
  sfx.addEventListener('ended', () => { bg.volume = 1.0; }, { once: true });
}

// ── Main choreography ────────────────────────────────────────
async function startDance() {
  const robotWidth = 120;
  const robotHeight = 160;
  const robotBaselineLift = Math.round(robotHeight * 0.5);

  // ── Curtain opening ──────────────────────────────────────────
  // Curtains are in the HTML so they're visible immediately (no flash on load)
  const curtainLeft = document.querySelector('.curtain-left');
  const curtainRight = document.querySelector('.curtain-right');

  // Create and position the stage — visible from the start (behind curtains)
  const stageScene = createRobotTransitionScene();
  positionRobotTransitionScene(stageScene);
  stageScene.style.opacity = '1';
  stageScene.style.transform = 'translateY(0)';
  document.body.appendChild(stageScene);

  // Re-position stage on resize (e.g., host panel state change resizes iframe)
  const onResize = () => positionRobotTransitionScene(stageScene);
  window.addEventListener('resize', onResize);

  // Position robot near the bottom of the viewport, above the stage floor.
  const fullBottomGap = 24 + robotBaselineLift;
  const danceBaselineY = window.innerHeight - Math.round(fullBottomGap / 2) - robotHeight;
  const startX = window.innerWidth * 0.20;

  // Robot visible and stationary from the start (behind curtains)
  const robot = createRobotElement();
  robot.style.left = startX + 'px';
  robot.style.top = danceBaselineY + 'px';
  robot.style.opacity = '1';
  robot.style.transform = 'translateX(-50%)';
  document.body.appendChild(robot);

  // Show "Sound on!" speech bubble during curtain open
  setRobotSpeech(robot, 'Sound on!', 'right');

  // Force layout
  void curtainLeft.offsetWidth;

  // Shrink curtains from 50vw to 20px over 6 seconds
  const curtainOpenDuration = 6000;
  const curtainFadeDuration = 400;
  curtainLeft.style.transition = `width ${curtainOpenDuration}ms ease-in-out`;
  curtainRight.style.transition = `width ${curtainOpenDuration}ms ease-in-out`;
  curtainLeft.style.width = '20px';
  curtainRight.style.width = '20px';

  // Switch to Michael 500ms before curtains finish opening
  await wait(curtainOpenDuration - 500);
  audioTitleScreen.pause();
  audioTitleScreen.currentTime = 0;
  audioMichael.play().catch(() => {});
  await wait(500);

  // Wait for Michael to finish, then start Beat It
  await wait(1200);
  audioBeatIt.play().catch(() => {});

  // Quickly fade out the remaining 20px slivers (non-blocking — dance starts now)
  curtainLeft.style.transition = `opacity ${curtainFadeDuration}ms ease-out`;
  curtainRight.style.transition = `opacity ${curtainFadeDuration}ms ease-out`;
  curtainLeft.style.opacity = '0';
  curtainRight.style.opacity = '0';
  wait(curtainFadeDuration).then(() => {
    curtainLeft.remove();
    curtainRight.remove();
  });

  // ── Phase 2: Cross-screen dance ──────────────────────────
  // Shift target right by same offset; clamp so climb stays ≥5% from right edge
  const desiredTargetX = window.innerWidth * 0.90;
  const maxTargetX = window.innerWidth * 0.95;
  const targetX = Math.min(desiredTargetX, maxTargetX);
  const danceStartX = startX;
  const dx = targetX - danceStartX;
  const distance = Math.abs(dx);
  const travelDuration = Math.max(3800, Math.min(6400, distance * 7.2));
  const walkIntroDuration = Math.round(travelDuration * 0.595);
  const slideToFloorDuration = Math.round(travelDuration * 0.25);
  const headspinDuration = 1500;
  const floorMoveDuration = Math.round(travelDuration * 0.25);
  const freestyleDuration = Math.round(travelDuration * 0.25);

  const moveRobotTo = (progress, duration) => {
    const nextX = danceStartX + dx * progress;
    robot.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
    robot.style.left = nextX + 'px';
    robot.style.top = danceBaselineY + 'px';
    return wait(duration);
  };

  // Walking (moonwalk)
  setRobotSpeech(robot, '');
  setRobotMotion(robot, 'walking');
  await Promise.all([
    moveRobotTo(0.25, walkIntroDuration),
    wait(walkIntroDuration),
  ]);

  // Head spin (play Oh)
  playSfx(audioOh, audioBeatIt);
  setRobotMotion(robot, 'headspinning');
  await wait(headspinDuration);

  // Cartwheel (play Hoo)
  playSfx(audioHoo, audioBeatIt);
  setRobotMotion(robot, 'cartwheeling');
  await Promise.all([
    moveRobotTo(0.5, slideToFloorDuration),
    wait(slideToFloorDuration),
  ]);

  // Floor move (play Uuuuh timed to finish with the move — ~1344ms duration)
  const uuuuhDuration = 1344;
  const uuuuhDelay = Math.max(0, floorMoveDuration - uuuuhDuration);
  setTimeout(() => playSfx(audioUuuuh, audioBeatIt), uuuuhDelay);
  setRobotMotion(robot, 'floormove');
  await Promise.all([
    moveRobotTo(0.75, floorMoveDuration),
    wait(floorMoveDuration),
  ]);

  // Freestyle to destination
  setRobotMotion(robot, 'freestyling');
  await Promise.all([
    moveRobotTo(1, freestyleDuration),
    wait(freestyleDuration),
  ]);

  // ── Phase 3: Climb, slip, fall, recover ──────────────────
  const climbTimeScale = 1.25;
  const climbPeakY = Math.max(24, danceBaselineY - (window.innerHeight * 0.25));

  const moveRobotTopTo = (nextTop, duration, easing = 'linear') => {
    robot.style.transition = `top ${duration}ms ${easing}`;
    robot.style.top = nextTop + 'px';
    return wait(duration);
  };

  const climbBursts = [
    { progress: 0.20, duration: Math.round(300 * climbTimeScale), easing: 'cubic-bezier(0.18, 0.94, 0.28, 1)' },
    { progress: 0.15, duration: Math.round(140 * climbTimeScale), easing: 'cubic-bezier(0.22, 0.18, 0.36, 1)' },
    { progress: 0.42, duration: Math.round(460 * climbTimeScale), easing: 'cubic-bezier(0.16, 0.96, 0.24, 1)' },
    { progress: 0.36, duration: Math.round(150 * climbTimeScale), easing: 'cubic-bezier(0.22, 0.18, 0.36, 1)' },
    { progress: 0.61, duration: Math.round(330 * climbTimeScale), easing: 'cubic-bezier(0.18, 0.92, 0.24, 1)' },
    { progress: 0.55, duration: Math.round(135 * climbTimeScale), easing: 'cubic-bezier(0.22, 0.18, 0.36, 1)' },
    { progress: 0.80, duration: Math.round(535 * climbTimeScale), easing: 'cubic-bezier(0.16, 0.98, 0.22, 1)' },
  ];

  setRobotSpeech(robot, '');
  setRobotMotion(robot, 'climbing');
  for (const burst of climbBursts) {
    const nextTop = danceBaselineY + ((climbPeakY - danceBaselineY) * burst.progress);
    await moveRobotTopTo(nextTop, burst.duration, burst.easing);
  }

  // Fall (play Sha)
  const fallDuration = 950;
  playSfx(audioSha, audioBeatIt);
  setRobotMotion(robot, 'fallen');
  await moveRobotTopTo(danceBaselineY, fallDuration, 'cubic-bezier(0.22, 0.78, 0.18, 1.08)');

  // Stand up slowly (play Aaow)
  playSfx(audioAaow, audioBeatIt);
  const standDuration = 1700;
  setRobotMotion(robot, 'standingupslow');
  await wait(standDuration);

  // Speech bubble
  const speechDuration = 2000;
  setRobotSpeech(robot, 'Ow! Hee-hee\u2026\nstill smooth.');
  await wait(speechDuration);
  setRobotSpeech(robot, '');

  // ── Phase 4: Finale ──────────────────────────────────────
  const finaleDanceDuration = 2000;
  setRobotMotion(robot, 'freestyling');
  await wait(finaleDanceDuration);

  // Second speech bubble — encourage questions
  const secondSpeechDuration = 2500;
  setRobotMotion(robot, null);
  setRobotSpeech(robot, 'Ask questions in\nthe chat to the right');
  await wait(secondSpeechDuration);
  setRobotSpeech(robot, '');

  setRobotMotion(robot, 'waving');
  await wait(500); // Stop Beat It 1s early (was 1500ms)
  audioBeatIt.pause();
  audioBeatIt.currentTime = 0;
  audioWhosBad.currentTime = 0;
  audioWhosBad.play().catch(() => {});
  await wait(1700); // Let Who's Bad finish (~1.7s)

  // ── Outro: Curtains close ────────────────────────────────
  setRobotMotion(robot, null);
  setRobotSpeech(robot, '');

  const closeCurtainLeft = document.createElement('div');
  closeCurtainLeft.className = 'curtain curtain-left';
  closeCurtainLeft.style.width = '20px';
  const closeCurtainRight = document.createElement('div');
  closeCurtainRight.className = 'curtain curtain-right';
  closeCurtainRight.style.width = '20px';
  document.body.appendChild(closeCurtainLeft);
  document.body.appendChild(closeCurtainRight);

  // Force layout
  void closeCurtainLeft.offsetWidth;

  // Grow curtains from 20px back to 50vw over 6 seconds
  const curtainCloseDuration = 6000;
  closeCurtainLeft.style.transition = `width ${curtainCloseDuration}ms ease-in-out`;
  closeCurtainRight.style.transition = `width ${curtainCloseDuration}ms ease-in-out`;
  closeCurtainLeft.style.width = '50%';
  closeCurtainRight.style.width = '50%';

  await wait(curtainCloseDuration);

  // Cleanup (everything is hidden behind curtains now)
  window.removeEventListener('resize', onResize);
  stageScene.remove();
  robot.remove();
}

// ── Music ────────────────────────────────────────────────────
function createAudio(src) {
  const audio = new Audio(src);
  audio.loop = true;
  return audio;
}

const audioTitleScreen = createAudio('assets/Title Screen.mp3');
const audioMichael = createAudio('assets/Michael.mp3');
audioMichael.loop = false;
const audioBeatIt = createAudio('assets/Beat It.mp3');
const audioOh = createAudio('assets/Oh.mp3');
audioOh.loop = false;
const audioHoo = createAudio('assets/Hoo.mp3');
audioHoo.loop = false;
const audioUuuuh = createAudio('assets/Uuuuh.mp3');
audioUuuuh.loop = false;
const audioSha = createAudio('assets/Sha.mp3');
audioSha.loop = false;
const audioAaow = createAudio('assets/Aaow.mp3');
audioAaow.loop = false;
const audioWhosBad = createAudio("assets/Who's Bad.mp3");
audioWhosBad.loop = false;

// Wait for the viewport to have stable dimensions (handles iframe loading/transitions)
function waitForStableDimensions(callback, maxWait = 3000) {
  let lastWidth = 0, stableCount = 0;
  const start = Date.now();
  (function check() {
    const w = window.innerWidth;
    stableCount = (w > 0 && w === lastWidth) ? stableCount + 1 : 0;
    lastWidth = w;
    if (stableCount >= 3 || Date.now() - start > maxWait) callback();
    else requestAnimationFrame(check);
  })();
}

window.addEventListener('DOMContentLoaded', () => {
  startIntroCountdown();
  waitForStableDimensions(() => {
    introDimensionsReady = true;
    maybeStartIntroShow();
  });
});
