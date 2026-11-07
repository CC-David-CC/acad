// Explicit native-v3 fixtures, not solver admission or public authoring.
export const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
export const circle=(id,r,x=0,y=0)=>({id,type:'Circle',role:null,stage:0,data:{c:{x,y},r}});
export function rectangle(id,x,y,w,h){const p=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];return p.map((a,i)=>({id:id+i,type:'Segment',role:null,stage:0,data:i%2?{a:p[(i+1)%4],b:a}:{a,b:p[(i+1)%4]}}));}
export function regionId(faceId,outer,holes=[]){return'sketch-region:'+JSON.stringify({faceId,outer:outer.map(id=>faceId+'/'+id).sort(),holes:holes.map(ids=>ids.map(id=>faceId+'/'+id).sort()).sort((a,b)=>JSON.stringify(a)<JSON.stringify(b)?-1:1)});}
export const ids=objects=>objects.map(o=>o.id);
export async function request(objects,overrides={}){
 const f=structuredClone(overrides.frame||frame),source={version:3,objects:structuredClone(objects),stages:[{constraints:[],generators:[]}],metadata:{boundaryFrame:f},...(overrides.source||{})},sketchJSON=JSON.stringify(source),bytes=new TextEncoder().encode(sketchJSON),digest=await crypto.subtle.digest('SHA-256',bytes);
 return{unit:'millimeter',engine:'occ',revision:'current',sketchDigest:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''),faceId:'plane',frame:f,depth:5,sketchJSON,...overrides.input};
}
export function holeLimitFixture(){return[...rectangle('outer',0,0,100,100),...Array.from({length:9},(_,i)=>circle('hole'+i,2,10+20*(i%3),10+20*Math.floor(i/3)))];}
