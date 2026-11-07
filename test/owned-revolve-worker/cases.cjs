const crypto=require('node:crypto'),native=require('./native-input-cases.cjs');
function request(c){
 const v=c.values,f={origin:v.slice(1,4),x:v.slice(4,7),y:v.slice(7,10),z:v.slice(10,13)};let at=14;const loops=[];
 for(let i=0;i<v[13];i++){const kind=v[at++];if(kind===1){loops.push([{kind:'circle',id:'loop'+i+'-circle',center:v.slice(at,at+2),radius:v[at+2]}]);at+=3;}else{if(kind!==2)throw Error('Unexpected fixture');const n=v[at++],points=[];for(let j=0;j<n;j++){points.push(v.slice(at,at+2));at+=2;}loops.push(points.map((a,j)=>({kind:'segment',id:'loop'+i+'-edge'+j,a,b:points[(j+1)%n]})));}}
 if(at!==v.length)throw Error('Fixture payload incomplete');const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0),delta=c.axis.slice(0,3).map((n,i)=>n-f.origin[i]),a=[dot(delta,f.x),dot(delta,f.y)],d=[dot(c.axis.slice(3),f.x),dot(c.axis.slice(3),f.y)];
 return{op:'solid.profile.revolve',version:1,unit:'millimeter',source:{faceId:'component-source-face',sourceSha256:crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')},frame:f,region:{id:'component-selected-region',outer:loops[0],holes:loops.slice(1)},axis:{kind:'source-segment',id:'component-source-axis',a,b:a.map((n,i)=>n+d[i])},angleRadians:c.angle};
}
module.exports={cases:native.cases.map(c=>({...c,request:request(c)})),refusals:native.refusals.filter(c=>!['off-plane-origin','off-plane-direction','bad-version','bad-profile'].includes(c.name)).map(c=>({...c,request:request(c)}))};
