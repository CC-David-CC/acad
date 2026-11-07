import {solve,point,constraint,sketch} from './reproduce.mjs';
import {writeFileSync} from 'node:fs';
const lock=(x='1',y='2',state='accepted')=>constraint('LockPoint',['p'],{x,y},0,state);
const cases={under:sketch([point('p',1,2)],[[]]),full:sketch([point('p',1,2)],[[lock()]]),redundant:sketch([point('p',1,2)],[[lock(),lock('1','2','redundant')]]),contradictory:sketch([point('p',1,2)],[[lock(),lock('3','2')]]),singular:sketch([point('p',0,0),point('q',0,0)],[[constraint('DistancePP',['p','q'],{distance:'0'})]]),zeroSegment:sketch([{id:'s',type:'Segment',role:null,stage:0,data:{a:{x:0,y:0},b:{x:0,y:0}}}],[[]]),zeroCircle:sketch([{id:'c',type:'Circle',role:null,stage:0,data:{c:{x:0,y:0},r:0}}],[[]])};
const output={};for(const [id,source] of Object.entries(cases)){const result=await solve(source);output[id]={source,result};console.log(id,JSON.stringify({ok:result.ok,localJacobian:result.localJacobian,error:result.error}));}
writeFileSync(new URL('baseline-before.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
