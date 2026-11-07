// Real production source/plane/Worker/service. Submit is an ERROR-ONLY boundary:
// no native evaluator or successful publication is supplied.
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {installWindow,drain,lifecycle,requests} from '../source-plane-depth/platform.mjs';
installWindow();const require=createRequire(import.meta.url);
export const api=require('../../.build/source-plane-depth/service.cjs');
export {drain,lifecycle,requests};
export async function source(){const frame=api.sketchBoundaryFrame(api.realPlane('XY',0)),empty=await api.runSketchSolve('/static/sketch.js',{task:'sketch-transition-empty',revision:randomUUID(),unit:'millimeter',frame}),result=await api.runSketchSolve('/static/sketch.js',{task:'sketch-transition-primitive',revision:randomUUID(),sketchJSON:empty.serializedSketch,externalParameters:{},primitive:{id:'agent-primitive-'+randomUUID(),kind:'Circle',role:null,stage:0,data:{c:{x:0,y:0},r:2}}});if(!result.ok)throw Error('Actual source preparation failed');return result.serializedSketch;}
export function counted(signal){const add=signal.addEventListener,remove=signal.removeEventListener,counts={adds:0,removes:0};Object.defineProperties(signal,{addEventListener:{configurable:true,value(...args){counts.adds++;return add.apply(this,args);}},removeEventListener:{configurable:true,value(...args){counts.removes++;return remove.apply(this,args);}}});return counts;}
export function withSubmit(text,error,{prepare=true}={}){
 const f=api.fixture(text);f.api=api.createSourcePlaneDepthCommands(f.ctx,async(yes,no,preparation,intent)=>{f.events.submitted.push({preparation,intent});try{if(prepare){const next={history:structuredClone(f.ctx.craftService.modifications$.value.history),pointer:0};next.history[0].params.depth=intent.afterDepth;await preparation.prepare([api.realPlane('XY',intent.afterDepth)],next);}no(error);}catch(e){no(e);}},()=>f.events.cancelled++);return f;
}
