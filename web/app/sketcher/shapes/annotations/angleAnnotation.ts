import {AngleBetweenDimension, DiameterDimension, LinearDimension, HDimension, VDimension,formatDimensionValue} from "../dim";
import {EndPoint} from '../point';
import {Styles} from "../../styles";
import {ConstraintAnnotation} from "../../constr/constraintAnnotation";
import {AlgNumConstraint} from "../../constr/ANConstraints";
import {Segment} from "../segment";
import {Arc} from "../arc";
import {Viewer} from "../../viewer2d";

export class AngleBetweenAnnotation extends AngleBetweenDimension implements ConstraintAnnotation<{offset: number}> {

  constraint: AlgNumConstraint;

  isConstraintAnnotation = true;

  constructor(a: Segment, b: Segment, constraint: AlgNumConstraint) {
    super(a, b);
    this.constraint = constraint;
  }

  get isAnnotation() {
    return true;
  }

  save() {
    return {
      offset: this.offset,
    }
  }

  load(params: { offset: number }) {
    this.offset = params.offset;
  }
}

AngleBetweenAnnotation.prototype.TYPE = 'AngleBetweenAnnotation';

AngleBetweenAnnotation.prototype._class = 'TCAD.TWO.AngleBetweenAnnotation';

export class AngleAbsoluteAnnotation extends AngleBetweenDimension implements ConstraintAnnotation<{offset: number}> {

  constraint: AlgNumConstraint;

  isConstraintAnnotation = true;

  constructor(segment: Segment, constraint: AlgNumConstraint) {
    super({
      a: segment.a,
      b: {
        get x() {
          return segment.a.x + 100
        },
        get y() {
          return segment.a.y;
        }
      },
      params: {
        ang: {
          get() {
            return 0
          }
        }
      },
      get nx() {
        return 0;
      },
      get ny() {
        return 1;
      }
    }, segment);
    this.constraint = constraint;
  }

  get isAnnotation() {
    return true;
  }

  drawRef(ctx: CanvasRenderingContext2D, a: { x: number; y: number }, b: { x: number; y: number }, px: number, py: number, vx: number, vy: number, viewer: Viewer, unscale: number, first: boolean) {
    if (!first) {
      super.drawRef(ctx, a, b, px, py, vx, vy, viewer, unscale, first);
    } else {
      const WIDTH = 10;
      ctx.save();
      viewer.setStyle(Styles.CONSTRUCTION, ctx);
      ctx.beginPath();
      ctx.lineTo(px + vx * WIDTH * unscale, py + vy * WIDTH * unscale);
      ctx.lineTo(px - vx * WIDTH * unscale, py - vy * WIDTH * unscale);
      ctx.stroke();
      ctx.restore();
    }
  }

  save() {
    return {
      offset: this.offset,
    }
  }

  load(params: { offset: number }) {
    this.offset = params.offset;
  }
}

AngleAbsoluteAnnotation.prototype._class = 'AngleAbsoluteAnnotation';


export class LengthAnnotation extends LinearDimension implements ConstraintAnnotation<{offset: number}>  {

  constraint: AlgNumConstraint;

  isConstraintAnnotation = true;

  constructor(segment: Segment, constraint: AlgNumConstraint) {
    super(segment.a, segment.b);
    this.constraint = constraint;
  }

  get isAnnotation() {
    return true;
  }

  save() {
    return {
      offset: this.offset,
    }
  }

  load(params: { offset: number }) {
    this.offset = params.offset;
  }
}

LengthAnnotation.prototype.TYPE = 'LengthAnnotation';

LengthAnnotation.prototype._class = 'TCAD.TWO.LengthAnnotation';

