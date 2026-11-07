// Explicit component requests, not sketches or a second authored document.
const identity={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
export const oblique={origin:[7,11,13],x:[0,1,0],y:[0,0,1],z:[1,0,0]};
const edges=(v,p='e')=>v.map((a,i)=>({kind:'segment',id:p+i,a,b:v[(i+1)%v.length]}));
const circle=(r,id='c',center=[0,0])=>[{kind:'circle',id,center,radius:r}];
const request=(id,outer,holes=[],depth=5,frame=identity)=>({op:'solid.profile.extrude',version:3,unit:'millimeter',frame,depth,region:{id,outer,holes}});
const triangle=[[0,0],[20,0],[0,10]],rotated=[[10,10],[22,26],[14,32],[2,16]],L=[[0,0],[30,0],[30,10],[10,10],[10,30],[0,30]];
const mixed=[[0,0],[60,0],[60,40],[30,20],[0,40]],hole=[[35,5],[45,5],[45,10],[35,10]],mixedHoles=()=>[circle(3,'circle-hole',[15,15]),edges(hole,'hole')];
export const cases=[
 {id:'triangle',request:request('triangle',edges(triangle)),volume:500,bounds:{min:[0,0,0],max:[20,10,5]},material:[[2,2,2.5]],void:[[19,9,2.5]]},
 {id:'reversed-triangle',request:request('reversed-triangle',edges([...triangle].reverse(),'reverse-edge')),volume:500,bounds:{min:[0,0,0],max:[20,10,5]},material:[[2,2,2.5]],void:[[19,9,2.5]]},
 {id:'rotated-rectangle',request:request('rotated',edges(rotated),[],7),volume:1400,bounds:{min:[2,10,0],max:[22,32,7]},material:[[12,21,3]],void:[[2,32,3]]},
 {id:'concave-L',request:request('L',edges(L)),volume:2500,bounds:{min:[0,0,0],max:[30,30,5]},material:[[5,20,2.5]],void:[[20,20,2.5]]},
 {id:'mixed-holes',request:request('mixed',edges(mixed),mixedHoles(),7),volume:(1750-9*Math.PI)*7,bounds:{min:[0,0,0],max:[60,40,7]},material:[[5,5,3]],void:[[15,15,3],[40,7,3],[30,30,3]]},
 {id:'oblique-mixed-holes',request:request('oblique-mixed',edges(mixed),mixedHoles(),7,oblique),volume:(1750-9*Math.PI)*7,bounds:{min:[7,11,13],max:[14,71,53]},material:[[10,16,18]],void:[[10,26,28],[10,51,20],[10,41,43]]},
 {id:'annulus',request:request('annulus',circle(10,'outer'),[circle(3,'inner')],7),volume:637*Math.PI,bounds:{min:[-10,-10,0],max:[10,10,7]},material:[[5,0,3]],void:[[0,0,3],[11,0,3]]},
];
const s=Math.SQRT1_2,angled={origin:[7,11,13],x:[s,s,0],y:[0,0,1],z:[s,-s,0]};
cases.push({id:'angled-triangle',request:request('angled',edges(triangle),[],5,angled),volume:500,bounds:{min:[7,11-5*s,13],max:[7+25*s,11+20*s,23]},material:[[7+4.5*s,11-0.5*s,15]],void:[[7+21.5*s,11+16.5*s,22]]});
for(const c of cases){const p=c.material[0],f=c.request.frame,t=p.reduce((sum,n,i)=>sum+(n-f.origin[i])*f.z[i],0);c.boundary=[p.map((n,i)=>n-t*f.z[i])];}
export const invalidRequests=[
 {id:'crossing',request:request('crossing',edges([[0,0],[10,10],[0,10],[10,0]]))},
 {id:'zero-edge',request:request('zero-edge',edges([[0,0],[10,0],[10,0],[0,10]]))},
 {id:'outside-hole',request:request('outside-hole',edges(triangle),[circle(1,'outside',[50,50])])},
 {id:'zero-depth',request:{...request('zero-depth',edges(triangle)),depth:0}},
 {id:'left-handed-frame',request:request('left-handed',edges(triangle),[],5,{...identity,z:[0,0,-1]})},
];
