import {Dimension,formatDimensionValue} from './dimensionBase';
import {TextHelper} from './textHelper';
import {arcLengthFromObject} from '../constr/arcLengthDomain.mjs';
import {requireArcInterval,arcDataFromObject} from './arcBranch.mjs';
// A ruler names the whole authored circular interval, never an endpoint chord.
export class ArcLengthDimension extends Dimension{
 constructor(arc,id){super(id);this.arc=arc;this.offset=20;this.textHelper=new TextHelper();}
 visitParams(){}
 getReferencePoint(){return this.arc.c;}
 dependsOn(obj){return obj===this.arc;}
 translateImpl(dx,dy){if(!this.normal)return;this.offset+=(dx*this.normal[0]+dy*this.normal[1])*this.scale;}
 drawImpl(ctx,scale,viewer){if(!Number.isFinite(scale)||scale<=0)return;const facts=requireArcInterval(arcDataFromObject(this.arc)),m=arcLengthFromObject(this.arc),angle=facts.start+facts.sweep/2,nx=Math.cos(angle),ny=Math.sin(angle),r=m.radius+this.offset/scale;this.scale=scale;this.normal=[nx,ny];
  const drivers=[...this.arc.constraints].filter(c=>!c.internal&&c.schema.id==='ArcLength'&&c.objects.length===1&&c.objects[0]===this.arc&&c.stage===this.arc.stage&&c.stage.solverSystem.allConstraints.includes(c)),role=drivers.length===0?'reference':drivers.length===1&&!this.arc.stage.solverSystem.isConflicting(drivers[0])?'driving':'unresolved',label='⌒ '+formatDimensionValue(m.length,'length',viewer),text=role==='reference'?'('+label+')':role==='unresolved'?'? '+label:label;
  this.textHelper.prepare(text,ctx,viewer);const x=this.arc.c.x+r*nx,y=this.arc.c.y+r*ny;ctx.beginPath();ctx.moveTo(this.arc.c.x+m.radius*nx,this.arc.c.y+m.radius*ny);ctx.lineTo(x,y);ctx.stroke();this.textHelper.draw(x,y,0,1,ctx,1/scale,viewer,0);
 }
 normalDistance(aim){return this.textHelper.normalDistance(aim);}
 write(){return{arc:this.arc.id,offset:this.offset};}
 static load(id,data,index){const d=new ArcLengthDimension(index[data.arc],id);d.offset=data.offset;return d;}
}
ArcLengthDimension.prototype.TYPE='ArcLengthDimension';
ArcLengthDimension.prototype._class='TCAD.TWO.ArcLengthDimension';
