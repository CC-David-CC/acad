import test from 'node:test';
import assert from 'node:assert/strict';
import {captureLinkedPartDrawingDefinition as capture,LINKED_DRAWING_MAX_BYTES} from '../../modules/drawing/linkedPartDrawingDefinition.mjs';
import {definition} from './fixture.mjs';
const json = value => JSON.stringify(value);
const invalid = (value,code='INVALID_REQUEST') => assert.throws(()=>capture(value),{code});
const frozen = value => {if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));for(const child of Object.values(value))frozen(child);}};

test('synthetic three-view/seven-dimension metadata is detached/frozen; no geometry proof',()=>{
  const input=definition(),before=json(input),out=capture(input);frozen(out);
  assert.equal(json(input),before);assert.equal(out.views.length,3);assert.equal(out.dimensions.length,7);
  assert.equal(out.datum.regionId,'opaque fixture region');assert.notEqual(out.views,input.views);
  input.target.featureId=999;input.dimensions[0].from.curveId='caller mutated';input.views[0].paperOrigin[0]=99;
  assert.equal(out.target.featureId,2);assert.equal(out.dimensions[0].from.curveId,'fixture-bottom');assert.equal(out.views[0].paperOrigin[0],10);
  assert.equal(json(capture(JSON.parse(json(out)))),json(out));
});
test('one to three unique bases in canonical subsequence; zero dimensions incomplete but admissible',()=>{
  for(const names of [['top'],['front'],['right'],['top','right'],['front','right'],['top','front','right']]){
    const d=definition();d.views=d.views.filter(x=>names.includes(x.basis));d.dimensions=[];
    assert.deepEqual(capture(d).views.map(x=>x.basis),names);
  }
  for(const change of [d=>d.views=[],d=>d.views.reverse(),d=>d.views.push({...d.views[0]}),d=>d.views[1].viewId=d.views[0].viewId,d=>d.views[0].basis='custom']){const d=definition();change(d);assert.throws(()=>capture(d));}
});
test('datum-axis components use compatible views; cap separation is not visible in top',()=>{
  for(const [index,axis,view] of [[0,'datum-y','front-view'],[1,'datum-x','right-view'],[4,'datum-x','right-view'],[5,'datum-y','front-view']]){
    const d=definition();d.dimensions[index].axis=axis;d.dimensions[index].viewId=view;invalid(d);
  }
  for(const value of ['u','v','x']){const d=definition();d.dimensions[0].axis=value;invalid(d);}
  const d=definition();d.dimensions[2].viewId='top-view';invalid(d);
  const right=definition();right.dimensions[2].viewId='right-view';capture(right);
});
test('exact reference variants and consistent declared source/native custody',()=>{
  const cases=[
    d=>d.dimensions[0].from.featureId=3,d=>d.dimensions[0].from.faceId='other',d=>d.dimensions[0].from.regionId='other',
    d=>d.dimensions[0].from.point='center',d=>d.dimensions[0].to={...d.dimensions[0].from},
    d=>{d.dimensions[0].to.curveType='circle';d.dimensions[0].to.point='center';},
    d=>d.dimensions[2].second.selectionId=d.dimensions[2].first.selectionId,
    d=>d.dimensions[2].second.geometry='cylinder',d=>d.dimensions[3].hole.sourceFeatureId=2,
    d=>d.dimensions[3].hole.regionId='invented',d=>d.dimensions[3].hole.slot='corner-0',
    d=>d.dimensions[3].hole.featureId=1,d=>d.dimensions[1].dimensionId=d.dimensions[0].dimensionId,
    d=>d.dimensions[0].viewId='missing',d=>d.dimensions[3].measuredValue=10
  ];for(const change of cases){const d=definition();change(d);invalid(d);}
  const line=definition();line.dimensions.push({dimensionId:'line',viewId:'top-view',label:[0,0],kind:'edge-length',edge:{kind:'native-edge',originFeatureId:1,selectionId:'fixture-line',geometry:'line'}});capture(line);
  line.dimensions[7].edge.selectionId='fixture-cap-first';invalid(line);
  const circle=definition();circle.dimensions[0].from={...circle.dimensions[0].from,curveId:'fixture-circle',curveType:'circle',point:'center'};capture(circle);
});
test('bounded physical sheet/scale/identity and finite metadata',()=>{
  for(const change of [d=>d.sheet.width=0,d=>d.sheet.height=10001,d=>d.sheet.scale.numerator=2,d=>d.sheet.scale.denominator=0,
    d=>d.target.featureId=true,d=>d.datum.featureId=Number.MAX_SAFE_INTEGER+1,d=>d.target.engineRevision='sha256:bad',
    d=>d.target.engine='manifold',d=>d.target.output='prefix',d=>d.views[0].paperOrigin=[-0,0],d=>d.views[0].paperOrigin=[298,0],
    d=>d.dimensions[0].label=[0,Infinity],d=>d.title='bad\nlabel',d=>d.drawingId='']){const d=definition();change(d);invalid(d);}
  const d=definition();d.sheet={width:10000,height:10000,scale:{numerator:9999,denominator:10000}};capture(d);
  const max=definition();max.dimensions[0].from.curveId='x'.repeat(256);max.dimensions[0].to.curveId='x'.repeat(256);capture(max);
  max.dimensions[0].to.curveId+='x';invalid(max);
});
test('reject accessors, inherited/nonenumerable/symbol/extras, sparse arrays and custom prototypes without invoking getters',()=>{
  let calls=0;const d=definition();Object.defineProperty(d.target,'engine',{enumerable:true,get(){calls++;throw Error('not called');}});invalid(d);assert.equal(calls,0);
  const variants=[x=>Object.setPrototypeOf(x,{inherited:true}),x=>Object.defineProperty(x,'title',{enumerable:false,value:'x'}),
    x=>x[Symbol('x')]=1,x=>x.nativeHandle='never',x=>x.views[Symbol('x')]=1,x=>delete x.views[0],
    x=>Object.setPrototypeOf(x.views,{0:x.views[0]}),x=>Object.defineProperty(x.views,'0',{enumerable:true,get(){calls++;return {};}}),
    x=>x.dimensions[0].kind={toString(){calls++;return 'source-distance';}},x=>x.views[0].frame={origin:[0,0,0]}];
  for(const change of variants){const x=definition();change(x);invalid(x);}assert.equal(calls,0);
  const cyc=definition();cyc.target=cyc;invalid(cyc);
  const extra=definition();extra.toJSON=()=>{calls++;return {};};invalid(extra);assert.equal(calls,0);
  const changing=definition();let reads=0;
  changing.dimensions[0]=new Proxy(changing.dimensions[0],{getOwnPropertyDescriptor(target,key){const d=Reflect.getOwnPropertyDescriptor(target,key);return key==='kind'?{...d,value:++reads===1?'source-distance':'hole-offset'}:d;}});
  invalid(changing);assert.equal(reads,2);
});
test('UTF-8 exact boundary and one-byte refusal include multibyte metadata',()=>{
  // Long selection IDs are opaque synthetic strings; no native membership claim.
  const d=definition();d.dimensions=[];
  for(let i=0;i<4;i++)d.dimensions.push({dimensionId:'long-'+i,viewId:'top-view',kind:'edge-length',edge:{kind:'native-edge',originFeatureId:1,selectionId:'q'+i+'x'.repeat(14000),geometry:'line'},label:[0,0]});
  const base=new TextEncoder().encode(json(capture(d))).byteLength;
  // Spread padding over admitted opaque IDs, retaining a multibyte last field.
  let delta=LINKED_DRAWING_MAX_BYTES-base;
  for(const row of d.dimensions){const add=Math.min(delta,16384-row.edge.selectionId.length);row.edge.selectionId+='x'.repeat(add);delta-=add;}
  assert.equal(delta,0);assert.equal(new TextEncoder().encode(json(capture(d))).byteLength,65536);
  const unicodeExact=JSON.parse(json(d)),last=unicodeExact.dimensions.at(-1).edge;
  last.selectionId=last.selectionId.slice(0,-2)+'é';
  assert.equal(new TextEncoder().encode(json(capture(unicodeExact))).byteLength,65536);
  last.selectionId+='x';invalid(unicodeExact,'RESOURCE_LIMIT');
  d.dimensions.find(row=>row.edge.selectionId.length<16384).edge.selectionId+='x';invalid(d,'RESOURCE_LIMIT');
  const multi=definition();multi.dimensions=[];
  for(let i=0;i<4;i++)multi.dimensions.push({dimensionId:'unicode-'+i,viewId:'top-view',kind:'edge-length',edge:{kind:'native-edge',originFeatureId:1,selectionId:String(i)+'é'.repeat(8000),geometry:'line'},label:[0,0]});
  capture(multi);multi.dimensions[0].edge.selectionId+='é'.repeat(1000);invalid(multi,'RESOURCE_LIMIT');
});
test('dimension count and forbidden measured/native fields fail admission',()=>{
  const d=definition();d.dimensions=Array.from({length:16},(_,i)=>({...d.dimensions[3],dimensionId:'d'+i}));capture(d);
  d.dimensions.push({...d.dimensions[0],dimensionId:'overflow'});invalid(d,'RESOURCE_LIMIT');
  for(const field of ['measuredValue','frames','handles','sourceSha256','hlrIndex','geometry','tolerance']){const x=definition();x[field]=null;invalid(x);}
});
