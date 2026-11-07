// Explicit solved component requests. These IDs are supplied to the real V3
// extrusion; they are not a public sketch-authoring or native-save fixture.
export const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
export const sourceIds=['plate-bottom','plate-right','plate-top','plate-left'];
export function polygon(vertices,ids){return vertices.map((a,i)=>({kind:'segment',id:ids[i],a,b:vertices[(i+1)%vertices.length]}));}
export function rectangle(width=100,height=50,depth=20){return {op:'solid.profile.extrude',version:3,unit:'millimeter',frame,depth,region:{id:'mechanical-component-plate',outer:polygon([[0,0],[width,0],[width,height],[0,height]],sourceIds),holes:[]}};}
export const fixtures=[{id:'plate-100x50x20',width:100,height:50,depth:20,request:rectangle()},{id:'regenerated-150x30x12',width:150,height:30,depth:12,request:rectangle(150,30,12)}];
export const pairs={fillet:[['plate-bottom','plate-left'],['plate-right','plate-top']],chamfer:[['plate-bottom','plate-right'],['plate-left','plate-top']]};
export const circle={op:'solid.profile.extrude',version:3,unit:'millimeter',frame,depth:20,region:{id:'circle-component',outer:[{kind:'circle',id:'actual-circle',center:[0,0],radius:10}],holes:[]}};
export const splitTangent={op:'solid.profile.extrude',version:3,unit:'millimeter',frame,depth:20,region:{id:'split-straight-component',outer:polygon([[0,0],[50,0],[100,0],[100,50],[0,50]],['split-a','split-b','split-right','split-top','split-left']),holes:[]}};
