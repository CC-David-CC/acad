import React, {useContext, useEffect, useState} from 'react';
import {useStreamWithUpdater} from "ui/effects";
import {SketcherAppContext} from './SketcherAppContext';

const style = {
  width: '100%',
  resize: 'vertical',
  height: 100,
  background: 'inherit',
  border : 'none',
  color: '#C4E1A4'
};

export function SketcherDimensionView() {

  const [definitions] = useStreamWithUpdater(ctx => ctx.viewer.parametricManager.$constantDefinition);
  const {viewer} = useContext(SketcherAppContext);
  const [draft, setDraft] = useState(definitions || '');
  const [error, setError] = useState('');
  useEffect(() => { setDraft(definitions || ''); setError(''); }, [definitions]);

  const apply = () => {
    try { viewer.parametricManager.applyConstantDefinition(draft); setError(''); }
    catch (failure) { setError(failure.message || 'Unable to apply parameters.'); }
  };
  const cancel = () => { setDraft(definitions || ''); setError(''); };
  return <div>
    <textarea aria-label='Sketch parameters' style={style} id='dimTextArea' placeholder='for example: A = 50' value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); apply(); } else if (e.key === 'Escape') { e.preventDefault(); cancel(); } }} />
    <div>One definition per line. Ctrl+Enter applies; Escape discards.</div>
    {error && <div role='alert'>{error}</div>}
    <button type='button' onClick={apply}>Apply parameters</button>
    <button type='button' onClick={cancel}>Discard changes</button>
  </div>;

}
