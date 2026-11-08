import React,{useEffect,useRef} from 'react';
import Stack from 'ui/components/Stack';
import connect from 'ui/connect';
import Fa from 'ui/components/Fa';
import ImgIcon from 'ui/components/ImgIcon';
import ls from './OperationHistory.less';
import cx from 'classnames';
import ButtonGroup from 'ui/components/controls/ButtonGroup';
import Button from 'ui/components/controls/Button';
import {captureHistoryNavigation} from '../historyNavigation';
import mapContext from 'ui/mapContext';
import decoratorChain from 'ui/decoratorChain';
import {EMPTY_OBJECT} from 'gems/objects';

function OperationHistory({history, pointer, setHistoryPointer, getOperation}) {
  const mounted=useRef(true);useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const lastMod = history.length - 1;
  return <Stack>

    {history.map(({type, params}, index) => {

      const {appearance, label, paramsInfo, paramsInfoComponent: PIComp} = getOperation(type)||EMPTY_OBJECT;
      return <div key={index} data-history-navigation='floating-edit' data-history-entry-index={index} onClick={() => setHistoryPointer(index ? history[index-1] : null,()=>mounted.current)} 
                  className={cx(ls.item, pointer + 1 === index && ls.selected)}>
        {appearance && <ImgIcon url={appearance.icon32} size={16}/>}
        <span className={ls.opLabel}>{label} {PIComp ? <PIComp params={params}/> : (paramsInfo && paramsInfo(params))} </span>
        <span className={ls.buttons}>
          <Fa icon='edit' />
          <Fa icon='image' />
          <span aria-disabled='true' onClick={event=>event.stopPropagation()} title='Use checked feature deletion in the selected operation panel.' aria-label='Use checked feature deletion in the selected operation panel.'><Fa icon='remove' className={ls.danger} aria-disabled='true'/></span>
        </span>
      </div>;
    })}
    {pointer !== lastMod && <ButtonGroup>
      <Button data-history-navigation='floating-tip' onClick={() => setHistoryPointer(history[lastMod],()=>mounted.current)}>Finish History Editing</Button>
    </ButtonGroup>}
  </Stack>;
}

export default decoratorChain(
  connect(streams => streams.craft.modifications),
  mapContext((ctx,props) => ({
    getOperation: ctx.services.operation.get,
    setHistoryPointer: captureHistoryNavigation(ctx,props.history)
  }))
)(OperationHistory);

