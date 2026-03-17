// ── Robot Dance – standalone choreography ────────────────────
// Extracted from trengo-analytics-prototype/admin-assistant.js
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
  const width = window.innerWidth;
  const height = window.innerHeight;
  scene.style.left = '0px';
  scene.style.right = '0px';
  scene.style.width = width + 'px';
  scene.style.height = height + 'px';
}

function setRobotSpeech(robot, text = '') {
  if (!robot) return;
  const bubble = robot.querySelector('.robot-speech-bubble');
  if (!bubble) return;
  bubble.textContent = text;
  bubble.classList.toggle('visible', !!text);
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

// ── Main choreography ────────────────────────────────────────
async function startDance() {
  const introEasing = 'cubic-bezier(0.2, 0.82, 0.18, 1)';
  const introFadeDuration = 1800;
  const robotWidth = 60;
  const robotHeight = 80;
  const robotBaselineLift = Math.round(robotHeight * 0.5);

  // Create and position the stage
  const stageScene = createRobotTransitionScene();
  positionRobotTransitionScene(stageScene);
  stageScene.style.opacity = '0';
  stageScene.style.transform = 'translateY(18px)';
  document.body.appendChild(stageScene);

  // Position robot near the bottom of the viewport, above the stage floor.
  const danceBaselineY = window.innerHeight - 24 - robotHeight - robotBaselineLift;
  const startX = window.innerWidth * 0.15;

  const robot = createRobotElement();
  robot.style.left = startX + 'px';
  robot.style.top = danceBaselineY + 'px';
  robot.style.opacity = '0';
  robot.style.transform = 'translateX(-50%) translateY(20px)';
  document.body.appendChild(robot);

  // Force layout
  void stageScene.offsetWidth;
  void robot.offsetWidth;

  // Fade in stage + robot
  stageScene.style.transition = `opacity ${introFadeDuration}ms ${introEasing}, transform ${introFadeDuration}ms ${introEasing}`;
  stageScene.style.opacity = '1';
  stageScene.style.transform = 'translateY(0)';
  robot.style.transition = `opacity ${introFadeDuration}ms ${introEasing}, transform ${introFadeDuration}ms ${introEasing}`;
  robot.style.opacity = '1';
  robot.style.transform = 'translateX(-50%) translateY(0)';
  await wait(introFadeDuration);

  // ── Phase 2: Cross-screen dance ──────────────────────────
  const targetX = window.innerWidth * 0.85;
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
  setRobotMotion(robot, 'walking');
  await Promise.all([
    moveRobotTo(0.25, walkIntroDuration),
    wait(walkIntroDuration),
  ]);

  // Head spin
  setRobotMotion(robot, 'headspinning');
  await wait(headspinDuration);

  // Cartwheel
  setRobotMotion(robot, 'cartwheeling');
  await Promise.all([
    moveRobotTo(0.5, slideToFloorDuration),
    wait(slideToFloorDuration),
  ]);

  // Floor move
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

  // Fall
  const fallDuration = 950;
  setRobotMotion(robot, 'fallen');
  await moveRobotTopTo(danceBaselineY, fallDuration, 'cubic-bezier(0.22, 0.78, 0.18, 1.08)');

  // Stand up slowly
  const standDuration = 1700;
  setRobotMotion(robot, 'standingupslow');
  await wait(standDuration);

  // Speech bubble
  const speechDuration = 2000;
  setRobotSpeech(robot, 'Ow! Hee-hee\u2026\nstill smooth.');
  await wait(speechDuration);
  setRobotSpeech(robot, '');

  // ── Phase 4: Finale ──────────────────────────────────────
  const finaleDanceDuration = 1200;
  setRobotMotion(robot, 'freestyling');
  await wait(finaleDanceDuration);

  setRobotMotion(robot, 'waving');
  await wait(1500); // 3 waves at 0.5s each

  // ── Outro: Fade out ──────────────────────────────────────
  const outroDuration = 1200;
  setRobotMotion(robot, null);
  setRobotSpeech(robot, '');

  stageScene.style.transition = `opacity ${outroDuration}ms ease-in, transform ${outroDuration}ms ease-in`;
  stageScene.style.opacity = '0';
  stageScene.style.transform = 'translateY(18px)';

  robot.style.transition = `opacity ${outroDuration}ms ease-in, transform ${outroDuration}ms ease-in`;
  robot.style.opacity = '0';
  robot.style.transform = 'translateX(-50%) scale(0.5) translateY(10px)';

  await wait(outroDuration);

  // Cleanup
  stageScene.remove();
  robot.remove();
}

// Auto-start after a short delay to let the page render
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(startDance, 600);
});
