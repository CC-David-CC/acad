import {ARC_CLASS} from './arcClass.mjs';
import Vector from "math/vector";
import { SketchObject, SketchObjectSerializationData } from "./sketch-object";
import { Param } from "./param";
import { AlgNumConstraint, ConstraintDefinitions } from "../constr/ANConstraints";
import { EndPoint, SketchPointSerializationData } from "./point";
import { Viewer } from "../viewer2d";
import { distance } from "math/distance";
import {captureArcBranch,captureArcData,arcDataFromObject,arcBranchFacts,requireArcInterval,arcSectorContains} from './arcBranch.mjs';
import type {ArcBranch} from './arcBranch.mjs';

export class Arc extends SketchObject {
  a: EndPoint;
  b: EndPoint;
  c: EndPoint;
  r: Param;
  ang1: Param;
  ang2: Param;
  readonly branch: ArcBranch;

  constructor(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, id?: string, branch: ArcBranch = 'proper-ccw') {
    super(id);
    this.branch = captureArcBranch(branch);
    this.a = new EndPoint(ax, ay, this.id + ":A");
    this.b = new EndPoint(bx, by, this.id + ":B");
    this.c = new EndPoint(cx, cy, this.id + ":C");

    this.a.parent = this;
    this.b.parent = this;
    this.c.parent = this;
    this.children.add(this.a).add(this.b).add(this.c);

    this.r = new Param(0, "R");
    this.r.enforceVisualLimit = true;

    this.ang1 = new Param(0, "A");
    this.ang2 = new Param(0, "A");

    this.syncGeometry();
  }

  syncGeometry() {
    this.ang1.set(this.calcStartAng());
    this.ang2.set(this.calcEndAng());
    this.r.set(this.distanceA());
  }

  visitParams(callback: (param: Param) => void) {
    callback(this.r);
    callback(this.ang1);
    callback(this.ang2);
    this.a.visitParams(callback);
    this.b.visitParams(callback);
    this.c.visitParams(callback);
  }

  getReferencePoint() {
    return this.c;
  }

  translateImpl(dx: number, dy: number) {
    this.a.translate(dx, dy);
    this.b.translate(dx, dy);
    this.c.translate(dx, dy);
  }

  radiusForDrawing() {
    return this.r.get();
  }

  distanceA() {
    return distance(this.a.x, this.a.y, this.c.x, this.c.y);
  }

  distanceB() {
    return distance(this.b.x, this.b.y, this.c.x, this.c.y);
  }

  calcStartAng() {
    return Math.atan2(this.a.y - this.c.y, this.a.x - this.c.x);
  }

  calcEndAng() {
    return Math.atan2(this.b.y - this.c.y, this.b.x - this.c.x);
  }

  getStartAngle() {
    return this.ang1.get();
  }

  getEndAngle() {
    return this.ang2.get();
  }

  get labelCenter() {
    const facts=arcBranchFacts(arcDataFromObject(this));
    // An unavailable numeric chart has no invented midpoint. Keep any actual
    // radius annotation anchored to the genuine start endpoint; drawImpl emits
    // the explicit unavailable notice for the curve itself.
    if(!facts.representable)return new Vector(this.a.x,this.a.y,0);
    const angle=facts.start+facts.sweep/2;
    return new Vector(this.c.x+this.r.get()*Math.cos(angle),this.c.y+this.r.get()*Math.sin(angle),0);
  }

  drawImpl(ctx: CanvasRenderingContext2D, scale: number) {
    ctx.beginPath();
    const r = this.radiusForDrawing();
    let facts;
    try {facts=requireArcInterval(arcDataFromObject(this));}
    catch (error) {
      if(error?.code==='INVALID_ARC_BRANCH'&&!this.stage)return; // private uncommitted tool draft
      if(error?.code!=='ARC_INTERVAL_UNREPRESENTABLE')throw error;
      ctx.save();ctx.translate(this.c.x,this.c.y);ctx.scale(1,-1);ctx.font=(12/Math.max(scale,Number.MIN_VALUE))+'px sans-serif';ctx.fillText('Arc interval unavailable',0,0);ctx.restore();return;
    }
    if (r > 0) ctx.arc(this.c.x,this.c.y,r,facts.branch==='full-ccw'?0:facts.start,facts.branch==='full-ccw'?2*Math.PI:facts.end);
    const distanceB = this.distanceB();
    if (Math.abs(r - distanceB) * scale > 1) {
      const adj = r / distanceB;
      ctx.save();
      ctx.setLineDash([7 / scale]);
      ctx.lineTo(this.b.x, this.b.y);
      ctx.moveTo(this.b.x + (this.b.x - this.c.x) / adj, this.b.y + (this.b.y - this.c.y) / adj);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.stroke();
    }
  }

  isPointInsideSector(x: number, y: number) {
    return arcSectorContains(arcDataFromObject(this),x,y);
  }

  normalDistance(aim: { x: number; y: number }) {
    const isInsideSector = this.isPointInsideSector(aim.x, aim.y);
    if (isInsideSector) {
      return Math.abs(distance(aim.x, aim.y, this.c.x, this.c.y) - this.radiusForDrawing());
    } else {
      return Math.min(distance(aim.x, aim.y, this.a.x, this.a.y), distance(aim.x, aim.y, this.b.x, this.b.y));
    }
  }

  stabilize(viewer: Viewer) {
    this.syncGeometry();
    const constr = new AlgNumConstraint(ConstraintDefinitions.ArcConsistency, [this]);
    constr.internal = true;
    this.stage.addConstraint(constr);
  }

  copy(id?:string) {
    return new Arc(this.a.x, this.a.y, this.b.x, this.b.y, this.c.x, this.c.y,id,this.branch);
  }

  mirror(dest: Arc, mirroringFunc: (x: number, y: number) => { x: number; y: number }) {
    if(dest.branch!==this.branch)throw Error('Mirrored Arc branch differs from its actual source.');
    this.a.mirror(dest.b, mirroringFunc);
    this.b.mirror(dest.a, mirroringFunc);
    this.c.mirror(dest.c, mirroringFunc);
    dest.syncGeometry();
  }

  write(): SketchArcSerializationData {
    return {
      a: this.a.write(),
      b: this.b.write(),
      c: this.c.write(),
      branch:this.branch,
    };
  }

  static read(id: string, data: SketchArcSerializationData): Arc {
    const d=captureArcData(data);
    return new Arc(d.a.x,d.a.y,d.b.x,d.b.y,d.c.x,d.c.y,id,d.branch);
  }
}

export interface SketchArcSerializationData extends SketchObjectSerializationData {
  a: SketchPointSerializationData;
  b: SketchPointSerializationData;
  c: SketchPointSerializationData;
  branch: ArcBranch;
}

Arc.prototype.TYPE = "Arc";

Arc.prototype._class = ARC_CLASS;
