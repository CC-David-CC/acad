import type {Viewer} from "../viewer2d";
import {noteSketchMutation} from '../sketchMutationEpoch.mjs';

export class Shape {

  visible: boolean = true;
  style: any = null;
  private _role: string = null;
  get role(): string { return this._role; }
  set role(value: string) {
    if (this._role !== value) noteSketchMutation();
    this._role = value;
  }

  accept(visitor: (shape: Shape) => boolean): boolean {
    return visitor(this);
  }

  draw(ctx: CanvasRenderingContext2D, scale: number, viewer: Viewer) {
  }
}
