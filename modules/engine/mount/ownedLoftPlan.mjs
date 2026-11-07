// Worker-only geometry preparation and full-request binding. No input is
// recaptured after hashing; all native arrays derive from this same snapshot.
import {captureOwnedLoftIntent,bindOwnedLoftIntent,captureOwnedLoftBinding} from '../solid/ownedLoftIntent.mjs';
import {preparePolygonProfileFace} from './polygonProfilePlan.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
export async function prepareOwnedLoft(input){
 const request=captureOwnedLoftIntent(input),faces=request.sections.map(s=>preparePolygonProfileFace({version:1,unit:request.unit,frame:s.frame,region:s.region})),c=request.correspondence;
 const starts=[c.startA,c.startB],reverse=[c.reverseA,c.reverseB],nativeCorrespondence=[1,1,1,c.kind==='circle'?1:0];
 for(let i=0;i<2;i++){
  let start=starts[i],reversed=reverse[i];
  if(c.kind==='circle'){if(Math.abs(start)>2*Math.PI)fail('LOFT_INVALID_CORRESPONDENCE','Circle seam radians must be within±2π.');}
  else{const n=request.sections[i].region.outer.length;if(!Number.isInteger(start)||start<0||start>=n)fail('LOFT_INVALID_CORRESPONDENCE','Polygon start must name a captured boundary vertex.');
   // Existing profile preparation normalizes winding, not geometry. Preserve
   // the exact requested source corner and traversal through that permutation.
   if(faces[i].loops[0].sourceWinding<0){start=n-1-start;reversed=!reversed;}
  }
  nativeCorrespondence.push(start,reversed?1:0);
 }
 const binding=captureOwnedLoftBinding(await bindOwnedLoftIntent(request));
 return{request,nativeSections:faces.map(f=>f.nativeValues),nativeCorrespondence,binding};
}
