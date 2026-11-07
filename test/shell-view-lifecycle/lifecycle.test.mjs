import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as THREE from 'three';
import {state} from 'lstream';
import {ShellView} from '../../web/app/cad/scene/views/shellView.js';
globalThis.THREE=THREE;
test('disposed shell view stops reacting to retained model location changes',()=>{
 const location=state({setToMatrix4x4(){}}),attributes=state({hidden:false});
 let renders=0;
 const ctx={attributesService:{streams:{get:()=>attributes}},viewer:{requestRender(){renders++}}};
 const model={id:'shell',ext:{},faces:[],edges:[],vertices:[],location$:location};
 for(let i=0;i<20;i++){
  const view=new ShellView(ctx,model);
  const active=renders;location.next({setToMatrix4x4(){}});assert.equal(renders,active+1);
  view.dispose();const stopped=renders;
  location.next({setToMatrix4x4(){}});
  attributes.next({hidden:false});assert.equal(renders,stopped);
  assert.equal(model.ext.view,null);
 }
});
