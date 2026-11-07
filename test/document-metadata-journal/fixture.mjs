// Synthetic metadata/journal controls only. No native objects, measured
// geometry, app publication or persisted source membership is represented.
export function manufacturing(count=1,tag='before') {
  return {version:1,unit:'millimeter',revision:'sha256-'+'a'.repeat(64),
    materials:Array.from({length:count},(_,i)=>({id:'material-'+i,name:tag+' material '+i})),
    appearances:[{id:'appearance',name:'fixture appearance',color:'#ff0000'}],
    bindings:[{id:'body-binding',featureId:1,operationType:'WORKER_ENCLOSURE_V2',outputRole:'BODY'}],
    objects:[{id:'part',name:'fixture part',regions:[{id:'region',bodyId:'body-binding',materialId:'material-0',appearanceId:'appearance',transform:[1,0,0,0,1,0,0,0,1,0,0,0]}]}]};
}
export function drawing(tag='before') {
  return {version:1,unit:'millimeter',drawingId:'fixture-drawing',title:tag,
    target:{featureId:2,operationType:'WORKER_THROUGH_HOLES_V1',engine:'occ',engineRevision:'sha256:'+'a'.repeat(64)+':'+'b'.repeat(64),output:'complete-native-result'},
    datum:{featureId:1,faceId:'fixture-face',regionId:'opaque fixture region'},
    sheet:{width:297,height:210,scale:{numerator:1,denominator:1}},
    views:[{viewId:'top-view',basis:'top',paperOrigin:[0,0],visibility:'visible-and-hidden'}],dimensions:[]};
}
