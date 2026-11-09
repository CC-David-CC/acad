// Worker-only presentation of observed geometry. Authored references remain in
// the native document; an SVG is a revision-specific, read-only handoff.
import {captureLinkedPartDrawingDefinition} from '../../../../modules/drawing/linkedPartDrawingDefinition.mjs';
import {drawingFields,captureDrawingReadResult} from '../../../../modules/engine/mount/ownedDrawingReadProtocol.mjs';
import {unpackOrthographicRecord} from '../../../../modules/engine/mount/orthographicAnalyticRecord.mjs';

const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_REQUEST'});};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const num=value=>{if(!Number.isFinite(value)||Math.abs(value)>1e9)fail('Drawing paper coordinate exceeds its bound.');return String(Object.is(value,-0)?0:value);};
export function renderLinkedPartDrawingSvg({definition,read}) {
  const d=captureLinkedPartDrawingDefinition(definition);
  read=drawingFields(read,['version','unit','revision','geometryRevision','drawingId','target','status','observation','views']);
  const o=captureDrawingReadResult(read.observation,d);
  if(read.version!==1||read.unit!=='millimeter'||read.drawingId!==d.drawingId||!['available','unresolved'].includes(read.status)||[read.revision,read.geometryRevision].some(v=>typeof v!=='string'||!v||v.length>256)||!Array.isArray(read.views)||read.views.length>d.views.length||Reflect.ownKeys(read.views).length!==read.views.length+1)fail('Drawing read does not match its authored definition.');
  if(read.target!==null){
    const target=drawingFields(read.target,['bodyId','featureId','engine','engineRevision']);
    if(typeof target.bodyId!=='string'||!target.bodyId||target.bodyId.length>1024||target.featureId!==d.target.featureId||target.engine!==d.target.engine||target.engineRevision!==d.target.engineRevision)fail('Drawing target does not match its definition.');
  }else if(read.status==='available'||o.status==='available'||read.views.length)fail('Available drawing has no target.');
  for(let i=0;i<read.views.length;i++){
    const descriptor=Object.getOwnPropertyDescriptor(read.views,String(i));if(!descriptor?.enumerable||!Object.hasOwn(descriptor,'value'))fail('Drawing views must be dense own data.');
    const row=drawingFields(descriptor.value,['viewId','status','reason','metadata','values','tags']);
    if(row.viewId!==d.views[i].viewId||!['available','unavailable'].includes(row.status))fail('Drawing view order or identity changed.');
    if(row.status==='available'?row.reason!==null:typeof row.reason!=='string'||!row.reason||row.reason.length>256||row.metadata!==null||row.values!==null||row.tags!==null)fail('Invalid drawing view availability.');
  }
  const scale=d.sheet.scale.numerator/d.sheet.scale.denominator,paths=[],annotations=[],fallbackWarnings=[];
  let segments=0,status=read.status==='available'&&o.status==='available'?'available':'unresolved';
  const paper=(view,p)=>[view.paperOrigin[0]+p[0]*scale,view.paperOrigin[1]-p[1]*scale];
  const text=(p,value,attributes='')=>`<text x="${num(p[0])}" y="${num(p[1])}" ${attributes}>${escape(value)}</text>`;
  for(let index=0;index<d.views.length;index++) {
    const view=d.views[index],observed=read.views[index],frame=o.viewFrames.find(f=>f.viewId===view.viewId)?.frame;
    if(!observed||observed.viewId!==view.viewId||observed.status!=='available'||!frame) {
      status='unresolved';annotations.push(text(view.paperOrigin,view.basis+': unresolved','fill="#a00"'));continue;
    }
    const packed=unpackOrthographicRecord({metadata:observed.metadata,values:observed.values,tags:observed.tags},[...frame.origin,...frame.u,...frame.v,...frame.n]);
    for(const group of packed.groups)for(const curve of group.curves) {
      let points;
      if(curve.kind==='line')points=[curve.start,curve.end];
      else {
        // This approximation is solely SVG presentation. Bound chord error in
        // paper units by ||a||+||b||; measurements use separate Native facts.
        const radius=(Math.hypot(...curve.a)+Math.hypot(...curve.b))*scale;
        const sweep=curve.range[1]-curve.range[0],step=radius>0?Math.min(Math.PI/8,Math.sqrt(.16/radius)):Math.PI/8;
        const count=Math.max(1,Math.ceil(sweep/step));
        if(count>65536||segments+count>200000)throw Object.assign(Error('Drawing presentation exceeds its segment budget.'),{code:'RESOURCE_LIMIT'});
        points=Array.from({length:count+1},(_,i)=>{const t=curve.range[0]+sweep*i/count;return curve.center.map((c,k)=>c+curve.a[k]*Math.cos(t)+curve.b[k]*Math.sin(t));});
      }
      segments+=points.length-1;
      if(segments>200000)throw Object.assign(Error('Drawing presentation exceeds its segment budget.'),{code:'RESOURCE_LIMIT'});
      const path=points.map((p,i)=>{const q=paper(view,p);return(i?'L':'M')+num(q[0])+','+num(q[1]);}).join(' ');
      paths.push(`<path d="${path}"${d.version>=2?' data-view-id="'+escape(view.viewId)+'" data-view-basis="'+view.basis+'"':''}${group.visibility==='hidden'?' stroke-dasharray="2 1" stroke="#777"':''}/>`);
    }
    annotations.push(text([view.paperOrigin[0],view.paperOrigin[1]+5],view.basis));
  }
  for(let i=0;i<d.dimensions.length;i++) {
    const dimension=d.dimensions[i],fact=o.dimensions[i],view=d.views.find(v=>v.viewId===dimension.viewId),frame=o.viewFrames.find(v=>v.viewId===dimension.viewId)?.frame;
    if(fact.status!=='available'||!frame) {status='unresolved';annotations.push(text(dimension.label,'UNRESOLVED: '+dimension.dimensionId,'fill="#a00"'));continue;}
    const anchor=p=>{const v=p.map((x,k)=>x-frame.origin[k]);return paper(view,[v.reduce((s,x,k)=>s+x*frame.u[k],0),v.reduce((s,x,k)=>s+x*frame.v[k],0)]);};
    const ends=fact.anchors.map(anchor),label=dimension.label;
    paths.push(`<path d="M${ends.map(p=>p.map(num).join(',')).join(' L')}" stroke="#246"/>`);
    paths.push(`<path d="M${ends[0].map(num).join(',')} L${label.map(num).join(',')} M${ends[1].map(num).join(',')} L${label.map(num).join(',')}" stroke="#789" stroke-dasharray="1 1"/>`);
    const semantics=dimension.kind==='hole-diameter'?'Ø':dimension.kind==='edge-length'?'L ':dimension.kind==='plane-distance'?'ΔZ ':dimension.axis==='datum-x'?'ΔX ':'ΔY ';
    annotations.push(text(label,semantics+fact.value.toFixed(3)+' mm','fill="#124"'));
  }
  for(let i=0;i<(d.annotations?.length||0);i++){
    const a=d.annotations[i],row=o.annotations[i],view=d.views.find(v=>v.viewId===a.viewId),frame=o.viewFrames.find(v=>v.viewId===a.viewId)?.frame;
    const tag=`data-annotation-id="${escape(a.annotationId)}" data-annotation-kind="${a.kind}"`;
    if(row.status!=='available'||!frame){
      status='unresolved';const message='UNRESOLVED: '+a.annotationId+' ('+row.reason+')';
      // Center marks/axes have no authored paper label. Do not stack their
      // errors at one view origin; this bounded legend is derived SVG only.
      if(a.kind==='bore-center')fallbackWarnings.push({tag,viewId:a.viewId,message});
      else annotations.push(text(a.kind==='hole-callout'?a.label:a.labels[0],message,tag+' fill="#a00"'));
      continue;
    }
    const project=p=>{const v=p.map((n,k)=>n-frame.origin[k]);return paper(view,[v.reduce((n,x,k)=>n+x*frame.u[k],0),v.reduce((n,x,k)=>n+x*frame.v[k],0)]);};
    const path=(points,attributes='')=>paths.push(`<path ${tag} d="M${points.map(p=>p.map(num).join(',')).join(' L')}" stroke="#357" ${attributes}/>`);
    const f=row.facts;
    if(a.kind==='bore-center'){
      if(view.basis==='top'){const c=project(f.center),extent=f.diameter*scale/2+a.extension;path([[c[0]-extent,c[1]],[c[0]+extent,c[1]]],'stroke-dasharray="4 1 1 1"');path([[c[0],c[1]-extent],[c[0],c[1]+extent]],'stroke-dasharray="4 1 1 1"');}
      else{const ends=f.ends.map(project),delta=ends[1].map((n,k)=>n-ends[0][k]),length=Math.hypot(...delta);if(!(length>0))fail('A measured bore axis has no extent in the selected view.');const extra=delta.map(n=>n/length*a.extension);path([ends[0].map((n,k)=>n-extra[k]),ends[1].map((n,k)=>n+extra[k])],'stroke-dasharray="4 1 1 1"');}
    }else if(a.kind==='hole-callout'){
      for(const center of f.centers)path([project(center),a.label],'stroke-dasharray="1 1"');
      annotations.push(text(a.label,`${f.count}×Ø${f.diameter.toFixed(3)} THRU`,tag+' fill="#124"'));
    }else{
      const values=a.kind==='ordinate'?f.coordinates:f.values;
      for(let j=0;j<4;j++){const ends=f.anchors[j].map(project);path(ends);path([ends[1],a.labels[j]],'stroke-dasharray="1 1"');annotations.push(text(a.labels[j],(a.kind==='ordinate'?(values[j]>=0?'+':''):'Δ')+values[j].toFixed(3)+' mm',tag+` data-member-index="${j}" fill="#124"`));}
    }
  }
  if(fallbackWarnings.length){
    // Physical paper units: 3mm glyph height, fixed 1.8mm monospace advance,
    // 4mm baselines, 8mm margins and a 10mm footer exclusion. Wrapping never
    // changes or truncates actual identity/reason membership. Tiny sheets
    // refuse this presentation instead of emitting clipped/stacked warnings.
    const margin=8,advance=1.8,lineHeight=4,capacity=Math.min(120,Math.floor((d.sheet.width-2*margin)/advance));
    if(capacity<1)throw Object.assign(Error('The sheet has no bounded warning legend width.'),{code:'RESOURCE_LIMIT'});
    const rows=fallbackWarnings.map(w=>{const chars=Array.from(w.message),lines=[];for(let at=0;at<chars.length;at+=capacity)lines.push(chars.slice(at,at+capacity).join(''));return{...w,lines};});
    const count=rows.reduce((n,w)=>n+w.lines.length,0),first=d.sheet.height-10-(count-1)*lineHeight;
    if(count>256||first<16)throw Object.assign(Error('The sheet has no legible warning legend area.'),{code:'RESOURCE_LIMIT'});
    let line=0;
    for(const warning of rows){const y=first+line*lineHeight,spans=warning.lines.map(value=>{const at=first+line++*lineHeight;return`<tspan x="${margin}" y="${num(at)}" textLength="${num(Array.from(value).length*advance)}" lengthAdjust="spacingAndGlyphs">${escape(value)}</tspan>`;}).join('');
      annotations.push(`<text x="${margin}" y="${num(y)}" ${warning.tag} data-warning-layout="sheet-legend-v1" data-warning-view-id="${escape(warning.viewId)}" font-family="monospace" font-size="3" fill="#a00" aria-label="${escape(warning.message)}">${spans}</text>`);
    }
  }
  const title=text([8,8],d.title||d.drawingId),notice=text([8,d.sheet.height-5],`Reference drawing · ${status} · scale ${d.sheet.scale.numerator}:${d.sheet.scale.denominator}`);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${num(d.sheet.width)}mm" height="${num(d.sheet.height)}mm" viewBox="0 0 ${num(d.sheet.width)} ${num(d.sheet.height)}"><title>${escape(d.title)}</title><metadata>${escape(JSON.stringify({version:1,drawingId:d.drawingId,revision:read.revision,geometryRevision:read.geometryRevision,quality:o.quality,status,...(d.version>=2?{definitionVersion:d.version,viewCount:d.views.length,projection:d.views.some(v=>v.basis==='isometric')?'source-relative-isometric-v1':'source-relative-orthographic-v1'}:{}),...(d.version===3?{annotationFacts:o.annotations,annotationRole:'derived-native-bore-reference',ordinateRole:'signed-datum-coordinate'}:{}),curvePresentationTolerancePaperMm:.02,dimensionRole:'reference'}))}</metadata><rect width="100%" height="100%" fill="white"/><g fill="none" stroke="#111" stroke-width=".25">${paths.join('')}</g><g font-family="sans-serif" font-size="3">${title}${annotations.join('')}${notice}</g></svg>`;
  const bytes=new TextEncoder().encode(svg);
  if(bytes.byteLength>16*1024*1024)throw Object.assign(Error('Drawing SVG exceeds its byte budget.'),{code:'RESOURCE_LIMIT'});
  return {format:'svg',mime:'image/svg+xml',status,drawingId:d.drawingId,revision:read.revision,geometryRevision:read.geometryRevision,buffer:bytes.buffer};
}
