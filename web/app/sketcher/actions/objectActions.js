import {convertReferenceLengthToDriving, convertDrivingLengthToReference, inspectLengthMeasurementRoles, convertLengthMeasurementById} from './lengthMeasurementRoles';
import {toast} from 'react-toastify';
import {BiPencil} from "react-icons/bi";
import {BsTextareaT} from "react-icons/bs";
import {Label} from "sketcher/shapes/label";
import {isConstraintAnnotation} from "sketcher/constr/constraintAnnotation";
import {editConstraint} from "sketcher/actions/constraintActions";

export default [
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

