export class ScaleAnimator {
  constructor(scene) {
    this.scene = scene;
    this.bones = {
      left: scene.getObjectByName('Bone_L'),
      right: scene.getObjectByName('Bone_R')
    };
    this.animation = {
      active: false,
      startTime: 0,
      duration: .75, // seconds
      from: { left: 0, right: 0 },
      to: { left: 0, right: 0 }
    };
  }

  transition(fromState, toState) {
    this.animation.active = true;
    this.animation.startTime = performance.now();

    const mapToUnitRange = (value) => {
      return -1*(((value - 3) / 30) * 2 - 1); // 3 -> -1, 19 -> 1
    };

    const oldPositionLeft = mapToUnitRange(fromState[0]);
    const oldPositionRight = mapToUnitRange(fromState[1]);
    const positionLeft = mapToUnitRange(toState[0]);
    const positionRight = mapToUnitRange(toState[1]);

    // set initial positions based on current state
    this.animation.from = {left: oldPositionLeft, right: oldPositionRight};
    this.animation.to = {left: positionLeft, right: positionRight};

    // initialize bone positions
    this.bones.left.position.x = this.animation.from.left;
    this.bones.right.position.x = this.animation.from.right;

    this.update();
  }

  update() {
    if (!this.animation.active) return;

    const elapsed = (performance.now() - this.animation.startTime) / 1000;
    const progress = Math.min(elapsed / this.animation.duration, 1);

    // Interpolate positions
    this.bones.left.position.x =
      this.animation.from.left +
        (this.animation.to.left - this.animation.from.left) * progress;

    this.bones.right.position.x =
      this.animation.from.right +
        (this.animation.to.right - this.animation.from.right) * progress;

    // continue animation or stop
    if (progress < 1) {
      requestAnimationFrame(() => this.update());
    } else {
      this.animation.active = false;
    }
  }
}
