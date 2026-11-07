// SYNTHETIC METADATA ONLY. These labels are not native/public authored IDs,
// geometry fixtures, measured dimensions, or a successful CAD operation.
export const build = 'sha256:' + 'a'.repeat(64) + ':' + 'b'.repeat(64);
export function definition() {
  const source = (curveId, point) => ({kind:'source-point',featureId:1,faceId:'fixture-face',regionId:'opaque fixture region',curveId,curveType:'segment',point});
  const hole = () => ({kind:'center-hole',featureId:2,sourceFeatureId:1,faceId:'fixture-face',regionId:'opaque fixture region',slot:'center',geometry:'cylinder'});
  const common = (dimensionId,viewId='top-view') => ({dimensionId,viewId,label:[10,10]});
  const width = (id,view) => ({...common(id,view),kind:'source-distance',axis:'datum-x',from:source('fixture-bottom','a'),to:source('fixture-bottom','b')});
  return {
    version:1,unit:'millimeter',drawingId:'fixture-drawing',title:'Synthetic definition, not measured geometry',
    target:{featureId:2,operationType:'WORKER_THROUGH_HOLES_V1',engine:'occ',engineRevision:build,output:'complete-native-result'},
    datum:{featureId:1,faceId:'fixture-face',regionId:'opaque fixture region'},
    sheet:{width:297,height:210,scale:{numerator:1,denominator:2}},
    views:['top','front','right'].map((basis,i)=>({viewId:basis+'-view',basis,paperOrigin:[10+i*50,10],visibility:'visible-and-hidden'})),
    dimensions:[width('width','top-view'),
      {...common('height'),kind:'source-distance',axis:'datum-y',from:source('fixture-left','a'),to:source('fixture-left','b')},
      {...common('thickness','front-view'),kind:'plane-distance',axis:'datum-normal',first:{kind:'native-face',originFeatureId:1,selectionId:'fixture-cap-first',geometry:'plane'},second:{kind:'native-face',originFeatureId:1,selectionId:'fixture-cap-last',geometry:'plane'}},
      {...common('diameter'),kind:'hole-diameter',hole:hole()},
      {...common('offset-x'),kind:'hole-offset',axis:'datum-x',hole:hole()},
      {...common('offset-y'),kind:'hole-offset',axis:'datum-y',hole:hole()},width('width-front','front-view')]
  };
}
export const binding = () => ({revision:'synthetic-full-revision',geometryRevision:'synthetic-geometry-revision'});
export function request(op, def=definition()) {
  return {op,version:1,unit:'millimeter',...binding(),
    ...(op==='drawing.create'?{definition:def}:op==='drawing.replace'?{drawingId:def.drawingId,definition:def}:{drawingId:def.drawingId})};
}
