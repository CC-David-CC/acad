import {MObject} from 'cad/model/mobject';
import {MOpenFaceShell} from 'cad/model/mopenFace';
import {assertLegacyGeometry} from 'cad/model/workerGeometry';

// Current craft consumers use the in-page kernel. A qualified worker operation
// must supply its own representation-aware admission when that route is added.
// Walk parameter containers only; geometry objects are leaves, never traversed.
export function assertLegacyOperationInputs(params: any, shells: MObject[]): void {
  const seen = new Set<object>();
  const pending = [params];
  while (pending.length) {
    const value = pending.pop();
    if (!value || typeof value !== 'object' || seen.has(value)) continue;
    seen.add(value);
    if (value instanceof MObject) {
      assertLegacyGeometry(value, 'This operation');
    } else {
      Object.keys(value).forEach(key => pending.push(value[key]));
    }
  }
  // An omitted target list means existing solid bodies, not permission to drop
  // representations that the Boolean route cannot understand.
  const definition = params?.boolean;
  if (definition?.kind && definition.kind !== 'NONE' && !definition.targets?.length) {
    shells.filter(shell => !(shell instanceof MOpenFaceShell))
      .forEach(shell => assertLegacyGeometry(shell, 'Boolean operation'));
  }
}
