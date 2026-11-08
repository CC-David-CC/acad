// Derive presentation from the live model. No role/value is persisted.
export const sameLengthPair=(d,s)=>(d.a===s.a&&d.b===s.b)||(d.a===s.b&&d.b===s.a);
export function lengthMeasurementRole(viewer,dimension){
 if(!viewer?.parametricManager||dimension.TYPE!=='LinearDimension'||dimension.isAnnotation)return null;
 const segments=[];for(const layer of viewer.layers||[])layer.traverseSketchObjects?.(o=>{if(o.TYPE==='Segment'&&sameLengthPair(dimension,o))segments.push(o);});
 if(segments.length!==1)return 'reference';
 const rows=[];for(const stage of viewer.parametricManager.stages)for(const c of stage.algNumSystem.allConstraints)if(!c.internal&&c.schema.id==='SegmentLength'&&c.objects.length===1&&c.objects[0]===segments[0])rows.push(c);
 if(!rows.length)return 'reference';
 return rows.length===1&&!rows[0].stage.algNumSystem.isConflicting(rows[0])?'driving':'unresolved';
}
export function hasLengthMeasurementRuler(viewer,annotation){
 const refs=(viewer?.dimLayer?.objects||[]).filter(d=>d.TYPE==='LinearDimension'&&!d.isAnnotation&&sameLengthPair(d,annotation));
 return refs.length===1&&lengthMeasurementRole(viewer,refs[0])==='driving';
}
