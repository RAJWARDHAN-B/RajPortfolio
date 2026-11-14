import type { ScareSite } from "./layout";
import type { TravelMode } from "./types";

export const SCARE_APPEAR_DISTANCE = 52;
export const SCARE_REARM_DISTANCE = 80;
export const SCARE_COOLDOWN_SECONDS = 35;

export interface ScareTracker {
  armed: boolean[];
  cooldownUntil: number[];
}

export const createScareTracker = (count: number): ScareTracker => ({
  armed: Array.from({ length: count }, () => true),
  cooldownUntil: Array.from({ length: count }, () => 0),
});

/** Nearest armed site close enough for its creature to appear, or -1. */
export function findLurkSite(tracker: ScareTracker, sites: ScareSite[], x: number, z: number) {
  let nearest = -1;
  let nearestDistance = SCARE_APPEAR_DISTANCE;
  sites.forEach((site, index) => {
    const distance = Math.hypot(site.x - x, site.z - z);
    if (tracker.armed[index] && distance < nearestDistance) {
      nearest = index;
      nearestDistance = distance;
    }
  });
  return nearest;
}

export const chargeDistance = (mode: TravelMode) => (mode === "drive" ? 26 : 12);

export function consumeSite(tracker: ScareTracker, index: number, now: number) {
  tracker.armed[index] = false;
  tracker.cooldownUntil[index] = now + SCARE_COOLDOWN_SECONDS;
}

/** A site re-arms only after its cooldown and once the visitor has left the area. */
export function rearmSites(tracker: ScareTracker, sites: ScareSite[], x: number, z: number, now: number) {
  sites.forEach((site, index) => {
    if (
      !tracker.armed[index] &&
      now >= tracker.cooldownUntil[index] &&
      Math.hypot(site.x - x, site.z - z) > SCARE_REARM_DISTANCE
    ) {
      tracker.armed[index] = true;
    }
  });
}
