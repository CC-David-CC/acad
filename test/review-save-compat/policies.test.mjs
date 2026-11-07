import {test} from 'node:test';import assert from 'node:assert/strict';
import {prepareTypedDependentSketch} from '../../web/app/sketcher/headless/typedDependentSketch.mjs';
import {discoverTypedSketchConsumers} from '../../web/app/cad/parameters/discoverTypedSketchConsumers.mjs';
import {registeredResidualProfile} from '../../web/app/sketcher/headless/registeredConstraintPolicy.mjs';
import {inspectCarriedCurve} from '../../web/app/sketcher/headless/carriedCurvePolicy.mjs';
const sketch=(schema,field,value)=>({constants:'',stages:[{constraints:[{typeId:schema,constants:{[field]:value}}]}]});
const inspect=value=>discoverTypedSketchConsumers([{id:'face'}],()=>JSON.stringify(value));
test('typed evaluation and discovery share explicit boolean fields and literal semantics',()=>{
 for(const [schema,field]of [['DistancePL','inverted'],['TangentLC','inverted'],['Fillet','inverted1'],['Fillet','inverted2']]){
  for(const value of [true,false,'true','false']){const s=sketch(schema,field,value),before=JSON.stringify(s);assert.deepEqual({...prepareTypedDependentSketch(s,()=>{throw Error('No name lookup')})},{});assert.deepEqual(inspect(s),[]);assert.equal(JSON.stringify(s),before);}
  for(const value of [0,1,'flag','1','false + true',' true ','false ',null]){const s=sketch(schema,field,value);assert.throws(()=>prepareTypedDependentSketch(s,()=>1));assert.throws(()=>inspect(s));}
 }
 for(const s of [sketch('SegmentLength','length',true),sketch('Fillet','unknown',false),sketch('Unknown','inverted','false')]){assert.throws(()=>prepareTypedDependentSketch(s,()=>1));assert.throws(()=>inspect(s));}
});
test('squared equations report mm errors and angle/mixed residuals retain radian thresholds',()=>{
 const c={schema:{id:'DistancePP'},objects:[{x:0,y:0},{x:1000,y:0}],resolvedConstants:{distance:1000}},p=registeredResidualProfile(c,[.0015]);assert.equal(p.unit,'millimeter');assert.equal(p.residuals[0],.0015/2000);assert.ok(p.residuals[0]<p.tolerances[0]);
 const a=registeredResidualProfile({schema:{id:'Angle'}},[1e-7]);assert.equal(a.unit,'radian');assert.ok(a.residuals[0]>a.tolerances[0]);
 const t=registeredResidualProfile({schema:{id:'TangentLineBezier'},params:Array.from({length:13},(_,i)=>({get:()=>i===11?10:0}))},[0,0,0,0,1e-7,0]);assert.equal(t.unit,'mixed');assert.equal(t.units[4],'radian');assert.equal(t.tolerances[4],1e-8);assert.equal(t.tolerances[5],1e-6);
});
test('curve preflight keeps explicit forms/child identities and rejects unknown/degenerate data',()=>{
 const e={c:{x:0,y:0},rx:5,ry:3,rot:0};assert.deepEqual(inspectCarriedCurve('Ellipse',e),[[':C','Point']]);assert.deepEqual(inspectCarriedCurve('Ellipse',{ep1:{x:-5,y:0},ep2:{x:5,y:0},r:3}),[[':C','Point']]);
 for(const d of [{...e,hiddenIntent:true},{...e,rx:0},{...e,ry:Infinity}])assert.throws(()=>inspectCarriedCurve('Ellipse',d));assert.throws(()=>inspectCarriedCurve('EllipticalArc',{...e,a:{x:6,y:0},b:{x:0,y:3}}));
 const b={cp1:{x:0,y:0},cp2:{x:0,y:0},cp3:{x:10,y:0},cp4:{x:20,y:0}};assert.equal(inspectCarriedCurve('BezierCurve',b).length,6);assert.throws(()=>inspectCarriedCurve('BezierCurve',Object.fromEntries(Object.keys(b).map(k=>[k,{x:0,y:0}]))));
});
