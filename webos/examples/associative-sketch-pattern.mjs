// Actual public authoring only. No source seeds or caller-generated output IDs.
export function createAssociativeSketchPatternExample({execute}){
 if(typeof execute!=='function')throw Error('A current CAD public command executor is required.');
 const call=(id,args={})=>execute(id,args),one=(rows,label)=>{if(rows.length!==1)throw Error('One '+label+' required.');return rows[0];};
 async function inspect(faceId){const i=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:i.revision,faceId});}
 async function patterns(faceId){const i=await call('inspect-closed-sketches');return call('inspect-sketch-patterns',{revision:i.revision,faceId});}
 return Object.freeze({
  async createSource(){const f=await call('inspect-source-frames'),source=await call('create-source-frame',{revision:f.revision,unit:'millimeter',parent:null,placement:{kind:'basis',frame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]}}}),faceId=source.faceId,roots=[];for(const[kind,data]of [['Point',{x:3,y:4}],['Segment',{a:{x:0,y:0},b:{x:2,y:1}}],['Circle',{c:{x:2,y:8},r:1}],['Arc',{a:{x:1,y:15},b:{x:-1,y:15},c:{x:0,y:15},branch:'proper-ccw'}]]){const i=await inspect(faceId),r=await call('append-sketch-primitive',{revision:i.revision,faceId,stage:i.stageCount-1,role:null,kind,data});roots.push({id:r.primitive.id,type:kind});}return Object.freeze({source,faceId,roots});},
  async create(b,{count=4,step={x:10,y:0}}={}){const i=await patterns(b.faceId),ids=b.roots.map(o=>o.id);if(ids.some(id=>!i.sources.some(s=>s.id===id&&s.canPattern)))throw Error('Original owned roots are not eligible.');return call('create-sketch-pattern',{revision:i.revision,faceId:b.faceId,sourceIds:ids,count,step});},
  async edit(b,p,{count,step}){const i=await patterns(b.faceId),row=one(i.patterns.filter(r=>r.outputId===p.pattern.outputId),'original current pattern');return call('edit-sketch-pattern',{revision:i.revision,faceId:b.faceId,outputId:row.outputId,count,step});},
  async remove(b,p){const i=await patterns(b.faceId),row=one(i.patterns.filter(r=>r.outputId===p.pattern.outputId),'original pattern');return call('remove-sketch-pattern',{revision:i.revision,faceId:b.faceId,outputId:row.outputId});},
  async movePoint(b,x,y){const i=await inspect(b.faceId),root=one(b.roots.filter(o=>o.type==='Point'),'original Point'),p=one(i.points.filter(p=>p.id===root.id),'actual Point');return call('edit-closed-sketch-point',{revision:i.revision,faceId:b.faceId,id:p.id,x,y});},
  inspect,patterns,travel:async direction=>{const j=await call('inspect-authored-edits');return call('travel-authored-edit',{revision:j.revision,direction});}
 });
}
