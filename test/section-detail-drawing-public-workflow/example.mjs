// Reusable public recipe. Only actual discovered BoreReference/selection IDs
// enter authoring; private test captures are read-only regression observations.
import {createFourBoreDrawingExample} from '../four-bore-drawing-public-workflow/example.mjs';
export function createSectionDetailDrawingExample(agent,build){
 const base=createFourBoreDrawingExample(agent,build);
 return Object.freeze({...base,
  async author(origin){const info=await agent.execute('inspect-worker-solids',{}),rows=info.engines.flatMap(e=>e.availableBuilds||[]).filter(r=>r.engine==='occ'&&r.engineRevision===build);if(rows.length!==1||rows[0].drawingSectionVersion!==1||rows[0].drawingDetailVersion!==1)throw Error('The actual staged Shell section/detail cohort is required.');return base.author(origin);},
  async definition(b,id){
   const result=await base.definition(b,id),d=structuredClone(result.definition),rows=result.discovery.observation.bores;
   const one=(xs,why)=>{if(xs.length!==1)throw Error(why);return xs[0];};
   const center=structuredClone(one(rows.filter(r=>r.reference.featureId===b.center.featureId),'One actual center bore').reference),corner=structuredClone(one(rows.filter(r=>r.reference.featureId===b.corners.featureId&&r.reference.slot==='MIN_X_MIN_Y'),'One actual corner bore').reference);
   d.title='Actual cap section and physical corner detail '+id;
   d.views.push({viewId:'section',basis:'bore-center-section',hole:center,retainedSide:'positive-datum-y',paperOrigin:[140,330],visibility:'cut-boundary-only'},
    {viewId:'detail',basis:'detail',parentViewId:d.views[0].viewId,focus:corner,aperture:{kind:'rectangle',halfWidth:6,halfHeight:6},scale:{numerator:2,denominator:1},paperOrigin:[420,330],visibility:'inherit'});
   d.dimensions.push({...structuredClone(d.dimensions.find(x=>x.dimensionId==='depth')),dimensionId:'section-depth',viewId:'section',label:[210,320]},
    {dimensionId:'detail-diameter',viewId:'detail',kind:'hole-diameter',hole:structuredClone(corner),label:[470,310]});
   return{...result,baseDefinition:result.definition,definition:d};
  },
  invalid(d,b){const wrong=structuredClone(d);for(const view of wrong.views){if(view.basis==='bore-center-section')view.hole.featureId=b.fillet.featureId;if(view.basis==='detail')view.focus.featureId=b.fillet.featureId;}wrong.dimensions.find(v=>v.dimensionId==='detail-diameter').hole.featureId=b.fillet.featureId;return wrong;}
 });
}