export class SignedXAnnotation extends HDimension implements ConstraintAnnotation<{offset:number}> {
  constraint: AlgNumConstraint;
  isConstraintAnnotation = true;
  constructor(a:EndPoint,b:EndPoint,constraint:AlgNumConstraint){super(a,b);this.constraint=constraint;}
  get isAnnotation(){return true;}
  dimensionText(_distance?:number,viewer?:Viewer){return 'ΔX '+formatDimensionValue(this.b.x-this.a.x,'length',viewer);}
  save(){return {offset:this.offset};}
  load(params:{offset:number}){this.offset=params.offset;}
}
SignedXAnnotation.prototype.TYPE='SignedXAnnotation';
SignedXAnnotation.prototype._class='TCAD.TWO.SignedXAnnotation';

export class SignedYAnnotation extends VDimension implements ConstraintAnnotation<{offset:number}> {
  constraint: AlgNumConstraint;
  isConstraintAnnotation = true;
  constructor(a:EndPoint,b:EndPoint,constraint:AlgNumConstraint){super(a,b);this.constraint=constraint;}
  get isAnnotation(){return true;}
  dimensionText(_distance?:number,viewer?:Viewer){return 'ΔY '+formatDimensionValue(this.b.y-this.a.y,'length',viewer);}
  save(){return {offset:this.offset};}
  load(params:{offset:number}){this.offset=params.offset;}
}
SignedYAnnotation.prototype.TYPE='SignedYAnnotation';
SignedYAnnotation.prototype._class='TCAD.TWO.SignedYAnnotation';

export class ProjectedDistanceAnnotation extends LinearDimension implements ConstraintAnnotation<{offset:number}> {
  constraint: AlgNumConstraint;
  direction: Segment;
  isConstraintAnnotation = true;
  constructor(a:EndPoint,b:EndPoint,direction:Segment,constraint:AlgNumConstraint){super(a,b);this.direction=direction;this.constraint=constraint;}
  get isAnnotation(){return true;}
  value(){const dx=this.direction.b.x-this.direction.a.x,dy=this.direction.b.y-this.direction.a.y,n=Math.hypot(dx,dy);return n>1e-9?((this.b.x-this.a.x)*dx+(this.b.y-this.a.y)*dy)/n:NaN;}
  getB(){const dx=this.direction.b.x-this.direction.a.x,dy=this.direction.b.y-this.direction.a.y,n=Math.hypot(dx,dy),value=this.value();return n>1e-9?{x:this.a.x+value*dx/n,y:this.a.y+value*dy/n}:this.a;}
  dimensionText(_distance?:number,viewer?:Viewer){const value=this.value();return Number.isFinite(value)?'P '+formatDimensionValue(value,'length',viewer):'P undefined';}
  dependsOn(obj){return super.dependsOn(obj)||obj===this.direction;}
  save(){return {offset:this.offset};}
  load(params:{offset:number}){this.offset=params.offset;}
}
ProjectedDistanceAnnotation.prototype.TYPE='ProjectedDistanceAnnotation';
ProjectedDistanceAnnotation.prototype._class='TCAD.TWO.ProjectedDistanceAnnotation';

export class RadiusLengthAnnotation extends DiameterDimension implements ConstraintAnnotation<{angle: number}>  {

  constraint: AlgNumConstraint;

  isConstraintAnnotation = true;

  constructor(obj: Arc, constraint: AlgNumConstraint) {
    super(obj);
    this.constraint = constraint;
  }

  get isAnnotation() {
    return true;
  }

  save() {
    return {
      angle: this.angle,
    }
  }

  load(params: { angle: number }) {
    this.angle = params.angle;
  }
}

RadiusLengthAnnotation.prototype.TYPE = 'RadiusLengthAnnotation';

RadiusLengthAnnotation.prototype._class = 'TCAD.TWO.RadiusLengthAnnotation';

// The authored dimension is the diameter even though the sketch parameter is radius.
export class DiameterLengthAnnotation extends RadiusLengthAnnotation {
  dimensionText(radius: number,viewer?:Viewer) { return 'Ø ' + formatDimensionValue(2*radius,'length',viewer); }
}
DiameterLengthAnnotation.prototype.TYPE = 'DiameterLengthAnnotation';
DiameterLengthAnnotation.prototype._class = 'TCAD.TWO.DiameterLengthAnnotation';
