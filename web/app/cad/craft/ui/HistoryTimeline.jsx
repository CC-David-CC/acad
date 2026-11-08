import {historyViewportWindow,historyPointerScrollLeft,HISTORY_SLOT_WIDTH} from './historyViewportWindow.mjs';
import React from 'react';
import ls from './HistoryTimeline.less';
import connect from 'ui/connect';
import decoratorChain from 'ui/decoratorChain';
import {captureHistoryNavigation} from '../historyNavigation';
import mapContext from 'ui/mapContext';
import ImgIcon from 'ui/components/ImgIcon';
import cx from 'classnames';
import Fa from 'ui/components/Fa';
import {combine} from 'lstream';
import {EMPTY_OBJECT} from 'gems/objects';
import {aboveElement} from 'ui/positionUtils';
import {resolveAppearance} from "cad/craft/operationHelper";
import {menuAboveElementHint} from "cad/dom/menu/menuUtils";

@connect(streams => combine(streams.craft.modifications, streams.operation.registry, streams.wizard.insertOperation)
  .map(([modifications, operationRegistry, insertOperationReq]) => ({
    ...modifications,
    operationRegistry,
    inProgressOperation: !!insertOperationReq,
    getOperation: type => operationRegistry[type]||EMPTY_OBJECT
  })))
@mapContext((ctx,props) => ({
  setHistoryPointer: captureHistoryNavigation(ctx,props.history),
  rebuild: () => ctx.services.craft.rebuild()
}))
export default class HistoryTimeline extends React.Component {

  state = {historyRef: null, pointerRef: null, futureRef: null, left: 0, width: 0};
  mounted = false;
  frame = null;
  frameEpoch = 0;

  static getDerivedStateFromProps(props, state) {
    const {history, pointer, inProgressOperation} = props;
    if (history === state.historyRef && pointer === state.pointerRef && inProgressOperation === state.futureRef) return null;
    return {historyRef: history, pointerRef: pointer, futureRef: inProgressOperation,
      left: historyPointerScrollLeft(history.length, pointer, state.width, inProgressOperation ? pointer + 1 : -1)};
  }

  render() {
    const {history, pointer, rebuild, getOperation, inProgressOperation} = this.props;
    const eof = history.length - 1;
    const range = historyViewportWindow(history.length, this.state.left, this.state.width, inProgressOperation ? pointer + 1 : -1);
    const setPointer = value => this.setPointer(history, value);
    return <div className={cx(ls.root, ' small-typography')} ref={this.keepRef}
                data-history-count={history.length} data-history-window-start={range.start} data-history-window-end={range.end}>
      <Controls rebuild={rebuild} history={history} pointer={pointer} eoh={eof} setHistoryPointer={setPointer}/>
      <div className={ls.scroller} onClick={() => this.scrollBy(-60)}><Fa icon='caret-left'/></div>
      <div className={ls.history} ref={this.keepScroller} onScroll={this.onScroll}
           aria-label={'Feature history, ' + history.length + ' features'}>
        <div className={ls.spacer} style={{width: range.leftWidth}} aria-hidden='true'/>
        {history.slice(range.start, range.end).map((m, offset) => {
          const i = range.start + offset;
          const future = inProgressOperation && i - 1 === pointer;
          const isCurrent = () => this.mounted && this.props.history === history && this.props.history[i] === m;
          return <div key={i} className={ls.historySlot} style={{width: HISTORY_SLOT_WIDTH * (future ? 2 : 1)}}
                      data-history-index={i} aria-posinset={i + 1} aria-setsize={history.length}>
            <Timesplitter beforeIndex={i} active={i - 1 === pointer} onClick={() => setPointer(i - 1)}/>
            {future && <FutureItem appearance={getOperation(inProgressOperation).appearance}/>}
            <HistoryItem index={i} modification={m} getOperation={getOperation} isCurrent={isCurrent}
                         disabled={pointer < i} inProgress={!inProgressOperation && pointer === i - 1}/>
          </div>;
        })}
        <div className={ls.spacer} style={{width: range.rightWidth}} aria-hidden='true'/>
        <Timesplitter beforeIndex={history.length} eoh active={eof === pointer} onClick={() => setPointer(eof)}/>
        {inProgressOperation && eof === pointer && <FutureItem appearance={getOperation(inProgressOperation).appearance}/>}
      </div>
      <div className={ls.scroller} onClick={() => this.scrollBy(60)}><Fa icon='caret-right'/></div>
      <AddButton/>
    </div>;
  }

  setPointer = (history, pointer) => {
    if (this.mounted && this.props.history === history && pointer >= -1 && pointer < history.length)
      this.props.setHistoryPointer(pointer < 0 ? null : history[pointer], () => this.mounted);
  };
  keepRef = el => this.el = el;
  keepScroller = el => this.scroller = el;
  scrollBy = amount => {
    if (this.mounted && this.scroller) this.scroller.scrollLeft += amount;
  };

