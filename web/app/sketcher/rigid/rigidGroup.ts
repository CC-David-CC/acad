import {SketchObject} from '../shapes/sketch-object';
import {Param} from '../shapes/param';
import {readRigidGroupRecord} from './rigidGroupPlan.mjs';

// Explicit, indexed authored owner of the three solver variables. Member
// geometry remains in its existing sketch objects and retains its own IDs.
export class RigidGroup extends SketchObject {
  readonly members: readonly any[];
  readonly points: readonly any[];
  readonly tx: Param;
  readonly ty: Param;
  readonly angle: Param;

  constructor(id: string, data: any) {
    super(id);
    const record = readRigidGroupRecord(id, data);
    this.members = record.members;
    this.points = record.points;
    this.tx = new Param(record.transform.x, 'rigid-x');
    this.ty = new Param(record.transform.y, 'rigid-y');
    this.angle = new Param(record.transform.angle, 'rigid-angle');
  }

  visitParams(callback: (param: Param) => void) {
    callback(this.tx);
    callback(this.ty);
    callback(this.angle);
  }

  drawImpl() { /* The group is an owner, not a second drawable geometry. */ }

  write() {
    return {version: 1, members: this.members.map(member => ({...member})), points: this.points.map(point => ({...point})),
      transform: {x: this.tx.get(), y: this.ty.get(), angle: this.angle.get()}};
  }

  static read(id: string, data: any) { return new RigidGroup(id, data); }
}
RigidGroup.prototype.TYPE = 'RigidGroup';
