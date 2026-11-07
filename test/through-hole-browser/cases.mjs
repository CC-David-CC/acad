// Explicit solved component source requests; no native/model/history seed.
export const native={js:'dd666902fe926d69cc3c8843f5568c2a3e569f38ff49291baa2f248165b5ea99',wasm:'8d5e537e0d7f9e12b8ae0eaf239c0be1080934ed12a24bf6e7f849c9135ed5a2'};
export const revision=`sha256:${native.js}:${native.wasm}`;
const ids=['outer-bottom','outer-right','outer-top','outer-left'];
export const identity={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
const q=Math.SQRT1_2;
export const tilted={origin:[20,-35,12],x:[q,q,0],y:[0,0,1],z:[q,-q,0]};
function make(id,width,height,depth,frame){const corners=[[0,0],[width,0],[width,height],[0,height]];return{id,width,height,depth,sourceFaceId:'component-source-face',source:{op:'solid.profile.extrude',version:3,unit:'millimeter',frame,depth,region:{id:'through-hole-source-region',outer:corners.map((a,i)=>({kind:'segment',id:ids[i],a,b:corners[(i+1)%4]})),holes:[]}}};}
export const fixtures=[make('100x50x20',100,50,20,identity),make('150x30x25',150,30,25,identity),make('rotated-translated-100x50x20',100,50,20,tilted)];
export const filletPairs=[[ids[0],ids[3]],[ids[1],ids[2]]],chamferPairs=[[ids[0],ids[1]],[ids[2],ids[3]]];
export const bodyId=f=>'worker-solid:1:'+JSON.stringify([f,'body']);
export function holeIntent(fixture,kind){return{version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:kind==='centered-through'?20:21,target:bodyId(kind==='centered-through'?10:20),producerFeatureId:kind==='centered-through'?10:20,sourceFeatureId:10,sourceFaceId:fixture.sourceFaceId,sourceRegionId:fixture.source.region.id,kind,diameter:kind==='centered-through'?10:4,...(kind==='four-corner-through'?{offsetX:8,offsetY:8}:{})};}
