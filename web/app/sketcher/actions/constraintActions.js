import {toast} from 'react-toastify';
import {AlgNumConstraint, ConstraintDefinitions} from "../constr/ANConstraints";
import {addLengthRelation, addLengthRelationByIdsAtRevision, inspectLengthRelationTargets} from "./lengthRelationOperation";
import {addDiameter, addDiameterByIdAtRevision, inspectDiameterTargets} from './diameterOperation';
import {addConcentric, addConcentricByIdsAtRevision, inspectConcentricTargets} from "./concentricOperation";
import {addSignedDistance,addSignedDistanceByIdsAtRevision,inspectSignedDistanceTargets} from './signedDistanceOperation';
import {addLineRelation,addLineRelationByIdsAtRevision,inspectLineRelationTargets} from './lineRelationOperation';
import {fixEntity,fixEntityByIdAtRevision,inspectFixEntityTargets,releaseFixEntityInspection} from './fixEntityOperation';
import {createRigidGroup,createRigidGroupByIds,inspectRigidGroups,releaseRigidGroupInspection,editRigidGroupById,rigidGroupForMember} from '../rigid/rigidGroupOperation';
import {EndPoint} from "../shapes/point";
import {Circle} from "../shapes/circle";
import {Segment} from "../shapes/segment";
import {isInstanceOf, matchAll, matchTypes} from "./matchUtils";
import {Arc} from "../shapes/arc";
import {FilletTool} from "../tools/fillet";
import {showConstraintEditorUI} from "../components/ConstraintEditor";
import {BezierCurve} from "../shapes/bezier-curve";
import {
  AngleBetweenConstraintIcon,
  AngleConstraintIcon,
  CoincidentConstraintIcon,
  DistanceConstraintIcon,
  DistancePLConstraintIcon,
  EqualConstraintIcon, FilletConstraintIcon,
  HorizontalConstraintIcon,
  LockConstraintIcon,
  ParallelConstraintIcon,
  PerpendicularConstraintIcon,
  PointInMiddleConstraintIcon,
  PointOnCurveConstraintIcon,
  PointOnLineConstraintIcon,
  RadiusConstraintIcon,
  SymmetryConstraintIcon,
  TangentConstraintIcon,
  VerticalConstraintIcon
} from "../icons/constraints/ConstraintIcons";

import {addConstraintGroup} from './addConstraintGroup';
import {prepareConstraintGroup} from './constraintGroupAdmission';

