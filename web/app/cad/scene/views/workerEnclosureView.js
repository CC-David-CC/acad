import {View} from './view';
import {BufferGeometry,BufferAttribute,Mesh,MeshPhongMaterial,Object3D} from 'three';
import {SHELL} from '../../model/entities';
import {setAttribute} from 'scene/objectData';
export class WorkerEnclosureView extends View {
 constructor(ctx,model){
  super(ctx,model);this.rootGroup=new Object3D();this.geometry=new BufferGeometry();
  this.geometry.setAttribute('position',new BufferAttribute(model.copyDisplayPositions(),3));
  // Expanded preview faces use shader-derived flat normals, avoiding a CPU
  // triangle traversal on the UI thread when a large result is published.
  this.material=new MeshPhongMaterial({color:0xaeaeae,shininess:0,flatShading:true});this.mesh=new Mesh(this.geometry,this.material);this.rootGroup.add(this.mesh);
  setAttribute(this.rootGroup,SHELL,this);setAttribute(this.rootGroup,View.MARKER,this);this.rootGroup.matrixAutoUpdate=false;
  this.addDisposer(model.location$.attach(loc=>{loc.setToMatrix4x4(this.rootGroup.matrix);this.rootGroup.matrixWorldNeedsUpdate=true;ctx.viewer.requestRender();}));
  this.addDisposer(ctx.attributesService.streams.get(model.id).attach(attrs=>{this.color=attrs.color??0xaeaeae;this.updateVisuals();}));
 }
 updateVisuals(){if(this.material)this.material.color.set(this.markColor??this.color??0xaeaeae);this.ctx.viewer.requestRender();}
 dispose(){if(this.isDisposed)return;this.geometry.dispose();this.material.dispose();this.rootGroup.clear();super.dispose();}
}
