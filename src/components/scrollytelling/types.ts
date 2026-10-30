export interface TrajectoryPoint {
  frame: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface ScrollytellingAssets {
  flightFrames: HTMLImageElement[];
  trajectory: TrajectoryPoint[];
}

export interface MascotCoordinate {
  screenX: number;
  screenY: number;
  screenW: number;
  screenH: number;
  frameIndex: number;
}
