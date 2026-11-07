
export enum EntityKind {
  SHELL = 'shell',
  FACE = 'face',
  EDGE = 'edge',
  VERTEX = 'vertex',
  SKETCH_OBJECT = 'sketchObject',
  SKETCH_REGION = 'sketchRegion',
  DATUM = 'datum',
  DATUM_AXIS = 'datumAxis',
  LOOP = 'loop',
  SUBD = 'subd',
  PATCH_CAGE = 'patchCage',
  SURFACING_SCENE = 'surfacingScene',
  EMPTY_RESULT = 'emptyResult'
}

//Backward comp.
export const SHELL = EntityKind.SHELL;
export const FACE = EntityKind.FACE;
export const EDGE = EntityKind.EDGE;
export const VERTEX = EntityKind.VERTEX;
export const SKETCH_OBJECT = EntityKind.SKETCH_OBJECT;
export const SKETCH_REGION = EntityKind.SKETCH_REGION;
export const DATUM = EntityKind.DATUM;
export const DATUM_AXIS = EntityKind.DATUM_AXIS;
export const LOOP = EntityKind.LOOP;
export const SUBD = EntityKind.SUBD;
export const PATCH_CAGE = EntityKind.PATCH_CAGE;
export const SURFACING_SCENE = EntityKind.SURFACING_SCENE;