  cancelFrame = () => {
    this.frameEpoch++;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  };
  queueFrame = callback => {
    this.cancelFrame();
    const epoch = this.frameEpoch, history = this.props.history;
    const frame = requestAnimationFrame(() => {
      if (this.frame === frame) this.frame = null;
      if (!this.mounted || epoch !== this.frameEpoch || history !== this.props.history) return;
      callback();
    });
    this.frame = frame;
  };
  onScroll = () => this.queueFrame(() => {
    const {scrollLeft, clientWidth} = this.scroller;
    if (scrollLeft !== this.state.left || clientWidth !== this.state.width) this.setState({left: scrollLeft, width: clientWidth});
  });
  measure = () => {
    if (!this.mounted || !this.scroller) return;
    const width = this.scroller.clientWidth;
    const left = historyViewportWindow(this.props.history.length, this.state.left, width,
      this.props.inProgressOperation ? this.props.pointer + 1 : -1).scrollLeft;
    if (width !== this.state.width || left !== this.state.left) this.setState({width, left});
  };
  componentDidMount() {
    this.mounted = true;
    if (typeof ResizeObserver === 'function') {
      this.resize = new ResizeObserver(this.measure);
      this.resize.observe(this.scroller);
    } else window.addEventListener('resize', this.measure);
    this.measure();
    this.queueFrame(() => { this.scroller.scrollLeft = this.state.left; });
  }
  componentDidUpdate(previousProps, previousState) {
    if (previousProps.history !== this.props.history || previousProps.pointer !== this.props.pointer ||
        previousProps.inProgressOperation !== this.props.inProgressOperation || previousState.left !== this.state.left) {
      this.queueFrame(() => { this.scroller.scrollLeft = this.state.left; });
    }
  }
  componentWillUnmount() {
    this.mounted = false;
    this.cancelFrame();
    this.resize?.disconnect();
    window.removeEventListener('resize', this.measure);
    this.scroller = null;
    this.el = null;
  }

}


function OperationIcon({appearance}) {
  if (appearance && appearance.icon) {
    const Icon = appearance.icon;
    return <Icon size={24}/>;
  }
  return <ImgIcon url={appearance&&appearance.icon96} size={24} />;
}

function FutureItem({appearance}) {
  return <div className={cx(ls.futureItem, ls.inProgress)}>
    <OperationIcon appearance={appearance} />
  </div>;

}

function Timesplitter({active, eoh, onClick, beforeIndex}) {
  
  return <div className={cx(ls.timesplitter, active&&ls.active, eoh&&ls.eoh)} >
    <div className={ls.handle} data-history-navigation='splitter' data-history-before-index={beforeIndex} onClick={onClick}>
      <Handle />
    </div>
  </div>;
}

function Handle() {
  const w = 12;
  const h = 15;
  const m = Math.round(w * 0.5);
  const t = Math.round(h * 0.5);
  return <svg xmlns="http://www.w3.org/2000/svg" height={h} width={w} >
    <polygon className={ls.handlePoly} points={`0,0 ${w},0 ${w},${t} ${m},${h} 0,${t}`}
             style={{strokeWidth:0.5}} />
  </svg>;
}

function Controls({rebuild, history, pointer, eoh, setHistoryPointer, }) {
  const noB = pointer===-1;
  const noF = pointer===eoh;
  return <React.Fragment>
    <div className={cx(ls.controlBtn, !history.length&&ls.disabled)} onClick={rebuild}>
      <Fa icon='repeat' fw/>
    </div>
    <div data-history-navigation='backward' className={cx(ls.controlBtn, noB&&ls.disabled)} onClick={noB?undefined :() => setHistoryPointer(pointer-1)}>
      <Fa icon='step-backward' fw/>
    </div>
    <div data-history-navigation='forward' className={cx(ls.controlBtn, noF&&ls.disabled)} onClick={noF?undefined :() => setHistoryPointer(pointer+1)}>
      <Fa icon='step-forward' fw/>
    </div>
    <div data-history-navigation='tip' className={cx(ls.controlBtn, noF&&ls.disabled)} onClick={noF?undefined :() => setHistoryPointer(eoh)}>
      <Fa icon='fast-forward' fw/>
    </div>
  </React.Fragment>;
}

const HistoryItem = decoratorChain( 
  connect((streams, props) => streams.ui.craft.modificationSelection.map(s => ({
    selected: s.index === props.index,
  }))),
  mapContext(({streams}) => ({
  toggle: (index, modification, el) => streams.ui.craft.modificationSelection.update(s => 
    s.index === index ? EMPTY_OBJECT : {index, locationHint: aboveElement(el)})
}))
)
( // eslint-disable-line no-unexpected-multiline
function HistoryItem({index, pointer, modification, getOperation, toggle, selected, disabled, inProgress, isCurrent}) {
  const operation = getOperation(modification.type);
  const appearance = resolveAppearance(operation, modification.params);
  return <div data-history-navigation='select-feature' data-history-entry-index={index} className={cx(ls.historyItem, selected&&ls.selected, disabled&&ls.disabled, inProgress&&ls.inProgress)}
              onClick={e => { if (isCurrent()) toggle(index, modification, e.currentTarget); }}>
    <OperationIcon appearance={appearance} />
    <span className={ls.opIndex}>{ modification.params.featureId ?? index + 1 }</span>
  </div>;
});

const AddButton = mapContext((ctx) => ({
  showCraftMenu: e => ctx.actionService.run('menu.craft', menuAboveElementHint(e.currentTarget))
}))(
  function AddButton({showCraftMenu}) {
    return <div className={ls.add} onClick={showCraftMenu}>
      <Fa icon='plus' fw/>
    </div>;
  }
);
