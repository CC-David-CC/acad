import {createReferenceArcLengthMeasurement,removeReferenceArcLengthMeasurement,convertReferenceArcLengthToDriving,convertDrivingArcLengthToReference,inspectArcLengthMeasurementRoles} from './arcLengthMeasurementRoles';
import {createReferenceLengthMeasurement,removeReferenceLengthMeasurement,convertReferenceLengthToDriving, convertDrivingLengthToReference, inspectLengthMeasurementRoles, convertLengthMeasurementById} from './lengthMeasurementRoles';
import {toast} from 'react-toastify';
import {BiPencil} from "react-icons/bi";
import {BsTextareaT} from "react-icons/bs";
import {Label} from "sketcher/shapes/label";
import {isConstraintAnnotation} from "sketcher/constr/constraintAnnotation";
import {editConstraint} from "sketcher/actions/constraintActions";

export default [
  {id:'CreateReferenceArcLengthRuler',shortName:'Reference arc length',kind:'Misc',description:'Measure the full authored circular Arc interval, not its endpoint chord.',icon:BiPencil,selectionMatcher:{selector:'function',match:s=>s.length===1&&s[0]?.TYPE==='Arc'},invoke:ctx=>createReferenceArcLengthMeasurement(ctx.viewer,ctx.viewer.selected[0])},
  {id:'RemoveReferenceArcLengthRuler',shortName:'Remove reference arc length',kind:'Misc',description:'Remove only the reference ruler; preserve the Arc.',icon:BiPencil,selectionMatcher:{selector:'function',match:s=>s.length===1&&s[0]?.TYPE==='ArcLengthDimension'},invoke:ctx=>removeReferenceArcLengthMeasurement(ctx.viewer,ctx.viewer.selected[0])},
  {id:'ArcLengthMeasurementRole',shortName:'Toggle reference/driving arc length',kind:'Misc',description:'Convert one native Arc ruler between reference and driving roles without changing geometry.',icon:BiPencil,selectionMatcher:{selector:'function',match:s=>s.length===1&&s[0]?.TYPE==='ArcLengthDimension'},invoke:ctx=>{const d=ctx.viewer.selected[0],row=inspectArcLengthMeasurementRoles(ctx.viewer).items.find(r=>r.dimensionId===d.id);if(!row)throw Error('Choose a current Arc ruler.');return row.role==='driving'?convertDrivingArcLengthToReference(ctx.viewer,d.arc):convertReferenceArcLengthToDriving(ctx.viewer,d);}},

  {id:'CreateReferenceLengthRuler',shortName:'Reference length ruler',kind:'Misc',description:'Add a native read-only length measurement to an ordinary Segment or associative pattern output; never adds a driving equation.',icon:BiPencil,selectionMatcher:{selector:'function',match:s=>s.length===1&&s[0]?.TYPE==='Segment'},invoke:ctx=>createReferenceLengthMeasurement(ctx.viewer,ctx.viewer.selected[0])},
  {id:'RemoveReferenceLengthRuler',shortName:'Remove reference ruler',kind:'Misc',description:'Remove a native reference ruler while preserving its actual source and generated geometry.',icon:BiPencil,selectionMatcher:{selector:'function',match:s=>s.length===1&&s[0]?.TYPE==='LinearDimension'},invoke:ctx=>removeReferenceLengthMeasurement(ctx.viewer,ctx.viewer.selected[0])},

  {
    id: 'LengthMeasurementRole',
    shortName: 'Toggle reference/driving length',
    kind: 'Misc',
    description: 'Convert between reference and driving length; reference removes the length equation',
    icon: BiPencil,
    selectionMatcher: {selector:'function',match: selection => selection.length===1 && (selection[0]?.TYPE==='LinearDimension'||selection[0]?.TYPE==='LengthAnnotation')},
    invoke: ctx => {
      const item=ctx.viewer.selected[0];
      try {
        if(item.TYPE==='LinearDimension')return convertReferenceLengthToDriving(ctx.viewer,item);
        if(item.TYPE==='LengthAnnotation'&&item.constraint?.schema?.id==='SegmentLength')return convertDrivingLengthToReference(ctx.viewer,item.constraint.objects[0]);
        throw Error('Choose one supported segment length.');
      } catch(error) {toast(error?.message||'The length role could not be changed.');}
    },
    inspect: (ctx,options)=>inspectLengthMeasurementRoles(ctx.viewer,options),
    invokeById: (ctx,args,options)=>convertLengthMeasurementById(ctx.viewer,args,options)
  },


  {
    id: 'AddObjectLabel',
    shortName: 'Add Label',
    kind: 'Misc',
    description: 'Add Label',
    icon: BsTextareaT,
    selectionMatcher: {
      selector: 'function',
      match: (selection) => true
    },
    invoke: (ctx, params) => {
      const selection = ctx.viewer.selected;
      ctx.ui.$wizardRequest.next({
        title: "Label Text",
        schema:  [
          {
            name: 'text',
            label: 'Label Text',
            type: 'string'
          }
        ],
        onApply: (params) => {
          selection.forEach(obj => {
            const label = new Label(params.text, obj);
            ctx.viewer.labelLayer.add(label);
          });
        }
      })

    }

  },

  {
    id: 'EditConstraintFromItsAnnotation',
    shortName: 'Edit Constraint',
    kind: 'Misc',
    description: 'Edit the constraint the annotation refers to',
    icon: BiPencil,
    selectionMatcher: {
      selector: 'function',
      match: (selection) => isConstraintAnnotation(selection[0])
    },
    invoke: (ctx) => {
      const [obj] = ctx.viewer.selected;
      editConstraint(ctx, obj.constraint, () => {
        ctx.viewer.parametricManager.constraintUpdated(obj.constraint);
      })
    }
  },


];

