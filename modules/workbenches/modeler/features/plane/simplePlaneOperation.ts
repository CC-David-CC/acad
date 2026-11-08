import {createMeshGeometry} from 'scene/geoms';
import {Plane} from 'geom/impl/plane';
import Vector from 'math/vector';
import {MOpenFaceShell} from '../../../../../web/app/cad/model/mopenFace';
import {PlaneSurfacePrototype} from '../../../../../web/app/cad/model/surfacePrototype';
import CSys from "math/csys";
import {EntityKind} from "cad/model/entities";
import icon from "./PLANE.svg";
import {canonicalAuthoredFeatureId} from 'cad/craft/authoredFeatureIdentity.mjs';


function paramsToPlane({ orientation, datum, depth }) {
  const csys = datum ? datum.csys : CSys.ORIGIN;

  let axis;
  if (orientation === 'XY') {
    axis = csys.z;
  } else if (orientation === 'XZ') {
    axis = csys.y;
  } else {
    axis = csys.x;
  }

  const w = axis.multiply(depth)._plus(csys.origin).dot(axis);

  return new Plane(axis, w);
}

// Source identity belongs to the saved authored producer, not to how many
// unrelated shells happened to be constructed earlier during this replay.
// Read the raw ID, so evaluating an expression cannot manufacture an identity.
export function sourcePlaneShellId(raw, materializedFeatureId) {
  const descriptor = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? Object.getOwnPropertyDescriptor(raw, 'featureId') : null;
  const value = descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value') ? descriptor.value : undefined;
  const featureId = canonicalAuthoredFeatureId(value);
  if (!descriptor?.enumerable || !Number.isSafeInteger(featureId) || featureId <= 0 || materializedFeatureId !== featureId) {
    throw Object.assign(new Error('Plane identity requires its canonical saved positive safe feature ID.'), {code:'INVALID_FEATURE_ID'});
  }
  return 'source-plane:1:' + JSON.stringify([featureId, 'body']);
}


function previewGeomProvider(params) {
  const plane = paramsToPlane(params);
  const tr = plane.get3DTransformation();
  const w = 375, h = 375;
  const a = tr._apply(new Vector(-w, -h, 0));
  const b = tr._apply(new Vector( w, -h, 0));
  const c = tr._apply(new Vector( w,  h, 0));
  const d = tr._apply(new Vector(-w,  h, 0));
  
  const trs = [[a, b, c], [a, c, d]];
  return createMeshGeometry(trs);
}


function fixTexture(planeWidth, planeHeight) {
  return function(texture) {
    const planeAspect = planeWidth / planeHeight;
    const imageAspect = texture.image.width / texture.image.height;
    const aspect = imageAspect / planeAspect;

    texture.offset.x = aspect > 1 ? (1 - 1 / aspect) / 2 : 0;
    texture.repeat.x = aspect > 1 ? 1 / aspect : 1;

    texture.offset.y = aspect > 1 ? 0 : (1 - aspect) / 2;
    texture.repeat.y = aspect > 1 ? 1 : aspect;
  }
}

export default {
  id: 'PLANE',
  label: 'Plane',
  icon: icon,
  info: 'creates new object plane',
  paramsInfo: ({ depth }) => `(${depth})`,
  previewGeomProvider,
  run: (params, { cadRegistry }, raw) => {
    const id = sourcePlaneShellId(raw, params.featureId);
    return {
      consumed: [],
      created: [new MOpenFaceShell(new PlaneSurfacePrototype(paramsToPlane(params)), undefined, id)]
    }
  },
  form: [
    {
      type: 'choice',
      label: 'orientation',
      name: 'orientation',
      style: 'radio',
      values: ['XY', 'XZ', 'ZY'],
      defaultValue: "XY",
    },
    {
      type: 'selection',
      name: 'datum',
      capture: [EntityKind.DATUM, EntityKind.FACE],
      label: 'datum',
      multi: false,
      optional: true,
      defaultValue: {
        usePreselection: true,
        preselectionIndex: 0
      },
    },
    {
      type: 'number',
      label: 'depth',
      name: 'depth',
      defaultValue: 0,
    },
    // {
    //   type: 'file',
    //   name: 'image',
    //   optional: true,
    //   label: 'Optional Image',
    // },
  ],
};



