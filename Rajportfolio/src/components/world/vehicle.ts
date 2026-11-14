import { clamp } from "./noise";

export const VEHICLE = {
  wheelBase: 2.7,
  wheelRadius: 0.34,
  maxSpeed: 24,
  offRoadMaxSpeed: 11,
  maxReverseSpeed: 7,
  acceleration: 7.5,
  reverseAcceleration: 4.5,
  brakeDeceleration: 16,
  handbrakeDeceleration: 20,
  rollingResistance: 1.2,
  airDrag: 0.011,
  maxSteer: 0.6,
  highSpeedSteer: 0.16,
  steerRate: 2.4,
  steerReturnRate: 3.4,
};

export interface VehicleState {
  x: number;
  z: number;
  /** Yaw in radians; forward is (sin(heading), cos(heading)) on the X/Z plane. */
  heading: number;
  speed: number;
  /** Front-wheel angle in radians; positive values steer left. */
  steer: number;
  wheelSpin: number;
  bodyRoll: number;
  bodyPitch: number;
  braking: boolean;
  reversing: boolean;
}

export interface VehicleInput {
  throttle: boolean;
  reverse: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
}

/** Simulated four-speed gearbox: engine speed rises through each gear, then drops on upshift. */
export function engineRpm(speed: number, throttle: boolean) {
  const absolute = Math.abs(speed);
  const gear = Math.min(3, Math.floor(absolute / 6.5));
  const withinGear = clamp((absolute - gear * 6.5) / 6.5, 0, 1);
  return clamp(0.14 + withinGear * 0.66 + (throttle ? 0.1 : 0), 0, 1);
}

export const createVehicleState = (x: number, z: number, heading: number): VehicleState => ({
  x,
  z,
  heading,
  speed: 0,
  steer: 0,
  wheelSpin: 0,
  bodyRoll: 0,
  bodyPitch: 0,
  braking: false,
  reversing: false,
});

/**
 * Kinematic bicycle model: the body only rotates as a consequence of rolling
 * forward or backward on steered front wheels, never in place.
 */
export function stepVehicle(state: VehicleState, input: VehicleInput, dt: number, onRoad = true) {
  const step = Math.min(dt, 0.05);
  // Zero-length frames (such as the first one) would otherwise divide by zero and poison the body pose with NaN.
  if (!(step > 0)) return state;
  const speedLimit = onRoad ? VEHICLE.maxSpeed : VEHICLE.offRoadMaxSpeed;
  let acceleration = 0;
  state.braking = false;
  state.reversing = false;

  if (input.throttle && !input.reverse) {
    if (state.speed < -0.4) {
      acceleration = VEHICLE.brakeDeceleration;
      state.braking = true;
    } else {
      acceleration = VEHICLE.acceleration * (1 - clamp(state.speed / speedLimit, 0, 1) ** 2);
    }
  } else if (input.reverse && !input.throttle) {
    if (state.speed > 0.4) {
      acceleration = -VEHICLE.brakeDeceleration;
      state.braking = true;
    } else {
      acceleration = -VEHICLE.reverseAcceleration * (1 - clamp(-state.speed / VEHICLE.maxReverseSpeed, 0, 1));
      state.reversing = true;
    }
  }

  const resistance =
    Math.sign(state.speed) * VEHICLE.rollingResistance +
    VEHICLE.airDrag * state.speed * Math.abs(state.speed) +
    (state.speed > speedLimit ? (state.speed - speedLimit) * 2.5 : 0);
  const previousSpeed = state.speed;
  let speed = state.speed + (acceleration - resistance) * step;

  if (input.handbrake) {
    const reduction = VEHICLE.handbrakeDeceleration * step;
    speed = Math.abs(speed) <= reduction ? 0 : speed - Math.sign(speed) * reduction;
    state.braking = true;
  }
  if (acceleration === 0 && Math.sign(speed) !== Math.sign(previousSpeed)) speed = 0;
  state.speed = clamp(speed, -VEHICLE.maxReverseSpeed, VEHICLE.maxSpeed);

  const steerInput = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  const speedFactor = clamp(Math.abs(state.speed) / VEHICLE.maxSpeed, 0, 1);
  const steerLimit = VEHICLE.maxSteer + (VEHICLE.highSpeedSteer - VEHICLE.maxSteer) * speedFactor;
  const steerRate = steerInput === 0 ? VEHICLE.steerReturnRate : VEHICLE.steerRate;
  state.steer += clamp(steerInput * steerLimit - state.steer, -steerRate * step, steerRate * step);

  const yawRate = (state.speed / VEHICLE.wheelBase) * Math.tan(state.steer);
  state.heading += yawRate * step;
  state.x += Math.sin(state.heading) * state.speed * step;
  state.z += Math.cos(state.heading) * state.speed * step;
  state.wheelSpin += (state.speed / VEHICLE.wheelRadius) * step;

  const longitudinal = (state.speed - previousSpeed) / step;
  const smoothing = 1 - Math.exp(-6 * step);
  state.bodyRoll += (clamp(state.speed * yawRate * 0.009, -0.075, 0.075) - state.bodyRoll) * smoothing;
  state.bodyPitch += (clamp(-longitudinal * 0.0045, -0.05, 0.06) - state.bodyPitch) * smoothing;
  return state;
}
