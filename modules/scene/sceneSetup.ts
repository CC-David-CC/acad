import DPR from 'dpr';
import './utils/threeLoader';
import './utils/vectorThreeEnhancement';
import {CADTrackballControls} from './controls/CADTrackballControls';
import {
  AmbientLight,
  Box3,
  DirectionalLight,
  Euler,
  Matrix4,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector3,
  WebGLRenderer
} from "three";
import {Emitter, stream} from "lstream";
import {Camera} from "three/src/cameras/Camera";

export default class SceneSetUp {
  workingSphere: number;
  container: HTMLElement;
  scene: Scene;
  rootGroup: Object3D;
  oCamera: OrthographicCamera;
  pCamera: PerspectiveCamera;
  camera: Camera;
  light: DirectionalLight;
  renderer: WebGLRenderer;
  private _prevContainerWidth: number;
  private _prevContainerHeight: number;
  trackballControls: CADTrackballControls;
  viewportSizeUpdate$ = stream();
  sceneRendered$: Emitter<any> = stream();

  renderRequested: boolean;
  private animationFrame: number | null = null;
  private disposed = false;

  constructor(container) {
    
    this.workingSphere = 10000;
    this.container = container;
    this.scene = new Scene();
    this.rootGroup = this.scene;
    this.scene.userData.sceneSetUp = this;
    this.renderRequested = false;

    this.setUpCamerasAndLights();
    this.setUpControls();

    this.animate();
  }

  aspect() {
    return this.container.clientWidth / this.container.clientHeight;
  }

  requestRender() {
    if (this.disposed) return;
    this.renderRequested = true;
  }

