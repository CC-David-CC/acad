// Independent analytic component fixtures; declared source IDs/digests are
// test labels, not authored source-membership certificates.
import {request,polygon} from './fixtures.mjs';
const clone=structuredClone,curves=p=>p.map((a,i)=>({kind:'segment',id:'edge-'+i,a,b:p[(i+1)%p.length]}));
const bounds=(min,max)=>({min,max});
function item(name,r,volume,b,points=[]){return{name,request:r,expected:{volume,bounds:b},points};}
const rect=request(),circle=request('circle'),cases=[item('rectangle-taper',rect,3500,bounds([-10,-5,0],[10,5,30]),[[[0,0,15],0],[[8,0,29],1],[[10,0,0],2]])];
let r=clone(rect);r.sections[1].region.outer=polygon(10,20);cases.push(item('nonhomothetic-rectangle',r,6500,bounds([-10,-10,0],[10,10,30]),[[[0,0,15],0],[[9,9,15],1]]));
r=clone(rect);r.sections[1].frame.origin[2]=45;cases.push(item('separation-edit',r,5250,bounds([-10,-5,0],[10,5,45])));
r=clone(rect);for(const s of r.sections)s.region.outer=polygon(s===r.sections[0]?20:10,s===r.sections[0]?10:5,true);cases.push(item('clockwise-source',r,3500,bounds([-10,-5,0],[10,5,30])));
r=clone(rect);r.sections.reverse();cases.push(item('section-order-reversed',r,3500,bounds([-10,-5,0],[10,5,30])));
r=clone(rect);for(const s of r.sections){s.frame.origin[0]=123;s.frame.origin[1]=-70;s.frame.origin[2]+=9;}cases.push(item('translated',r,3500,bounds([113,-75,9],[133,-65,39]),[[[123,-70,24],0],[[134,-70,24],1]]));
r=clone(rect);for(const s of r.sections){const z=s.frame.origin[2];s.frame={origin:[z,0,0],x:[0,1,0],y:[0,0,1],z:[1,0,0]};}cases.push(item('permuted-frame',r,3500,bounds([0,-10,-5],[30,10,5]),[[[15,0,0],0]]));
const triangle=[[0,0],[20,0],[0,10]],ell=[[0,0],[20,0],[20,5],[5,5],[5,20],[0,20]];
for(const[name,p,area,b,points]of [['triangle',triangle,100,bounds([0,0,0],[20,10,30]),[[[2,2,15],0],[[8,6,15],1]]],['concave-L',ell,175,bounds([0,0,0],[20,20,30]),[[[2,2,15],0],[[10,10,15],1]]]]){r=clone(rect);r.sections.forEach((s,i)=>s.region.outer=curves(p.map(a=>a.map(v=>v*(i?.5:1)))));cases.push(item(name,r,area*30*7/12,b,points));}
cases.push(item('circle-frustum',circle,280*Math.PI,bounds([-4,-4,0],[4,4,30]),[[[0,0,15],0],[[3,0,29],1],[[4,0,0],2]]));
r=clone(circle);r.correspondence.startA=r.correspondence.startB=Math.PI/3;cases.push(item('circle-explicit-seams',r,280*Math.PI,bounds([-4,-4,0],[4,4,30])));
r=clone(circle);r.correspondence.startB=Math.PI/2;cases.push(item('circle-quarter-seam-ruled',r,200*Math.PI,bounds([-4,-4,0],[4,4,30]),[[[0,0,15],0],[[2.8,0,15],1]]));
r=clone(circle);r.correspondence.reverseA=r.correspondence.reverseB=true;cases.push(item('circle-reversed-traversal',r,280*Math.PI,bounds([-4,-4,0],[4,4,30])));
const refusals=[];function refusal(name,mutate,code,phase){const x=clone(rect);mutate(x);refusals.push({name,request:x,code,phase});}
refusal('coincident-sections',x=>x.sections[1].frame.origin[2]=0,'LOFT_COINCIDENT_SECTIONS','native');
refusal('nonparallel-sections',x=>x.sections[1].frame={origin:[0,0,30],x:[1,0,0],y:[0,0,1],z:[0,-1,0]},'LOFT_UNSUPPORTED_SECTION_PLANES','native');
refusal('invalid-start',x=>x.correspondence.startA=.5,'LOFT_INVALID_CORRESPONDENCE','preparation');
refusal('invalid-frame',x=>x.sections[1].frame.x=[2,0,0],'INVALID_FRAME','preparation');
refusal('open-profile',x=>x.sections[0].region.outer[0].b=[1,1],'OPEN_OR_AMBIGUOUS_PROFILE','preparation');
refusal('twisted-correspondence',x=>x.correspondence.reverseB=true,'LOFT_SELF_INTERFERENCE','native');
export{cases,refusals};
