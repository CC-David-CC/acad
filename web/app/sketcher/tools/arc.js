import {Arc} from '../shapes/arc';
import {Tool} from './tool';
import Vector from 'math/vector';
import {distance} from 'math/distance';
import {captureArcData,arcDataFromObject} from '../shapes/arcBranch.mjs';
import {assertOrdinarySketchEntityDomain} from '../constr/ordinaryEntityDomain.mjs';
import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {runSketchTransaction} from '../actions/sketchTransaction';
import {assertRegisteredConstraintDomain,registeredResidualProfile} from '../constr/registeredConstraintPolicy.mjs';

// Drafts live ONLY in the existing service drawing layer. They are absent from
// parametric stages, serialization, history and source discovery until Finish.
export class AddArcTool extends Tool {
  constructor(viewer){super('arc',viewer);this.arc=null;this.point=null;this._v=new Vector(0,0,0);this.snaps=new Map();}
  restart(){this.sendHint('specify center');}
  validOrigin(origin){return !!origin&&!this.viewer.isDisposed()&&this.viewer.toolManager.tool===this&&this.viewer.parametricManager===origin.pm&&this.viewer.historyManager===origin.history&&this.viewer.io===origin.io&&this.viewer.activeLayer===origin.layer&&this.viewer.parametricManager.stages===origin.stages&&this.viewer.parametricManager.stage===origin.stage;}
  current(){if(!this.validOrigin(this.origin))throw Object.assign(Error('The Arc draft no longer belongs to this sketch.'),{code:'ARC_DRAFT_STALE'});}
  preview(arc){this.origin.service.objects.push(arc);arc.layer=this.origin.service;this.arc=arc;}
  detachPreview(){if(!this.arc||!this.origin)return;const list=this.origin.service.objects,at=list.indexOf(this.arc);if(at>=0)list.splice(at,1);if(this.arc.layer===this.origin.service)this.arc.layer=null;}
  cleanup(){this.detachPreview();this.arc=null;this.point=null;this.snaps.clear();this.origin=null;this.viewer.cleanSnap();this.viewer.refresh();}
  snapDraft(point){this.current();const target=this.viewer.snapped;if(!target)return;this.viewer.cleanSnap();point.setFromPoint(target);this.snaps.set(point,target);}
  mousemove(e){try{const p=this.viewer.screenToModel(e);if(this.point){this.current();this.point.x=p.x;this.point.y=p.y;if(this.point===this.arc.b){const r=this.radiusOfFirstPoint(),v=this._v;v.set(this.arc.b.x-this.arc.c.x,this.arc.b.y-this.arc.c.y,0);if(v.length()>0){v._normalize()._multiply(r);this.arc.b.x=v.x+this.arc.c.x;this.arc.b.y=v.y+this.arc.c.y;}}else this.demoSecondPoint();this.arc.syncGeometry();this.viewer.snap(p.x,p.y,[this.arc.a,this.arc.b,this.arc.c]);this.viewer.refresh();}else{this.viewer.snap(p.x,p.y,[]);this.viewer.refresh();}}catch(error){if(error?.code!=='ARC_DRAFT_STALE')throw error;this.abandonStale();}}
  abandonStale(){this.detachPreview();this.arc=null;this.point=null;this.snaps.clear();this.origin=null;}
  mouseup(e){try{if(!this.arc)this.createArcStep(this.viewer.screenToModel(e));else if(this.point===this.arc.a){this.snapDraft(this.arc.a);this.startingPointSetStep();}else{this.snapDraft(this.arc.b);this.finishStep();}}catch(error){if(error?.code==='ARC_DRAFT_STALE')this.abandonStale();else this.sendMessage(error.message||'Arc could not be accepted.');}}
  createArcStep(p){
    const viewer=this.viewer,service=viewer._serviceWorkspace?.[0]?.[0];
    if(!service||!Array.isArray(service.objects)||viewer.isDisposed())throw Error('Arc draft rendering is unavailable.');
    const source=viewer.io.serializeSketch(undefined,{strict:true});
    this.origin={pm:viewer.parametricManager,history:viewer.historyManager,io:viewer.io,layer:viewer.activeLayer,service,source,stages:viewer.parametricManager.stages,stage:viewer.parametricManager.stage,index:viewer.createIndex()};
    const arc=new Arc(p.x,p.y,p.x,p.y,p.x,p.y);this.preview(arc);this.point=arc.a;this.snapDraft(arc.c);this.pointPicked(p.x,p.y);this.sendHint('specify arc starting point');this.viewer.refresh();
  }
  startingPointSetStep(){this.point=this.arc.b;this.pointPicked(this.arc.a.x,this.arc.a.y);this.sendHint('specify angle, or type full for one full turn');}
  finishStep(){
    this.current();const viewer=this.viewer,arc=this.arc,origin=this.origin,pm=origin.pm;
    captureArcData(arcDataFromObject(arc));assertOrdinarySketchEntityDomain('Arc',arcDataFromObject(arc));
    if(viewer.io.serializeSketch(undefined,{strict:true})!==origin.source)throw Error('The accepted sketch changed while the Arc was being drafted.');
    const index=viewer.createIndex(),oldIds=Object.keys(origin.index),newIds=Object.keys(index);if(oldIds.length!==newIds.length||oldIds.some(id=>index[id]!==origin.index[id]))throw Object.assign(Error('The actual sketch objects changed while the Arc was being drafted.'),{code:'ARC_DRAFT_STALE'});for(const target of this.snaps.values())if(index[target.id]!==target)throw Error('An Arc snap reference is no longer current.');
    const snaps=[...this.snaps],constraints=[];this.detachPreview();
    try{
      runSketchTransaction(viewer,{mutate:()=>{
        origin.layer.add(arc);arc.stabilize(viewer);
        for(const [point,target]of snaps){const c=new AlgNumConstraint(ConstraintDefinitions.PCoincident,[point,target]);constraints.push(c);pm._add(c);}
      },validate:()=>{
        captureArcData(arcDataFromObject(arc));assertOrdinarySketchEntityDomain('Arc',arcDataFromObject(arc));
        if(!this.validOrigin(origin)||arc.layer!==origin.layer||arc.stage!==origin.stage)throw Object.assign(Error('The Arc draft owner changed during admission.'),{code:'ARC_DRAFT_STALE'});
        const intrinsic=arc.stage.algNumSystem.allConstraints.filter(c=>c.internal&&c.schema===ConstraintDefinitions.ArcConsistency&&c.objects.length===1&&c.objects[0]===arc);
        if(intrinsic.length!==1)throw Error('The new Arc has no unique actual intrinsic relation.');
        // Validate only the actual newly authored rows; prior rejected rows keep
        // the existing recovery semantics. No optimizer or second publication.
        for(const c of [...intrinsic,...constraints]){
          const system=c.stage?.algNumSystem;
          if(!system||!system.allConstraints.includes(c)||c.params.some(p=>!Number.isFinite(p.get()))||system.conflicting.has(c)&&!system.redundant.has(c))throw Error('A new Arc equation was rejected.');
          assertRegisteredConstraintDomain(c);const rows=[];c.collectPolynomials(rows);
          const values=rows.map(row=>row.value()),profile=registeredResidualProfile(c,values);
          if(!rows.length||values.some(v=>!Number.isFinite(v))||profile.residuals.some((v,i)=>!Number.isFinite(v)||Math.abs(v)>profile.tolerances[i]))throw Error('A new Arc original equation is not satisfied.');
        }
      },rollbackExtra:()=>{if(arc.layer===origin.layer)origin.layer.remove(arc);arc.stage=null;}});
    }catch(error){if(arc.layer===origin.layer)origin.layer.remove(arc);arc.stage=null;this.arc=null;this.point=null;this.snaps.clear();this.origin=null;if(this.validOrigin(origin)){this.restart();viewer.refresh();throw error;}throw Object.assign(Error('The Arc draft owner changed during rejection.'),{code:'ARC_DRAFT_STALE',cause:error});}
    this.arc=null;this.point=null;this.snaps.clear();this.origin=null;try{pm.refresh();}catch(error){console.error('Arc was accepted, but sketch refresh failed:',error);}if(this.validOrigin(origin)){
      // Restore Tool.pointPicked's final-endpoint reference/notification. Write
      // the owned reference BEFORE notifying; a subscriber may replace the
      // document/tool synchronously, and no later write may touch its state.
      const reference=viewer.referencePoint,x=arc.b.x,y=arc.b.y;
      const message='picked: '+viewer.roundToPrecision(x)+' : '+viewer.roundToPrecision(y);
      if(this.validOrigin(origin)&&viewer.referencePoint===reference){reference.x=x;reference.y=y;this.sendMessage(message);}
      if(this.validOrigin(origin))viewer.toolManager.releaseControl();
    }
  }
  demoSecondPoint(){const r=this.radiusOfFirstPoint(),ang=Math.atan2(this.arc.a.y-this.arc.c.y,this.arc.a.x-this.arc.c.x)+(2*Math.PI-0.3);this.arc.b.x=this.arc.c.x+r*Math.cos(ang);this.arc.b.y=this.arc.c.y+r*Math.sin(ang);}
  radiusOfFirstPoint(){return distance(this.arc.a.x,this.arc.a.y,this.arc.c.x,this.arc.c.y);}
  processCommand(command){
    if(this.arc)this.current();
    if(!this.arc){const p=Tool.ParseVector(this.viewer.referencePoint,command);if(typeof p==='string')return p;this.viewer.cleanSnap();this.createArcStep(p);return;}
    if(this.point===this.arc.a){const p=Tool.ParseVector(this.viewer.referencePoint,command);if(typeof p==='string')return p;this.arc.a.x=p.x;this.arc.a.y=p.y;this.startingPointSetStep();this.demoSecondPoint();this.arc.syncGeometry();this.viewer.refresh();return;}
    this.current();
    if(command.trim().toLowerCase()==='full'){
      const prior=this.arc,data={a:{x:prior.a.x,y:prior.a.y},b:{x:prior.a.x,y:prior.a.y},c:{x:prior.c.x,y:prior.c.y},branch:'full-ccw'};
      captureArcData(data);const snaps=[...this.snaps].map(([p,t])=>[p===prior.a?'a':p===prior.c?'c':'b',t]);this.detachPreview();this.preview(new Arc(data.a.x,data.a.y,data.b.x,data.b.y,data.c.x,data.c.y,prior.id,'full-ccw'));this.point=this.arc.b;this.snaps.clear();for(const [key,target]of snaps)this.snaps.set(this.arc[key],target);
    }else{const angle=Tool.ParseNumberWithRef(command,Math.atan2(this.arc.a.y-this.arc.c.y,this.arc.a.x-this.arc.c.x)*180/Math.PI);if(typeof angle==='string')return angle;const r=this.radiusOfFirstPoint(),t=angle/180*Math.PI;this.arc.b.x=this.arc.c.x+r*Math.cos(t);this.arc.b.y=this.arc.c.y+r*Math.sin(t);this.arc.syncGeometry();}
    this.finishStep();
  }
}
