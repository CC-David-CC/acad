import {MObject, MObjectIdGenerator} from './mobject';
import {MBrepFace, MFace} from './mface';
import {MEdge} from './medge';
import {MVertex} from './mvertex';
import CSys, {CartesianCSys} from 'math/csys';
import {state, StateStream} from "lstream";
import {Matrix3x4} from "math/matrix";
import {Shell} from "brep/topo/shell";
import {TopoObject} from "brep/topo/topo-object";
import {EntityKind} from "cad/model/entities";

/**
 * Shared mesh buffer owned by the shell.
 * Each face references a range of triangle indices into this buffer.
 */
export interface ShellMesh {
  vertices: Float32Array;   // flat [x,y,z, x,y,z, ...]
  normals: Float32Array;    // flat [nx,ny,nz, ...]
  indices?: Uint32Array;    // optional index buffer
  // Per-face triangle ranges: faceTriRanges[faceIdx] = [startTriIdx, endTriIdx)
  faceTriRanges: [number, number][];
}

export class MShell extends MObject {

  static TYPE = EntityKind.SHELL;

  csys: CartesianCSys;

  shell;
  faces: MFace[] = [];
  edges: MEdge[] = [];
  vertices: MVertex[]  = [];

  /** Shared mesh buffer — single source of truth for rendering */
  mesh: ShellMesh | null = null;

  location$: StateStream<Matrix3x4> = state(new Matrix3x4());

  constructor(explicitId?: string) {
    if (explicitId !== undefined && (typeof explicitId !== 'string' || !explicitId ||
        explicitId.length > 1024 || explicitId.trim() !== explicitId)) {
      throw new Error('Invalid explicit shell identity.');
    }
    // Producer-owned identities must never advance the legacy ordinal space.
    // Constructors without an explicit producer retain their existing IDs.
    super(MShell.TYPE, explicitId === undefined ? MObjectIdGenerator.next(MShell.TYPE, 'S') : explicitId);
  }

  traverse(callback: (obj: MObject) => void): void {
    callback(this);
    this.faces.forEach(i => i.traverse(callback));
    this.edges.forEach(i => i.traverse(callback));
    this.vertices.forEach(i => i.traverse(callback));
  }

  get parent() {
    return null;
  }

  get location() {
    return this.location$.value;
  }
}

export class MBrepShell extends MShell {

  brepShell: Shell;
  brepRegistry: Map<TopoObject, MObject>;

  constructor(shell, csys?) {
    super();
    this.brepShell = shell;
    this.csys = csys || CSys.ORIGIN;
    this.brepRegistry = new Map();
    
    let faceCounter = 0;
    let edgeCounter = 0;
    let vertexCounter = 0;

    for (const brepFace of this.brepShell.faces) {
      const mFace = new MBrepFace(brepFace.data.id || (this.id + '/F:' + faceCounter++), this, brepFace);
      this.faces.push(mFace);
      this.brepRegistry.set(brepFace, mFace);
    }

    for (const brepEdge of this.brepShell.edges) {
      const mEdge = new MEdge(brepEdge.data.id || (this.id + '/E:' + edgeCounter++), this, brepEdge);
      this.edges.push(mEdge);
      this.brepRegistry.set(brepEdge, mEdge);
    }

    // Vertex IDs used to be the topology object itself, which cannot be
    // resolved by the string-based CAD registry. Scope producer labels to
    // this shell; neither they nor traversal ordinals promise durable identity.
    const vertexIds = new Set<string>([...this.faces, ...this.edges].map(entity => entity.id));
    for (const brepVertex of this.brepShell.vertices) {
      const producerId = brepVertex.data?.id;
      if (producerId !== undefined && (typeof producerId !== 'string' || !producerId || producerId.trim() !== producerId)) {
        throw new Error('Invalid BREP vertex producer ID.');
      }
      let encoded: string;
      try { encoded = producerId === undefined ? null : encodeURIComponent(producerId); }
      catch { throw new Error('Invalid BREP vertex producer ID.'); }
      const id = producerId === undefined
        ? this.id + '/V:ordinal:' + vertexCounter++
        : this.id + '/V:producer:' + encoded;
      if (vertexIds.has(id)) throw new Error('Duplicate or colliding BREP vertex ID.');
      vertexIds.add(id);
      const mVertex = new MVertex(id, this, brepVertex);
      mVertex.ext.vertexIdentity = Object.freeze({source: producerId === undefined ? 'ordinal' : 'producer',
        stability: producerId === undefined ? 'unstable' : 'unqualified', producerId: producerId === undefined ? null : producerId});
      this.vertices.push(mVertex);
      this.brepRegistry.set(brepVertex, mVertex);
    }
  }

  get topology(): TopoObject {
    return this.brepShell;
  }

}
