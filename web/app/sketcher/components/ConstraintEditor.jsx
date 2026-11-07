import React, {useCallback, useContext, useEffect, useState} from 'react';
import NumberControl from "ui/components/controls/NumberControl";
import Stack from "ui/components/Stack";
import ButtonGroup from "ui/components/controls/ButtonGroup";
import Button from "ui/components/controls/Button";
import {useStream} from "ui/effects";
import CheckboxControl from "ui/components/controls/CheckboxControl";
import Window from "ui/components/Window";
import Field from "ui/components/controls/Field";
import Label from "ui/components/controls/Label";
import {EMPTY_OBJECT} from "gems/objects";
import {SketcherAppContext} from "./SketcherAppContext";
import {captureExistingConstraintEdit,editExistingConstraint} from "../actions/editExistingConstraint";

export function ConstraintEditor() {

  const req = useStream(ctx => ctx.ui.$constraintEditRequest);

  const [values, setValues] = useState(null);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setValues(req && {...req.constraint.constants});
    setValidationError('');
    return () => {
      if (req) {
        viewer.unHighlight(req.constraint.objects);
        viewer.refresh();
      }
    }
  }, [req]);

  const {viewer} = useContext(SketcherAppContext);

  const setValue = (name, value) => {
     setValues({...values, [name]: value});
    
  };

  if (!req || !values) {
    return null;
  }

  const {constraint, onCancel, onApply} = req;

  const highlight = () => {
    viewer.highlight(constraint.objects, true);
    viewer.refresh();
  };

  const unHighlight = () => {
    viewer.unHighlightAll();
    viewer.refresh();
  };


  const apply = () => {
    const proposed = {...constraint.constants, ...values};
    try {
      constraint.validateCandidateConstants(proposed, viewer.parametricManager.constantResolver);
    } catch (error) {
      setValidationError(error.message || 'Invalid dimension.');
      return;
    }
    const retained=viewer.parametricManager.stages.some(stage=>stage.algNumSystem.allConstraints.includes(constraint));
    if (req.existing) {
      try { editExistingConstraint(viewer,constraint,proposed,req.expected); }
      catch (error) { setValidationError(error.message || 'The constraint could not be edited.'); return; }
      try { onApply(true); } catch (error) { console.error('Constraint edit committed; dialog notification failed:',error); }
      return;
    }
    if (retained) { setValidationError('The constraint changed while this dialog was open.'); return; }
    Object.keys(constraint.schema.constants).forEach(name => {
      const val = values[name];
      if (val !== undefined && !constraint.schema.constants[name].readOnly) constraint.updateConstant(name, val + '');
    });
    onApply();
  };

  return <Window initWidth={250} initLeft={5} initTop={5} title={constraint.schema.name} onClose={onCancel}
                 onEnterPressed={apply}
                 onEscapePressed={onCancel}
                 onMouseEnter={highlight}
                 onMouseLeave={unHighlight}>

    <Stack>

      {validationError && <div role="alert">{validationError}</div>}

      {constraint.constantKeys
        .filter(key => !constraint.schema.constants[key].readOnly)
        .sort().map(name => {
          const def = constraint.schema.constants[name];
          const presentation = def.presentation || EMPTY_OBJECT;
          const type = presentation.type || def.type;
          const onChange = value => setValue(name, (presentation.transformIn||transformInByType(type))(value));

          const val = (presentation.transformOut||transformOutByType(type))(values[name]);
          return <Field key={presentation.label||name}>
            <Label>{name}</Label>
            {
              (() => {
                if (type === 'number') {
                  return <NumberControl value={val} onChange={onChange}/>
                } else if (type === 'boolean') {
                  return <CheckboxControl value={val} onChange={onChange}/>
                } else {
                  return <span>{val}</span>;
                }
              })()
            }
          </Field>
        })}


      <ButtonGroup>
        <Button onClick={onCancel}>CANCEL</Button>
        <Button type='accent' onClick={apply}>APPLY</Button>
      </ButtonGroup>

    </Stack>

  </Window>;

}

export function showConstraintEditorUI(rqStream, constraint, onApply) {
  const existing=!!constraint?.stage?.algNumSystem?.allConstraints?.includes(constraint);
  const expected=existing?captureExistingConstraintEdit(constraint):null;
  rqStream.next({
    constraint,
    existing,
    expected,
    onCancel: () => rqStream.next(null),
    onApply: alreadyCommitted => {
      rqStream.next(null);
      if (!alreadyCommitted) onApply();
    }
  });
}

const NO_TR = v => v;

function transformInByType(type) {
  if ('boolean' === type) {
    return value => value ? 'true' : 'false';
  }
  return NO_TR;
}

function transformOutByType(type) {
  if ('boolean' === type) {
    return value => value === 'true';
  }
  return NO_TR;
}

