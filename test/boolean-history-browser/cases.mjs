// Explicit solved component profiles, not native B-rep/model/history seeds.
export const frame=(z=0)=>({origin:[0,0,z],x:[1,0,0],y:[0,1,0],z:[0,0,1]});
export const sourceIds=['outer-bottom','outer-right','outer-top','outer-left'];
export function rectangle(region,width,height,depth,origin=[0,0],z=0){const [x,y]=origin,vs=[[x,y],[x+width,y],[x+width,y+height],[x,y+height]];return{op:'solid.profile.extrude',version:3,unit:'millimeter',frame:frame(z),depth,region:{id:region,outer:vs.map((a,i)=>({kind:'segment',id:sourceIds[i],a,b:vs[(i+1)%4]})),holes:[]}};}
export function plate(width,height,depth=20){const centers=[[width/2,height/2],[8,8],[width-8,8],[width-8,height-8],[8,height-8]];return{id:`plate-${width}x${height}`,width,height,depth,baseFeatureId:10,base:rectangle('plate-region',width,height,depth),tools:centers.map((center,i)=>({featureId:20+i,cutFeatureId:30+i,center,radius:i?2:5,request:{op:'solid.profile.extrude',version:3,unit:'millimeter',frame:frame(-1),depth:depth+2,region:{id:'hole-region-'+i,outer:[{kind:'circle',id:'hole-circle-'+i,center,radius:i?2:5}],holes:[]}}}))};}
export const fixtures=[plate(100,50),plate(150,30)];
export const filletPairs=[[sourceIds[0],sourceIds[3]],[sourceIds[1],sourceIds[2]]];
export const chamferPairs=[[sourceIds[0],sourceIds[1]],[sourceIds[2],sourceIds[3]]];
export const controls={a:rectangle('control-a',10,10,10),b:rectangle('control-b',10,10,10,[20,0]),c:rectangle('control-c',5,5,5,[40,0]),cut:rectangle('control-cut',5,10,12,[0,0],-1),identical:rectangle('control-identical',10,10,10)};