  createOrthographicCamera() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const factor = ORTHOGRAPHIC_CAMERA_FACTOR;
    this.oCamera = new OrthographicCamera(-width / factor,
      width / factor,
      height / factor,
      -height / factor, 0.1, 1000000);
    this.oCamera.position.z = 1000;
    this.oCamera.position.x = -1000;
    this.oCamera.position.y = 300;
  }

  createPerspectiveCamera() {
    this.pCamera = new PerspectiveCamera( 60, this.aspect(), 0.1, 1000000 );
    this.pCamera.position.z = 1000;
    this.pCamera.position.x = -1000;
    this.pCamera.position.y = 300;
  }

  setUpCamerasAndLights() {
    this.createOrthographicCamera();
    this.createPerspectiveCamera();

    this.camera = this.pCamera;
    
    this.light = new DirectionalLight( 0xffffff );
    this.light.position.set( 10, 10, 10 );
    this.scene.add(this.light);

    this.scene.add( new AmbientLight( 0xffffff, 0.25 ) );

    this.renderer = new WebGLRenderer();
    this.renderer.setPixelRatio(DPR);
    this.renderer.setClearColor(0x808080, 1);
    this.renderer.setSize( this.container.clientWidth,  this.container.clientHeight );
    this.container.appendChild( this.renderer.domElement );
  }
  
  updateViewportSize() {
    if (this.disposed) return;
    if (this.container.clientWidth > 0 && this.container.clientHeight > 0) {
      this.updatePerspectiveCameraViewport();
      this.updateOrthographicCameraViewport();
      this.renderer.setSize( this.container.clientWidth, this.container.clientHeight );
      this.viewportSizeUpdate$.next();
      this.__render_NeverCallMeFromOutside();
    }
  }

  updateViewportSizeIfNeeded() {
    if (this.disposed) return;
    if (this._prevContainerWidth !== this.container.clientWidth || 
        this._prevContainerHeight !== this.container.clientHeight) {
      this.updateViewportSize();
      this._prevContainerWidth = this.container.clientWidth;
      this._prevContainerHeight = this.container.clientHeight;
    }
  }

  updatePerspectiveCameraViewport() {
    this.pCamera.aspect = this.aspect();
    this.pCamera.updateProjectionMatrix();
  }

  updateOrthographicCameraViewport() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const factor = ORTHOGRAPHIC_CAMERA_FACTOR;
    this.oCamera.left = - width / factor;
    this.oCamera.right = width / factor;
    this.oCamera.top = height / factor;
    this.oCamera.bottom = - height / factor;
    this.oCamera.updateProjectionMatrix();
  }

  syncCameras(sourceCamera, targetCamera) {
    const camPosition = new Vector3();
    const camRotation = new Euler();
    const tempMatrix = new Matrix4();

    camPosition.setFromMatrixPosition( targetCamera.matrixWorld );
    camRotation.setFromRotationMatrix( tempMatrix.extractRotation( targetCamera.matrixWorld ) );
    const camDistance = sourceCamera.position.length();

    sourceCamera.up.copy(this.camera.up);
    sourceCamera.position.copy(camPosition);
    sourceCamera.quaternion.copy(camPosition);
    sourceCamera.position.normalize();
    sourceCamera.position.multiplyScalar(camDistance);
  }

  setCamera(camera) {
    this.syncCameras(camera, this.camera);
    this.camera = camera;
    this.trackballControls.setCameraMode(camera.isOrthographicCamera);
    this.trackballControls.object = camera;
    this.requestRender();
  }

  setUpControls() {
    // Camera gestures suppress the browser's default mouse focus. Keep the
    // viewport keyboard-focusable so shortcuts follow the user's interaction
    // into an embedded CAD document, without focusing an editable field.
    this.renderer.domElement.tabIndex = 0;
    //  controls = new THREE.OrbitControls( camera , renderer.domElement);
    const trackballControls: any = new CADTrackballControls(this.camera , this.renderer.domElement);

    // document.addEventListener( 'mousemove', function(){

    //   controls.update();

    // }, false );
    trackballControls.rotateSpeed = 3.8 * DPR;
    trackballControls.projectionZoomSpeed = 0.5 * DPR;
    trackballControls.zoomSpeed = 1.2 * DPR;
    trackballControls.panSpeed = 0.3 * DPR;

    trackballControls.noZoom = false;
    trackballControls.noPan = false;

    trackballControls.staticMoving = true;
    trackballControls.dynamicDampingFactor = 0.3;

    trackballControls.keys = [ 65, 83, 68 ];
    this.trackballControls = trackballControls;
  }

  createRaycaster(viewX, viewY) {
    const raycaster = new Raycaster();
    raycaster.params.Line.threshold = 12 * (this._zoomMeasure() * 0.8);

    (raycaster.params as any).Line2 = {
      threshold: 20
    };

    const x = ( viewX / this.container.clientWidth ) * 2 - 1;
    const y = - ( viewY / this.container.clientHeight ) * 2 + 1;

    const mouse = new Vector3( x, y, 1 );
    raycaster.setFromCamera( mouse, this.camera );
    return raycaster;
  }
  
  raycast(event, objects, logInfoOut = null) {
    const raycaster = this.createRaycaster(event.offsetX, event.offsetY);
    if (logInfoOut !== null) {
      logInfoOut.ray = raycaster.ray
    }

    const intersects = [];

    function intersectObject(object) {

      object.raycast( raycaster, intersects );

      const children = object.children;

      if (object.visible) {
        for ( let i = 0, l = children.length; i < l; i ++ ) {
          intersectObject(children[ i ]);
        }
      }
    }

    objects.forEach(intersectObject);

    intersects.sort((a, b) => {
      if (Math.abs(a.distance - b.distance) < 0.01 && (a.object.raycastPriority || b.object.raycastPriority)) {
        return b.object.raycastPriority||0 - a.object.raycastPriority||0;
      }
      return a.distance - b.distance;
    })
    return intersects;
  }

  customRaycast(from3, to3, objects) {
    const raycaster = new Raycaster();
    // Screen-width line picking needs the current camera, even for a supplied ray.
    raycaster.camera = this.camera;
    const from = new Vector3().fromArray(from3);
    const to = new Vector3().fromArray(to3);
    const dir = to.sub(from);
    const dist = dir.length();
    raycaster.set(from, dir.normalize());
    return raycaster.intersectObjects(objects, true ).filter(h => h.distance <= dist);
  }
  
  modelToScreen(pos) {
    const width = this.container.clientWidth, height = this.container.clientHeight;
    const widthHalf = width / 2, heightHalf = height / 2;

    const vector = new Vector3();
    vector.copy(pos);
    vector.project(this.camera);

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;
    return vector;
  }
  
  // Presentation only, explicitly requested; source planes/axes never enter
  // these authenticated solid bounds. No scene/triangle traversal is needed.
  fitBounds(bounds: Readonly<{min:readonly number[];max:readonly number[]}>) {
    const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
    const camera:any=this.camera,controls:any=this.trackballControls;
    if(this.disposed||!this.container.isConnected||!controls.enabled||controls.object!==camera)fail('UNAVAILABLE','The modeling viewport is unavailable.');
    if(controls.hasActiveGesture())fail('VIEW_INTERACTION_ACTIVE','Finish the current camera gesture before fitting solids.');
    const width=this.container.clientWidth,height=this.container.clientHeight;
    if(!(width>0&&height>0))fail('UNAVAILABLE','The modeling viewport has no visible area.');
    if(!bounds||bounds.min.length!==3||bounds.max.length!==3||bounds.min.some((n,i)=>!Number.isFinite(n)||!Number.isFinite(bounds.max[i])||n>bounds.max[i]))fail('INVALID_REQUEST','Expected finite ordered viewing bounds.');
    const middle=bounds.min.map((n,i)=>n/2+bounds.max[i]/2);
    const center=new Vector3(middle[0],middle[1],middle[2]);
    const radius=Math.hypot(...bounds.min.map((n,i)=>(bounds.max[i]-n)/2));
    const direction=new Vector3().subVectors(camera.position,controls.target),up=camera.up;
    if(!(radius>0&&Number.isFinite(radius))||![direction.x,direction.y,direction.z,up.x,up.y,up.z,center.x,center.y,center.z].every(Number.isFinite)||direction.length()===0||new Vector3().crossVectors(direction,up).length()===0)fail('UNAVAILABLE','The current camera or bounds cannot define a finite solid view.');
    const oldDistance=direction.length(),padding=1.15,padded=radius*padding,aspect=width/height;
    direction.normalize();let distance:number,zoom:number=camera.zoom;
    if(!Number.isFinite(zoom)||zoom<=0||camera.view?.enabled)fail('UNAVAILABLE','The current camera projection is unsupported for fitting.');
    if(camera.isPerspectiveCamera){
      const vertical=Math.atan(Math.tan(camera.fov*Math.PI/360)/zoom),horizontal=Math.atan(Math.tan(vertical)*aspect),angle=Math.min(vertical,horizontal);
      if(!(angle>0&&angle<Math.PI/2))fail('UNAVAILABLE','The current perspective projection cannot fit finite solids.');
      distance=padded/Math.sin(angle);
    }else if(camera.isOrthographicCamera){
      zoom=Math.min(width,height)/ORTHOGRAPHIC_CAMERA_FACTOR/padded;
      distance=Math.max(oldDistance,2*padded);
    }else fail('UNAVAILABLE','The current camera type cannot fit solids.');
    // Retain existing manual zoom range; expand clipping only where fitting
    // needs it (not a new geometry or precision tolerance).
    const near=Math.min(camera.near,(distance-radius)/2),far=Math.max(camera.far,distance+2*padded),position=center.clone().addScaledVector(direction,distance);
    if(![zoom,distance,near,far,position.x,position.y,position.z].every(Number.isFinite)||zoom<=0||near<=0||far<=near||distance<controls.minDistance||distance>controls.maxDistance)fail('UNAVAILABLE','The solid bounds exceed finite camera projection limits.');
    // All refusal predicates precede these camera/control-only assignments.
    if(camera.isPerspectiveCamera)camera.aspect=aspect;
    else{camera.left=-width/ORTHOGRAPHIC_CAMERA_FACTOR;camera.right=width/ORTHOGRAPHIC_CAMERA_FACTOR;camera.top=height/ORTHOGRAPHIC_CAMERA_FACTOR;camera.bottom=-height/ORTHOGRAPHIC_CAMERA_FACTOR;}
    camera.zoom=zoom;camera.near=near;camera.far=far;
    camera.position.copy(position);controls.target.copy(center);
    camera.updateProjectionMatrix();controls.syncExplicitView();camera.updateMatrixWorld(true);
    this.requestRender();
    return Object.freeze({mode:camera.isPerspectiveCamera?'PERSPECTIVE':'ORTHOGRAPHIC',position:Object.freeze(position.toArray()),target:Object.freeze(center.toArray()),up:Object.freeze(camera.up.toArray()),zoom,near,far,padding});
  }

  lookAtObject(obj) {
    const camera = this.camera;

    const box = new Box3();
    box.setFromObject(obj);
    const size = box.getSize(new Vector3());
    //this.camera.position.set(0,0,0);

    box.getCenter(camera.position);
    const maxSize = Math.max(size.x, size.z);
    camera.position.addScaledVector(camera.position.normalize(), 5000);
    //this.camera.position.sub(new THREE.Vector3(0, 0, dist));
    camera.up = new Vector3(0, 1, 0);
  }

  _zoomMeasure() {
    return this.trackballControls.object.position.length() / 1e3;
  }
  
  animate() {
    if (this.disposed) return;
    this.animationFrame = requestAnimationFrame( () => this.animate() );
    const controlsChangedViewpoint = this.trackballControls.evaluate();
    if (controlsChangedViewpoint || this.renderRequested) {
      this.__render_NeverCallMeFromOutside();
    }
    this.updateViewportSizeIfNeeded();
  }

  private __render_NeverCallMeFromOutside() {
    if (this.disposed) return;
    this.renderRequested = false;
    this.light.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
    this.renderer.render(this.scene, this.camera);
    this.sceneRendered$.next();
  }

  domElement() {
    return this.renderer.domElement;   
  }

  dispose() {
    if (this.disposed) return;
    // Revoke work before callbacks run: cancellation can race an already
    // delivered frame, and child cleanup can reenter presentation methods.
    this.disposed = true;
    this.renderRequested = false;
    const frame = this.animationFrame;
    this.animationFrame = null;
    const failures = [];
    for (const release of [
      () => { if (frame !== null) cancelAnimationFrame(frame); },
      () => { this.trackballControls.enabled = false; this.trackballControls.dispose(); },
      () => this.renderer.dispose(),
      () => {
        const canvas = this.renderer.domElement;
        if (canvas.parentNode === this.container) this.container.removeChild(canvas);
      }
    ]) {
      try { release(); } catch (error) { failures.push(error); }
    }
    // Views own their geometries/materials; this owner releases only its
    // animation, input controls, renderer and canvas, without changing models.
    if (failures.length) throw failures[0];
  }
}

export function getSceneSetup(object3D) {
  do {
    if (object3D.userData.sceneSetUp) {
      return object3D.userData.sceneSetUp;
    }
    object3D = object3D.parent;
  } while(object3D);
  return null;
}

const ORTHOGRAPHIC_CAMERA_FACTOR = 1;
