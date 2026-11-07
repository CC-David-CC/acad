// Hand-authored component source data, never a solver-success fixture.
import {createHash} from 'node:crypto';
import {captureSolvedPolygonSource} from '../../modules/engine/extrusion/selectedSketchProfile.mjs';
export async function sweepSourceFixture(){
 const hash=text=>createHash('sha256').update(text).digest('hex');
 const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},pathFrame={origin:[0,0,0],x:[1,0,0],y:[0,0,1],z:[0,-1,0]};
 const sketch=(f,objects)=>JSON.stringify({version:3,objects,stages:[{constraints:[],generators:[]}],metadata:{boundaryFrame:f}});
 const profileJSON=sketch(frame,[{id:'circle',type:'Circle',role:null,stage:0,data:{c:{x:0,y:0},r:2}}]);
 const profile={unit:'millimeter',engine:'occ',profileVersion:3,revision:'same-state',sketchDigest:hash(profileJSON),faceId:'section',frame,sketchJSON:profileJSON};
 const context=await captureSolvedPolygonSource(profile),regionId='sketch-region:'+JSON.stringify(context.regions[0]);
 const pathJSON=sketch(pathFrame,[{id:'line',type:'Segment',role:null,stage:0,data:{a:{x:0,y:0},b:{x:0,y:10}}}]);
 return{profile:{...profile,regionId},path:{unit:'millimeter',revision:'same-state',sketchDigest:hash(pathJSON),faceId:'spine',frame:pathFrame,sketchJSON:pathJSON,pathCurves:[{curveId:'line',reversed:false}]},transport:'corrected-frenet'};
}
