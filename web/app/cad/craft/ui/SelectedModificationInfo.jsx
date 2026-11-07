import React, {useContext, useEffect, useState} from 'react';
import connect from 'ui/connect';
import Widget from 'ui/components/Widget';
import decoratorChain from 'ui/decoratorChain';
import {combine, merger} from 'lstream';
import ls from './SelectedModificationInfo.less';
import ImgIcon from 'ui/components/ImgIcon';
import mapContext from 'ui/mapContext';
import {EMPTY_OBJECT} from 'gems/objects';
import ButtonGroup from 'ui/components/controls/ButtonGroup';
import Button from 'ui/components/controls/Button';
import {ReactApplicationContext} from "cad/dom/ReactApplicationContext";
import {resolveAppearance} from "cad/craft/operationHelper";

function SelectedModificationInfo({ history, index,
                                    operationRegistry,
                                    locationHint: lh,
                                    drop, edit,
                                    close}) {
  const ctx = useContext(ReactApplicationContext);
  const [deleting,setDeleting]=useState(false),[deleteError,setDeleteError]=useState('');
  const deleteSelected=async()=>{
    if(deleting)return;setDeleting(true);setDeleteError('');
    try{await drop();}catch(error){setDeleteError(typeof error?.message==='string'?error.message:'The feature could not be deleted.');}
    finally{setDeleting(false);}
  };

  useEffect(() => {

    function clickAwayHandler() {
      ctx.streams.ui.craft.modificationSelection.next(EMPTY_OBJECT);
    }

    ctx.domService.viewerContainer.addEventListener('click', clickAwayHandler);
    return () => {
      ctx.domService.viewerContainer.removeEventListener('click', clickAwayHandler);
    }
  }, []);
  const m = history[index];
  const visible = !!m;
  if (!visible) {
    return null;
  }
  const op = operationRegistry[m.type];
  if (!op) {
    console.warn('unknown operation ' + m.type);
    return;
  }
  const appearance = resolveAppearance(op, m.params);

  return <Widget visible={visible}
                 left={lh && lh.x}
                 bottom={95}
                 flatRight={!lh}
                 title={appearance.label.toUpperCase() + ' operation #' + m.params.featureId}
                 onClose={close}>
    <div className={ls.requestInfo}>
      <ImgIcon className={ls.pic} url={appearance && appearance.icon96} size={48}/>
      {/*<RenderObject object={m.params}/>*/}
        
      
    </div>
    <div>
      <ButtonGroup>
        <Button onClick={edit}>✏️EDIT</Button>
        <Button type='danger' disabled={deleting} onClick={deleteSelected}>{deleting?'Deleting…':'🗑DELETE'}</Button>
      </ButtonGroup>
      {deleteError&&<p role='status'>{deleteError}</p>}
    </div>
  </Widget>;
}

export default decoratorChain(
  connect(streams => combine(streams.ui.craft.modificationSelection,
    streams.operation.registry.map(r => ({operationRegistry: r})),
    streams.craft.modifications
  ).map(merger)),
  mapContext((ctx, props) => ({
    close: () => ctx.streams.ui.craft.modificationSelection.next(EMPTY_OBJECT),
    drop: async () => {
      const craft=ctx.craftService;
      if(typeof craft.inspectWorkerFeatureDeletions!=='function'||typeof craft.deleteWorkerFeature!=='function')throw Error('Checked feature deletion is unavailable.');
      const inspection=craft.inspectWorkerFeatureDeletions(),operation=ctx.streams.craft.modifications.value.history[props.index],featureId=Number(operation?.params?.featureId);
      const candidate=inspection.features.find(row=>row.index===props.index&&row.featureId===featureId);
      if(!candidate?.canDelete)throw Error(candidate?.reason||'Checked deletion is not supported for this feature.');
      await craft.deleteWorkerFeature({revision:inspection.revision,index:props.index,featureId});
      ctx.streams.ui.craft.modificationSelection.next(EMPTY_OBJECT);
    },
    edit: () => {
      ctx.streams.craft.modifications.update(({history}) => ({history, pointer: props.index - 1}))
      ctx.streams.ui.craft.modificationSelection.next(EMPTY_OBJECT);
    }
  }))
)(SelectedModificationInfo);
  
