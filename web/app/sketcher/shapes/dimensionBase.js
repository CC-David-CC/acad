// Shared acyclic base: concrete dimension subclasses must not be dependencies.
import {SketchObject} from './sketch-object';
import {formatDisplayQuantity} from '../../cad/projectManager/displayUnits.mjs';

// Presentation only; all geometry and serialized dimensions remain canonical.
export function formatDimensionValue(value,dimension,viewer){
  const manager=viewer?.applicationContext?.projectManager;
  return (manager?.formatDisplayQuantity?manager.formatDisplayQuantity(value,dimension):formatDisplayQuantity(value,dimension)).text;
}

export class Dimension extends SketchObject {

  constructor(id) {
    super(id);
  }
}

