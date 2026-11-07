import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
export const identityFrame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
export function make({width=100,height=50,depth=20,minX=0,minY=0,kind='centered-through',diameter=kind==='centered-through'?10:4,offsetX=10,offsetY=10,frame=identityFrame}={}){
 const points=[[minX,minY],[minX+width,minY],[minX+width,minY+height],[minX,minY+height]],regionId='actual-component-source-region';
 const sourceProfile={op:'solid.profile.extrude',version:3,unit:'millimeter',frame:structuredClone(frame),depth,region:{id:regionId,outer:points.map((a,i)=>({kind:'segment',id:'rectangle-side-'+i,a:a.slice(),b:points[(i+1)%4].slice()})),holes:[]}};
 const world=points.flatMap(([x,y])=>[0,depth].map(z=>[0,1,2].map(i=>frame.origin[i]+frame.x[i]*x+frame.y[i]*y+frame.z[i]*z)));
 const targetMetrics={version:2,valid:true,solidCount:1,nativeVolume:width*height*depth,nativeBounds:{min:[0,1,2].map(i=>Math.min(...world.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...world.map(p=>p[i])))}};
 const request={version:1,unit:'millimeter',engine:'occ',engineRevision:'sha256:'+'a'.repeat(64)+':'+'b'.repeat(64),featureId:30,target:solidBodyId(20),producerFeatureId:20,sourceFeatureId:10,sourceFaceId:'actual-component-source-face',sourceRegionId:regionId,kind,diameter,...(kind==='four-corner-through'?{offsetX,offsetY}:{})};
 return{request,sourceProfile,targetMetrics};
}
