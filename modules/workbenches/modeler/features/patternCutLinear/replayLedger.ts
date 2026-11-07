import {MObject} from 'cad/model/mobject';

// Runtime-only, owned by one full replay. Nothing here enters a project file.
export interface CutSeed {
  featureId: number;
  sourceFaceId: string;
  circleId: string;
  radius: number;
  center: {x: number, y: number};
  bounds: {minX: number, maxX: number, minY: number, maxY: number};
  tool: MObject;
  result: MObject;
}
export interface PatternReplay {
  requestedSeed: number | null;
  seed: CutSeed | null;
}