export default [

  {id:'CreateRigidGroup',shortName:'Create Rigid Group',kind:'Constraint',icon:LockConstraintIcon,
    description:'Group selected segments into one movable planar rigid profile',
    selectionMatcher:{selector:'matchAll',types:[Segment],minQuantity:2},
    invoke:(ctx,objects)=>{try{createRigidGroup(ctx.viewer,objects);}catch(error){toast(error?.message||'The rigid group could not be created.');}},
    inspect:(ctx,options)=>inspectRigidGroups(ctx.viewer,options),
    releaseInspection:(ctx,revision)=>releaseRigidGroupInspection(ctx.viewer,revision),
    invokeByIds:(ctx,ids,revision,options)=>createRigidGroupByIds(ctx.viewer,ids,revision,options)
  },
  {id:'PoseRigidGroup',shortName:'Move Rigid Group',kind:'Constraint',icon:LockConstraintIcon,
    description:'Set the selected group transform in sketch coordinates; angle is in radians',
    selectionMatcher:{selector:'matchSequence',sequence:[{types:[Segment],quantity:1}]},
    invoke:(ctx,objects)=>{
      let inspection;
      try {
        const group=rigidGroupForMember(ctx.viewer,objects[0]);inspection=inspectRigidGroups(ctx.viewer);
        const field={type:'number',finite:true},schema={id:'RigidPoseEditor',name:'Rigid Group Pose (radians)',constants:{x:field,y:field,angle:field}};
        const request=new AlgNumConstraint(schema,objects,{x:String(group.tx.get()),y:String(group.ty.get()),angle:String(group.angle.get())},true);
        // This dialog edits an ephemeral request, not an authored constraint;
        // it must not invalidate the captured sketch revision while typing.
        request.updateConstant=(key,value)=>{request.constants[key]=value;};
        const close=()=>ctx.ui.$constraintEditRequest.next(null);
        ctx.ui.$constraintEditRequest.next({constraint:request,onCancel:()=>{close();releaseRigidGroupInspection(ctx.viewer,inspection.revision);},onApply:()=>{
          close();const pose=Object.fromEntries(['x','y','angle'].map(k=>[k,Number(request.constants[k])]));
          editRigidGroupById(ctx.viewer,group.id,inspection.revision,'pose',pose).catch(error=>toast(error?.message||'The rigid group could not be moved.'));
        }});
      } catch(error){if(inspection)releaseRigidGroupInspection(ctx.viewer,inspection.revision);toast(error?.message||'The rigid group could not be moved.');}
    },
    inspect:(ctx,options)=>inspectRigidGroups(ctx.viewer,options),
    releaseInspection:(ctx,revision)=>releaseRigidGroupInspection(ctx.viewer,revision),
    invokeById:(ctx,id,revision,pose,options)=>editRigidGroupById(ctx.viewer,id,revision,'pose',pose,options)
  },
  {id:'DissolveRigidGroup',shortName:'Dissolve Rigid Group',kind:'Constraint',icon:LockConstraintIcon,
    description:'Remove the group while retaining member geometry and other constraints',
    selectionMatcher:{selector:'matchSequence',sequence:[{types:[Segment],quantity:1}]},
    invoke:(ctx,objects)=>{try{const group=rigidGroupForMember(ctx.viewer,objects[0]),view=inspectRigidGroups(ctx.viewer);editRigidGroupById(ctx.viewer,group.id,view.revision,'dissolve',undefined).catch(error=>toast(error?.message||'The rigid group could not be dissolved.'));}catch(error){toast(error?.message||'The rigid group could not be dissolved.');}},
    inspect:(ctx,options)=>inspectRigidGroups(ctx.viewer,options),
    releaseInspection:(ctx,revision)=>releaseRigidGroupInspection(ctx.viewer,revision),
    invokeById:(ctx,id,revision,options)=>editRigidGroupById(ctx.viewer,id,revision,'dissolve',undefined,options)
  },

  {id:'FixEntity',shortName:'Fix Entity',kind:'Constraint',icon:LockConstraintIcon,
    description:'Fix the full physical geometry of one segment, circle or arc',
    selectionMatcher:{selector:'matchSequence',sequence:[{types:[Segment,Circle,Arc],quantity:1}]},
    invoke:(ctx,objects)=>{try{fixEntity(ctx.viewer,objects[0]);}catch(error){toast(error?.message||'The entity could not be fixed.');}},
    inspect:(ctx,options)=>inspectFixEntityTargets(ctx.viewer,options),
    releaseInspection:(ctx,revision)=>releaseFixEntityInspection(ctx.viewer,revision),
    invokeById:(ctx,id,revision,options)=>fixEntityByIdAtRevision(ctx.viewer,id,revision,options)
  },

  ...['collinear','axis-symmetry'].map(kind=>({
    id:kind==='collinear'?'Collinear':'AxisSymmetry',
    shortName:kind==='collinear'?'Collinear':'Symmetry about Line',kind:'Constraint',
    description:kind==='collinear'?'Place two segments on the same infinite supporting line':'Mirror two points about the selected infinite line',
    icon:kind==='collinear'?ParallelConstraintIcon:SymmetryConstraintIcon,
    selectionMatcher:{selector:'matchSequence',sequence:kind==='collinear'?[{types:[Segment],quantity:2}]:[{types:[EndPoint],quantity:2},{types:[Segment],quantity:1}]},
    invoke:(ctx,objects)=>{try{addLineRelation(ctx.viewer,kind,objects);}catch(error){toast(error?.message||'The relation could not be applied.');}},
    inspect:(ctx,options)=>inspectLineRelationTargets(ctx.viewer,options),
    invokeByIds:(ctx,ids,revision,options)=>addLineRelationByIdsAtRevision(ctx.viewer,kind,ids,revision,options)
  })),

  ...['x','y','projected'].map(axis=>({
    id:axis==='x'?'SignedDistanceX':axis==='y'?'SignedDistanceY':'ProjectedDistance',
    shortName:axis==='x'?'Signed X Distance':axis==='y'?'Signed Y Distance':'Signed Projected Distance',kind:'Constraint',
    description:'Signed displacement from first point to second; projected uses the selected segment A to B direction',icon:DistanceConstraintIcon,
    selectionMatcher:{selector:'matchSequence',sequence:axis==='projected'?[{types:[EndPoint],quantity:2},{types:[Segment],quantity:1}]:[{types:[EndPoint],quantity:2}]},
    invoke:(ctx,objects)=>{
      const schema=axis==='x'?ConstraintDefinitions.SignedDistanceX:axis==='y'?ConstraintDefinitions.SignedDistanceY:ConstraintDefinitions.ProjectedDistance;
      const relation=new AlgNumConstraint(schema,objects);relation.initConstants();
      editConstraint(ctx,relation,()=>{try{addSignedDistance(ctx.viewer,axis,objects,relation.constants.distance)}catch(error){toast(error?.message||'The signed distance could not be applied.')}});
    },
    inspect:(ctx,options)=>inspectSignedDistanceTargets(ctx.viewer,options),
    invokeByIds:(ctx,ids,distance,revision,options)=>addSignedDistanceByIdsAtRevision(ctx.viewer,axis,ids,distance,revision,options)
  })),


  {
    id: 'Coincident',
    shortName: 'Coincident',
    kind: 'Constraint',
    description: 'Point Coincident',
    icon: CoincidentConstraintIcon,
    selectionMatcher: {
      selector: 'matchAll',
      types: [EndPoint],
      minQuantity: 2
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const [first, ...others] = matchedObjects;
      const pm = viewer.parametricManager;
      addConstraintGroup(pm, others.map(obj =>
        new AlgNumConstraint(ConstraintDefinitions.PCoincident, [first, obj])
      ));
    }
  },

  {
    id: 'Tangent',
    shortName: 'Tangent',
    kind: 'Constraint',
    description: 'Tangent Between Line And Circle',
    icon: TangentConstraintIcon,
    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [Circle, Arc, BezierCurve],
          quantity: 1
        },
        {
          types: [Segment],
          quantity: 1
        },
      ]
    },

    invoke: (ctx, matchedObjects) => {

      const {viewer} = ctx;
      const [curve, line] = matchedObjects;
      let constraint;
      if (isInstanceOf(curve, BezierCurve) ) {
        constraint = new AlgNumConstraint(ConstraintDefinitions.TangentLineBezier, [line, curve]);
      } else {
        constraint = new AlgNumConstraint(ConstraintDefinitions.TangentLC, [line, curve]);
      }
      constraint.initConstants();
      const pm = viewer.parametricManager;
      pm.add(constraint);
    }

  },

  {
    id: 'Concentric',
    shortName: 'Concentric',
    kind: 'Constraint',
    description: 'Make the centers of two circles or arcs coincide',
    icon: CoincidentConstraintIcon,
    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [{types: [Circle, Arc], quantity: 2}]
    },
    invoke: (ctx, matchedObjects) => {try{addConcentric(ctx.viewer,matchedObjects);}catch(error){toast(error?.message||'The concentric constraint could not be applied.');}},
    inspect: (ctx, options) => inspectConcentricTargets(ctx.viewer, options),
    invokeByIds: (ctx, ids, revision, options) => addConcentricByIdsAtRevision(ctx.viewer, ids, revision, options)
  },

  {
    id: 'EqualRadius',
    shortName: 'Equal Radius',
    kind: 'Constraint',
    description: 'Equal Radius Between Two Circle',
    icon: EqualConstraintIcon,
    selectionMatcher: {
      selector: 'matchAll',
      types: [Circle, Arc],
      minQuantity: 2
    },

    invoke: (ctx, matchedObjects) => {

      const {viewer} = ctx;

      const pm = viewer.parametricManager;
      addConstraintGroup(pm, matchedObjects.slice(1).map((object, i) =>
        new AlgNumConstraint(ConstraintDefinitions.EqualRadius, [matchedObjects[i], object])
      ));
    }

  },

  {
    id: 'EqualLength',
    shortName: 'Equal Length',
    kind: 'Constraint',
    description: 'Equal Length Between Two Segments',
    icon: EqualConstraintIcon,
    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 2
    },
    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const pm = viewer.parametricManager;
      addConstraintGroup(pm, matchedObjects.slice(1).map((object, i) =>
        new AlgNumConstraint(ConstraintDefinitions.EqualLength, [matchedObjects[i], object])
      ));
    }

  },

  {
    id: 'LengthRelation',
    shortName: 'Length relation',
    kind: 'Constraint',
    description: 'Set length of the first segment to factor times the second plus offset (mm)',
    icon: EqualConstraintIcon,
    selectionMatcher: {selector: 'matchSequence', sequence: [{types: [Segment], quantity: 2}]},
    invoke: (ctx, objects) => {
      const constraint=new AlgNumConstraint(ConstraintDefinitions.LengthRelation, objects);
      constraint.initConstants();
      editConstraint(ctx,constraint,()=>{try{addLengthRelation(ctx.viewer,objects,constraint.constants)}catch(error){toast(error?.message||'The length relation could not be applied.')}});
    },
    inspect: (ctx,options)=>inspectLengthRelationTargets(ctx.viewer,options),
    invokeByIds: (ctx,ids,constants,revision,options)=>addLengthRelationByIdsAtRevision(ctx.viewer,ids,constants,revision,options)
  },

  {
    id: 'PointOnLine',
    shortName: 'Point On Line',
    kind: 'Constraint',
    description: 'Point On Line',
    icon: PointOnLineConstraintIcon,
    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [EndPoint],
          quantity: 1
        },
        {
          types: [Segment],
          quantity: 1
        },
      ]
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const [pt, line] = matchedObjects;
      const pm = viewer.parametricManager;
      pm.add(new AlgNumConstraint(ConstraintDefinitions.PointOnLine, [pt, line]));
    }
  },

  {
    id: 'PointOnCircle',
    shortName: 'Point On Circle',
    kind: 'Constraint',
    description: 'Point On Circle',
    icon: PointOnCurveConstraintIcon,
    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [EndPoint],
          quantity: 1
        },
        {
          types: [Circle, Arc],
          quantity: 1
        },
      ]
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const [pt, circle] = matchedObjects;
      const pm = viewer.parametricManager;
      pm.add(new AlgNumConstraint(ConstraintDefinitions.PointOnCircle, [pt, circle]));
    }
  },

  {
    id: 'PointOnCurve',
    shortName: 'Point On Curve',
    kind: 'Constraint',
    description: 'Point On Curve',
    icon: PointOnCurveConstraintIcon,
    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [EndPoint],
          quantity: 1
        },
        {
          types: [BezierCurve],
          quantity: 1
        },
      ]
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const [pt, curve] = matchedObjects;
      const pm = viewer.parametricManager;
      pm.add(new AlgNumConstraint(ConstraintDefinitions.PointOnBezier, [pt, curve]));
    }
  },

  {
    id: 'PointInMiddle',
    shortName: 'Middle Point',
    kind: 'Constraint',
    description: 'Point In The Middle',
    icon: PointInMiddleConstraintIcon,
    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [EndPoint],
          quantity: 1
        },
        {
          types: [Segment],
          quantity: 1
        },
      ]
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const pm=viewer.parametricManager,group=prepareConstraintGroup(pm,'midpoint',matchedObjects);if(group.changed)addConstraintGroup(pm,group.constraints,group.validate,group.apply);
    }
  },

  {
    id: 'Symmetry',
    shortName: 'Midpoint Symmetry',
    kind: 'Constraint',
    description: 'Make the selected point the midpoint of the selected segment; this is not reflection about an independent axis',
    icon: SymmetryConstraintIcon,
    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [EndPoint],
          quantity: 1
        },
        {
          types: [Segment],
          quantity: 1
        },
      ]
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const pm=viewer.parametricManager,group=prepareConstraintGroup(pm,'midpoint',matchedObjects,undefined,'create','Symmetry');if(group.changed)addConstraintGroup(pm,group.constraints,group.validate,group.apply);
    }
  },

  {
    id: 'Angle',
    shortName: 'Angle',
    kind: 'Constraint',
    description: 'Angle',
    icon: AngleConstraintIcon,
    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 1
    },
    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const firstSegment = matchedObjects[0];

      const firstConstr = new AlgNumConstraint(ConstraintDefinitions.Angle, [firstSegment]);
      firstConstr.initConstants();

      editConstraint(ctx, firstConstr, () => {
        const pm = viewer.parametricManager;
        pm._add(firstConstr);
        for (let i = 1; i < matchedObjects.length; ++i) {
          pm._add(new AlgNumConstraint(ConstraintDefinitions.Angle, [matchedObjects[i]], {...firstConstr.constants}));
        }
        pm.commit();
      });
    }
  },

  {
    id: 'Vertical',
    shortName: 'Vertical',
    kind: 'Constraint',
    description: 'Vertical',
    icon: VerticalConstraintIcon,

    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 1
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const pm = viewer.parametricManager;

      matchedObjects.forEach(obj => {
        const constr = new AlgNumConstraint(ConstraintDefinitions.Vertical, [obj]);
        constr.initConstants();
        pm._add(constr);
      });
      pm.commit();
    }
  },

  {
    id: 'Horizontal',
    shortName: 'Horizontal',
    kind: 'Constraint',
    description: 'Horizontal',
    icon: HorizontalConstraintIcon,

    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 1
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const pm = viewer.parametricManager;

      matchedObjects.forEach(obj => {
        const constr = new AlgNumConstraint(ConstraintDefinitions.Horizontal, [obj]);
        constr.initConstants();
        pm._add(constr);
      });
      pm.commit();
    }
  },

  {
    id: 'AngleBetween',
    shortName: 'Angle Between',
    kind: 'Constraint',
    description: 'One directed acute/obtuse angle for each consecutive segment pair; current positive-direction branch must not cross360 degrees',
    icon: AngleBetweenConstraintIcon,

    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 2
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const [firstSegment, secondSegment] = matchedObjects;

      const firstConstr = new AlgNumConstraint(ConstraintDefinitions.AngleBetween, [firstSegment, secondSegment]);
      firstConstr.initConstants();

      editConstraint(ctx, firstConstr, () => {
        const pm = viewer.parametricManager;
        const group=prepareConstraintGroup(pm,'angle-chain',matchedObjects,Number(firstConstr.constants.angle),'create');
        if(group.changed)addConstraintGroup(pm,group.constraints,group.validate,group.apply);
      });
    }
  },

  {
    id: 'Perpendicular',
    shortName: 'Perpendicular',
    kind: 'Constraint',
    description: 'Perpendicularity between two or more lines',
    icon: PerpendicularConstraintIcon,

    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 2
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const pm = viewer.parametricManager;

      for (let i = 1; i < matchedObjects.length; ++i) {
        const constr = new AlgNumConstraint(ConstraintDefinitions.Perpendicular, [matchedObjects[i-1], matchedObjects[i]]);
        constr.initConstants();
        pm._add(constr);
      }
      pm.commit();
    }
  },

  {
    id: 'Parallel',
    shortName: 'Parallel',
    kind: 'Constraint',
    description: 'Parallelism between two or more lines',
    icon: ParallelConstraintIcon,

    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 2
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const pm = viewer.parametricManager;

      for (let i = 1; i < matchedObjects.length; ++i) {
        const constr = new AlgNumConstraint(ConstraintDefinitions.Parallel, [matchedObjects[i-1], matchedObjects[i]]);
        constr.initConstants();
        pm._add(constr);
      }
      pm.commit();
    }
  },

  {
    id: 'Length',
    shortName: 'Length',
    kind: 'Constraint',
    description: 'Segment Length',
    icon: DistanceConstraintIcon,

    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 1
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const [firstSegment, ...others] = matchedObjects;

      const firstConstr = new AlgNumConstraint(ConstraintDefinitions.SegmentLength, [firstSegment]);
      firstConstr.initConstants();

      editConstraint(ctx, firstConstr, () => {
        const pm = viewer.parametricManager;
        pm._add(firstConstr);
        for (const other of others) {
          pm._add(new AlgNumConstraint(ConstraintDefinitions.SegmentLength, [other], {...firstConstr.constants}));
        }
        pm.commit();
      });
    }
  },

  {
    id: 'RadiusLength',
    shortName: 'Radius Length',
    kind: 'Constraint',
    description: 'Radius Length',
    icon: RadiusConstraintIcon,

    selectionMatcher: {
      selector: 'matchAll',
      types: [Circle, Arc],
      minQuantity: 1
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const [firstCircle, ...others] = matchedObjects;

      const firstConstr = new AlgNumConstraint(ConstraintDefinitions.RadiusLength, [firstCircle]);
      firstConstr.initConstants();

      editConstraint(ctx, firstConstr, () => {
        const pm = viewer.parametricManager;
        pm._add(firstConstr);
        for (const other of others) {
          pm._add(new AlgNumConstraint(ConstraintDefinitions.RadiusLength, [other], {...firstConstr.constants}));
        }
        pm.commit();
      });
    }
  },

  {
    id: 'DiameterLength',
    shortName: 'Diameter',
    kind: 'Constraint',
    description: 'Driving diameter of one circle or arc',
    icon: RadiusConstraintIcon,
    selectionMatcher: {selector: 'matchSequence', sequence: [{types: [Circle, Arc], quantity: 1}]},
    invoke: (ctx, objects) => {
      if(objects.length!==1)throw Error('Select one circle or arc.');
      const constraint=new AlgNumConstraint(ConstraintDefinitions.DiameterLength,[objects[0]]);
      constraint.initConstants();
      editConstraint(ctx,constraint,()=>{try{addDiameter(ctx.viewer,objects[0],constraint.constants.diameter);}catch(error){toast(error?.message||'The diameter could not be applied.');}});
    },
    inspect: (ctx, options) => inspectDiameterTargets(ctx.viewer, options),
    invokeById: (ctx, id, diameter, revision, options) => addDiameterByIdAtRevision(ctx.viewer,id,diameter,revision,options)
  },

  {
    id: 'DistancePL',
    shortName: 'Point to Line Distance',
    kind: 'Constraint',
    description: 'Distance between Point and Line',
    icon: DistancePLConstraintIcon,

    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [EndPoint],
          quantity: 1
        },
        {
          types: [Segment],
          quantity: 1
        },
      ]
    },


    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const [pt, seg] = matchedObjects;

      const constr = new AlgNumConstraint(ConstraintDefinitions.DistancePL, [pt, seg]);
      constr.initConstants();

      editConstraint(ctx, constr, () => {
        const pm = viewer.parametricManager;
        pm.add(constr);
      });
    }
  },

  {
    id: 'DistancePP',
    shortName: 'Two Point Distance',
    kind: 'Constraint',
    description: 'Distance between two Points',
    icon: DistanceConstraintIcon,

    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [EndPoint],
          quantity: 2
        }
      ]
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const [p1, p2] = matchedObjects;

      const constr = new AlgNumConstraint(ConstraintDefinitions.DistancePP, [p1, p2]);
      constr.initConstants();

      editConstraint(ctx, constr, () => {
        const pm = viewer.parametricManager;
        pm.add(constr);
      });
    }
  },

  {
    id: 'Lock',
    shortName: 'Lock Point',
    kind: 'Constraint',
    description: 'Lock Point',
    icon: LockConstraintIcon,

    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [EndPoint],
          quantity: 1
        }
      ]
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const [point] = matchedObjects;

      const constr = new AlgNumConstraint(ConstraintDefinitions.LockPoint, [point]);
      constr.initConstants();
      editConstraint(ctx, constr, () => viewer.parametricManager.add(constr));
    }
  },

  {
    id: 'Fillet',
    shortName: 'Fillet',
    kind: 'Tool',
    description: 'Make a Fillet',
    icon: FilletConstraintIcon,

    selectionMatcher: {
      selector: 'function',
      match: (selection) => {
        if (matchTypes(selection, EndPoint, 1)) {
          const [point] = selection;
          if (isInstanceOf(point.parent, Segment)) {
            let pair = null;
            point.visitLinked(l => {
              if (l !== point && isInstanceOf(l.parent, Segment)) {
                pair = l;
                return true;
              }
            });
            if (pair) {
              return true;
            }
          }
        }
        return false;
      },
      description: 'a point linking two segment'
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const filletTool = new FilletTool(ctx.viewer);
      const cands = filletTool.getCandidateFromSelection(viewer.selected);
      if (cands) {
        filletTool.breakLinkAndMakeFillet(cands[0], cands[1]);
      }

    }
  },

];

export function editConstraint(ctx, constraint, onApply) {
  showConstraintEditorUI(ctx.ui.$constraintEditRequest, constraint, onApply)
}
