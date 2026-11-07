import {Param} from "../shapes/param";
import type {AlgNumSubSystem} from './AlgNumSystem';

export interface SolvableObject {

  id: string;
  visitParams(callback: (param: Param) => void): void;

}

export interface ISolveStage {
  objects: Set<SolvableObject>;
  index: number;
  readonly solverSystem: AlgNumSubSystem;
}
