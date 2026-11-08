import React, {useContext} from 'react';
import Wizard from './Wizard';
import {useStream} from "ui/effects";
import {ReactApplicationContext} from "cad/dom/ReactApplicationContext";
import {ErrorBoundary} from "ui/errorBoundary";
import {captureHistoryReviewCancel} from '../wizardBundle';

const signalAborted = Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted')!.get!);

export default function WizardManager() {

  const ctx = useContext(ReactApplicationContext);
  const workingRequest = useStream(ctx => ctx.wizardService.workingRequest$);

  if (!workingRequest) {
    return null;
  }

  // Capture the actual owner/lifetime at render. A late handler must never
  // resolve ctx.wizardService afresh and cancel/report into its replacement.
  const wizard=ctx.wizardService,craft=ctx.craftService,project=ctx.projectService,manager=ctx.projectManager,
    generation=project.documentGeneration,signal=project.documentSignal,stream=wizard.workingRequest$,
    key=workingRequest.requestKey,insertStream=ctx.streams.wizard.insertOperation,insertion=insertStream.value,
    editingHistory=craft.isEditingHistory,cancel=wizard.cancel,updateState=wizard.updateState,
    cancelReview=craft.cancelHistoryReviewDraft,review=editingHistory&&insertion===null?captureHistoryReviewCancel(ctx,workingRequest):null;
  const current=()=>{
    try{return ctx.wizardService===wizard&&ctx.craftService===craft&&ctx.projectService===project&&ctx.projectManager===manager&&
      project.hasHostLifetime&&project.documentGeneration===generation&&project.documentSignal===signal&&project.isDocumentCurrent(generation)&&!signalAborted(signal)&&
      wizard.workingRequest$===stream&&stream.value?.requestKey===key&&wizard.cancel===cancel&&wizard.updateState===updateState&&
      ctx.streams.wizard.insertOperation===insertStream&&insertStream.value===insertion&&craft.cancelHistoryReviewDraft===cancelReview;}
    catch{return false;}
  };
  const onCancel=()=>{
    if(!current())return;
    try{
      if(insertion!==null){cancel.call(wizard);return;}
      if(editingHistory){
        if(!review)throw Error('The history review origin is unavailable.');
        cancelReview.call(craft,review);
      }else cancel.call(wizard);
    }catch{
      // Current unprovable modern review stays in place with a real visible
      // error. A newer request/document never receives the old handler's error.
      if(current())updateState.call(wizard,state=>{state.error={code:'STALE_HISTORY',userMessage:'The accepted history review changed. Reopen its preview before cancelling.'};});
    }
  };

  return <ErrorBoundary key={workingRequest.requestKey}
                        message={<span>operation error</span>}>
    <Wizard noFocus={workingRequest.hints?.noWizardFocus}
            onCancel={onCancel}
            onOK={wizard.applyWorkingRequest} />
  </ErrorBoundary>
}
