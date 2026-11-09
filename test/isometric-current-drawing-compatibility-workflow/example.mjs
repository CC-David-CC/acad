// Public recipe; actual source/selection IDs come from the retained E22 recipe.
import {createDrawingReferenceRepairExample} from '../drawing-reference-repair-public-workflow/example.mjs';
export function createIsometricDrawingExample(agent,build){
 const base=createDrawingReferenceRepairExample(agent,build);
 return Object.freeze({...base,
  async definition(binding,drawingId){
   const d=await base.definition(binding,drawingId);
   d.title='Linked isometric plate '+drawingId;
   d.sheet={width:594,height:420,scale:{numerator:1,denominator:1}};
   const origins={top:[50,110],front:[50,240],right:[270,240]};
   for(const view of d.views)view.paperOrigin=origins[view.basis].slice();
   const labels={width:[125,125],height:[30,80],depth:[30,225],'hole-diameter':[170,80],'hole-offset-x':[125,145],'hole-offset-y':[20,105]};
   for(const dimension of d.dimensions)dimension.label=labels[dimension.dimensionId].slice();
   return d;
  },
  withIsometric(definition){
   if(definition.version!==1||definition.views.length!==3||definition.views.map(v=>v.basis).join(',')!=='top,front,right')throw Error('Start from the actual complete orthographic drawing.');
   const d=structuredClone(definition);d.version=2;
   d.views.push({viewId:'isometric',basis:'isometric',paperOrigin:[430,140],visibility:'visible-and-hidden'});
   return d;
  }
 });
}
