import {layoutDrawingViewCaptions} from './linkedPartDrawingCaptionLayout.mjs';
import {layoutDrawingWarnings} from './linkedPartDrawingWarningLayout.mjs';
import {renderDrawingRequirementForms} from './linkedPartDrawingRequirementForms.mjs';
import {layoutDrawingDimensions,DRAWING_DIMENSION_LAYOUT_LIMITS} from './linkedPartDrawingDimensionLayout.mjs';
import {unpackDrawingSection} from '../../../../modules/engine/mount/ownedDrawingSectionProtocol.mjs';
import {unpackDrawingDetail} from '../../../../modules/engine/mount/drawingDetailClip.mjs';
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
    const detail=d.views[i].basis==='detail',row=drawingFields(descriptor.value,['viewId','status','reason','metadata',...(detail?['intervals']:['values','tags'])]);
    if(row.viewId!==d.views[i].viewId||!['available','unavailable'].includes(row.status))fail('Drawing view order or identity changed.');
    if(row.status==='available'?row.reason!==null:typeof row.reason!=='string'||!row.reason||row.reason.length>256||row.metadata!==null||(detail?row.intervals!==null:row.values!==null||row.tags!==null))fail('Invalid drawing view availability.');
  }
  const scale=d.sheet.scale.numerator/d.sheet.scale.denominator,paths=[],annotations=[],warnings=[],fallbackWarnings=[],patterns=[],captions=[],strokeBounds=[],labelBoxes=[],dimensionRows=[],geometrySegments=[],annotationLeaders=[];
  let captionBottom=d.sheet.height-16;
  let segments=0,status=read.status==='available'&&o.status==='available'?'available':'unresolved';
  const viewScale=view=>view.basis==='detail'?view.scale.numerator/view.scale.denominator:scale;
  const paper=(view,p)=>[view.paperOrigin[0]+p[0]*viewScale(view),view.paperOrigin[1]-p[1]*viewScale(view)];
  const text=(p,value,attributes='')=>`<text x="${num(p[0])}" y="${num(p[1])}" ${attributes}>${escape(value)}</text>`;
  const stroke=points=>{if(!points.length)return;strokeBounds.push({min:[0,1].map(k=>Math.min(...points.map(p=>p[k]))),max:[0,1].map(k=>Math.max(...points.map(p=>p[k])))});};
  // Conservative declared paper obstacle for successful, unchanged authored
  // text. This is not an arbitrary installed-font ink certificate.
  const authoredText=(p,value,attributes)=>{labelBoxes.push({min:[p[0]-1,p[1]-4],max:[p[0]+Array.from(value).length*3+1,p[1]+2]});return text(p,value,attributes);};
  for(let index=0;index<d.views.length;index++) {
    const view=d.views[index],observed=read.views[index],frame=o.viewFrames.find(f=>f.viewId===view.viewId)?.frame;
    if(!observed||observed.viewId!==view.viewId||observed.status!=='available'||!frame) {
      status='unresolved';captions.push({viewId:view.viewId,role:'view',value:view.basis+': unresolved',origin:view.paperOrigin,bounds:null,unresolved:true});continue;
    }
    // Caption placement is derived presentation only. Bounds come from the
    // actual admitted analytic projection/cap packet, never mesh or nominal
    // feature dimensions. A conic's full ellipse envelope conservatively
    // contains its finite trim; detail uses its actual authored aperture.
    let viewBounds=null,emptyDetail=false;
    const boundPoint=p=>{const q=paper(view,p);if(!viewBounds)viewBounds={min:[...q],max:[...q]};else for(let j=0;j<2;j++){viewBounds.min[j]=Math.min(viewBounds.min[j],q[j]);viewBounds.max[j]=Math.max(viewBounds.max[j],q[j]);}};
    const boundCurve=curve=>{
      if(curve.kind==='line'){boundPoint(curve.start);boundPoint(curve.end);}
      else{const extent=curve.a.map((n,j)=>Math.hypot(n,curve.b[j]));boundPoint(curve.center.map((n,j)=>n-extent[j]));boundPoint(curve.center.map((n,j)=>n+extent[j]));}
    };
    const caption=(value,role='view')=>captions.push({viewId:view.viewId,role,value,origin:view.paperOrigin,bounds:viewBounds,unresolved:false});
    if(view.basis==='bore-center-section'){
      const section=unpackDrawingSection({metadata:observed.metadata,values:observed.values,tags:observed.tags},[...frame.origin,...frame.u,...frame.v,...frame.n]),id='drawing-section-hatch-'+index;
      patterns.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><path d="M0,0 L0,4" stroke="#777" stroke-width=".2"/></pattern>`);
      for(const patch of section.patches){
        for(const edge of patch){boundPoint(edge.start);boundPoint(edge.end);}
        const polygon=patch.map((edge,i)=>{const p=paper(view,edge.start);return(i?'L':'M')+p.map(num).join(',');}).join(' ')+' Z';
        paths.push(`<path data-view-id="${escape(view.viewId)}" data-view-basis="bore-center-section" data-presentation="section-hatch" data-section-area="${num(section.area)}" d="${polygon}" fill="url(#${id})" stroke="none"/>`);
        for(const edge of patch)if(edge.boundary){const a=paper(view,edge.start),b=paper(view,edge.end);geometrySegments.push([a,b]);paths.push(`<path data-view-id="${escape(view.viewId)}" data-view-basis="bore-center-section" data-cut-boundary="true" d="M${a.map(num).join(',')} L${b.map(num).join(',')}"/>`);}
        segments+=patch.length*2;
      }
      if(segments>200000)throw Object.assign(Error('Drawing section exceeds its presentation segment budget.'),{code:'RESOURCE_LIMIT'});
      caption('bore-center-section');continue;
    }
    let packed;
    if(view.basis==='detail'){
      const parent=read.views.find(v=>v.viewId===view.parentViewId),parentFrame=o.viewFrames.find(v=>v.viewId===view.parentViewId)?.frame;
      if(parent?.status!=='available'||!parentFrame)fail('An available detail has no actual parent projection.');
      packed=unpackDrawingDetail({packet:{metadata:observed.metadata,intervals:observed.intervals},parent:{metadata:parent.metadata,values:parent.values,tags:parent.tags},parentFrame,frame,view});
      const hw=view.aperture.halfWidth,hh=view.aperture.halfHeight,corners=[[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh],[-hw,-hh]].map(p=>paper(view,p));
      for(let i=1;i<corners.length;i++)geometrySegments.push([corners[i-1],corners[i]]);
      for(const point of [[-hw,-hh],[hw,hh]])boundPoint(point);
      paths.push(`<path data-view-id="${escape(view.viewId)}" data-presentation="detail-aperture" d="M${corners.map(p=>p.map(num).join(',')).join(' L')}" stroke="#777" stroke-dasharray="1 1"/>`);
      emptyDetail=packed.empty;
    }else packed=unpackOrthographicRecord({metadata:observed.metadata,values:observed.values,tags:observed.tags},[...frame.origin,...frame.u,...frame.v,...frame.n]);
    for(const group of packed.groups)for(const curve of group.curves) {
      if(view.basis!=='detail')boundCurve(curve);
      let points;
      if(curve.kind==='line')points=[curve.start,curve.end];
      else {
        // This approximation is solely SVG presentation. Bound chord error in
        // paper units by ||a||+||b||; measurements use separate Native facts.
        const radius=(Math.hypot(...curve.a)+Math.hypot(...curve.b))*viewScale(view);
        const sweep=curve.range[1]-curve.range[0],step=radius>0?Math.min(Math.PI/8,Math.sqrt(.16/radius)):Math.PI/8;
        const count=Math.max(1,Math.ceil(sweep/step));
        if(count>65536||segments+count>200000)throw Object.assign(Error('Drawing presentation exceeds its segment budget.'),{code:'RESOURCE_LIMIT'});
        points=Array.from({length:count+1},(_,i)=>{const t=curve.range[0]+sweep*i/count;return curve.center.map((c,k)=>c+curve.a[k]*Math.cos(t)+curve.b[k]*Math.sin(t));});
      }
      segments+=points.length-1;
      if(segments>200000)throw Object.assign(Error('Drawing presentation exceeds its segment budget.'),{code:'RESOURCE_LIMIT'});
      const path=points.map((p,i)=>{const q=paper(view,p);return(i?'L':'M')+num(q[0])+','+num(q[1]);}).join(' ');
      for(let i=1;i<points.length;i++)geometrySegments.push([paper(view,points[i-1]),paper(view,points[i])]);
      paths.push(`<path d="${path}"${d.version>=2?' data-view-id="'+escape(view.viewId)+'" data-view-basis="'+view.basis+'"':''}${group.visibility==='hidden'?' stroke-dasharray="2 1" stroke="#777"':''}/>`);
    }
    caption(view.basis+(view.basis==='detail'?' 2:1':''));
    if(emptyDetail)caption('detail: available-empty','empty');
  }
  for(let i=0;i<d.dimensions.length;i++) {
    const dimension=d.dimensions[i],fact=o.dimensions[i],view=d.views.find(v=>v.viewId===dimension.viewId),frame=o.viewFrames.find(v=>v.viewId===dimension.viewId)?.frame;
    if(fact.status!=='available'||!frame) {status='unresolved';warnings.push({role:'dimension',id:dimension.dimensionId,viewId:dimension.viewId,message:'UNRESOLVED: '+dimension.dimensionId});continue;}
    const anchor=p=>{const v=p.map((x,k)=>x-frame.origin[k]);return paper(view,[v.reduce((s,x,k)=>s+x*frame.u[k],0),v.reduce((s,x,k)=>s+x*frame.v[k],0)]);};
    const ends=fact.anchors.map(anchor),label=dimension.label;
    const semantics=dimension.kind==='hole-diameter'?'Ø':dimension.kind==='edge-length'?'L ':dimension.kind==='plane-distance'?'ΔZ ':dimension.axis==='datum-x'?'ΔX ':'ΔY ';
    const valueText=semantics+fact.value.toFixed(3)+' mm',labelBox={min:[label[0]-1,label[1]-4],max:[label[0]+Array.from(valueText).length*3+1,label[1]+2]};
    labelBoxes.push(labelBox);dimensionRows.push({dimensionId:dimension.dimensionId,viewId:dimension.viewId,ends,label,labelBox,valueText,pathIndex:paths.length,textIndex:annotations.length});paths.push(null);annotations.push(null);
  }
  for(let i=0;i<(d.annotations?.length||0);i++){
    const a=d.annotations[i],row=o.annotations[i],view=d.views.find(v=>v.viewId===a.viewId),frame=o.viewFrames.find(v=>v.viewId===a.viewId)?.frame;
    const tag=`data-annotation-id="${escape(a.annotationId)}" data-annotation-kind="${a.kind}"`;
    if(row.status!=='available'||!frame){
      status='unresolved';const message='UNRESOLVED: '+a.annotationId+' ('+row.reason+')';
      // Center marks/axes have no authored paper label. Do not stack their
      // errors at one view origin; this bounded legend is derived SVG only.
      const warning={role:'annotation',id:a.annotationId,viewId:a.viewId,message,tag};warnings.push(warning);
      if(a.kind==='bore-center')fallbackWarnings.push(warning);
      continue;
    }
    const project=p=>{const v=p.map((n,k)=>n-frame.origin[k]);return paper(view,[v.reduce((n,x,k)=>n+x*frame.u[k],0),v.reduce((n,x,k)=>n+x*frame.v[k],0)]);};
    const path=(points,attributes='')=>{stroke(points);if(attributes==='stroke-dasharray="1 1"')for(let i=1;i<points.length;i++)annotationLeaders.push([points[i-1],points[i]]);paths.push(`<path ${tag} d="M${points.map(p=>p.map(num).join(',')).join(' L')}" stroke="#357" ${attributes}/>`);};
    const f=row.facts;
    if(a.kind==='bore-center'){
      if(view.basis==='top'||view.basis==='detail'){const c=project(f.center),extent=f.diameter*viewScale(view)/2+a.extension;path([[c[0]-extent,c[1]],[c[0]+extent,c[1]]],'stroke-dasharray="4 1 1 1"');path([[c[0],c[1]-extent],[c[0],c[1]+extent]],'stroke-dasharray="4 1 1 1"');}
      else{const ends=f.ends.map(project),delta=ends[1].map((n,k)=>n-ends[0][k]),length=Math.hypot(...delta);if(!(length>0))fail('A measured bore axis has no extent in the selected view.');const extra=delta.map(n=>n/length*a.extension);path([ends[0].map((n,k)=>n-extra[k]),ends[1].map((n,k)=>n+extra[k])],'stroke-dasharray="4 1 1 1"');}
    }else if(a.kind==='hole-callout'){
      for(const center of f.centers)path([project(center),a.label],'stroke-dasharray="1 1"');
      annotations.push(authoredText(a.label,`${f.count}×Ø${f.diameter.toFixed(3)} THRU`,tag+' fill="#124"'));
    }else{
      const values=a.kind==='ordinate'?f.coordinates:f.values;
      for(let j=0;j<4;j++){const ends=f.anchors[j].map(project);path(ends);path([ends[1],a.labels[j]],'stroke-dasharray="1 1"');annotations.push(authoredText(a.labels[j],(a.kind==='ordinate'?(values[j]>=0?'+':''):'Δ')+values[j].toFixed(3)+' mm',tag+` data-member-index="${j}" fill="#124"`));}
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
    captionBottom=Math.min(captionBottom,first-5);
    // Preserve the already-qualified caption reservation. The old legend is
    // replaced only after those captions have been placed unchanged below.
  }
  // Layout only AFTER every actual view envelope and warning band is known.
  // textLength adjusts spacing only; fixed3mm glyph size never shrinks.
  const placedCaptions=layoutDrawingViewCaptions({sheet:d.sheet,captions,bottom:captionBottom});
  for(const c of placedCaptions){
    const attrs=`data-view-caption-id="${escape(c.viewId)}" data-caption-role="${c.role}" data-caption-layout="observed-sheet-v1" font-family="monospace" font-size="3" textLength="${num(c.textLength)}" lengthAdjust="spacing"${c.unresolved?' fill="#a00"':''}`;
    annotations.push(text([c.x,c.y],c.value,attrs));
  }
  const geometryBounds=captions.filter(c=>c.bounds).map(c=>c.bounds),captionBoxes=placedCaptions.map(c=>({min:[c.x-1,c.y-4],max:[c.x+c.textLength+1,c.y+2]}));
  const requirementForms=renderDrawingRequirementForms({definition:d,observation:o,views:read.views,geometryBounds,strokeBounds,labelBoxes,captionBoxes});
  paths.push(...requirementForms.paths);annotations.push(...requirementForms.annotations);warnings.push(...requirementForms.warnings);strokeBounds.push(...requirementForms.strokeBounds);labelBoxes.push(...requirementForms.labelBoxes);
  if(requirementForms.warnings.length)status='unresolved';
  const dimensionLayout=layoutDrawingDimensions({sheet:d.sheet,dimensions:dimensionRows,labelBoxes,captionBoxes,geometrySegments,geometryBounds,existingLeaders:[...annotationLeaders,...requirementForms.leaderSegments],formBoxes:requirementForms.labelBoxes});
  for(let i=0;i<dimensionRows.length;i++){
    const row=dimensionRows[i],placed=dimensionLayout[i],attrs=`data-dimension-id="${escape(row.dimensionId)}" data-dimension-layout="${placed.paths?'aligned-v1':'uncertain-original-v1'}" data-dimension-layout-status="${placed.status}"${placed.reason?' data-dimension-layout-reason="'+placed.reason+'"':''}`;
    if(placed.paths){
      paths[row.pathIndex]=placed.paths.map(part=>{
        const data='M'+part.points.map(p=>p.map(num).join(',')).join(' L');if(data.length>DRAWING_DIMENSION_LAYOUT_LIMITS.pathCharacters)throw Object.assign(Error('Dimension paper path exceeds its bounded serialization domain.'),{code:'RESOURCE_LIMIT'});
        for(let j=1;j<part.points.length;j++)stroke([part.points[j-1],part.points[j]]);
        return `<path ${attrs} data-dimension-role="${part.role}" d="${data}" stroke="${part.role==='extension-line'?'#789':'#246'}"${part.role==='extension-line'?' stroke-width=".18"':''} stroke-linejoin="round"/>`;
      }).join('');
    }else{
      // Preserve all original reference information, but never present a
      // failed bounded layout as an established legible arrangement.
      stroke(row.ends);stroke([row.ends[0],row.label]);stroke([row.ends[1],row.label]);
      paths[row.pathIndex]=`<path ${attrs} data-dimension-role="reference-span" d="M${row.ends.map(p=>p.map(num).join(',')).join(' L')}" stroke="#246"/><path ${attrs} data-dimension-role="fallback-leader" d="M${row.ends[0].map(num).join(',')} L${row.label.map(num).join(',')} M${row.ends[1].map(num).join(',')} L${row.label.map(num).join(',')}" stroke="#789" stroke-dasharray="1 1"/>`;
    }
    annotations[row.textIndex]=text(row.label,row.valueText,attrs+' fill="#124"');
  }
  const dimensionPresentation={version:1,role:'derived-paper-layout',status:dimensionLayout.some(row=>row.status==='uncertain')?'uncertain':'available',dimensions:dimensionLayout.map(({dimensionId,status,reason})=>({dimensionId,status,reason}))};
  for(const warning of layoutDrawingWarnings({sheet:d.sheet,warnings,geometryBounds,strokeBounds,labelBoxes,captionBoxes})){
    const first=warning.lines[0],spans=warning.lines.map(line=>`<tspan x="${num(line.x)}" y="${num(line.y)}" textLength="${num(line.textLength)}" lengthAdjust="spacing">${escape(line.value)}</tspan>`).join('');
    annotations.push(`<text x="${num(first.x)}" y="${num(first.y)}" ${warning.tag||''} data-warning-layout="observed-sheet-v1" data-warning-role="${warning.role}" data-warning-id="${escape(warning.id)}" data-warning-view-id="${escape(warning.viewId)}" font-family="monospace" font-size="3" fill="#a00" aria-label="${escape(warning.message)}">${spans}</text>`);
  }
  // A conservative layout uncertainty must not add a mandatory legend whose
  // own search could turn an otherwise valid drawing into a refusal. Its
  // complete per-dimension reasons remain in metadata/label attributes; the
  // fixed footer visibly distinguishes them from physical reference status.
  const title=text([8,8],d.title||d.drawingId),notice=text([8,d.sheet.height-5],`Reference drawing · ${status} · scale ${d.sheet.scale.numerator}:${d.sheet.scale.denominator}${dimensionPresentation.status==='uncertain'?' · LAYOUT UNCERTAIN ('+dimensionLayout.filter(row=>row.status==='uncertain').length+')':''}`);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${num(d.sheet.width)}mm" height="${num(d.sheet.height)}mm" viewBox="0 0 ${num(d.sheet.width)} ${num(d.sheet.height)}"><title>${escape(d.title)}</title><metadata>${escape(JSON.stringify({version:1,drawingId:d.drawingId,revision:read.revision,geometryRevision:read.geometryRevision,quality:o.quality,status,dimensionPresentation,...(d.version>=2?{definitionVersion:d.version,viewCount:d.views.length,projection:d.views.some(v=>v.basis==='isometric')?'source-relative-isometric-v1':'source-relative-orthographic-v1'}:{}),...(d.version>=3?{annotationFacts:o.annotations,annotationRole:'derived-native-bore-reference',ordinateRole:'signed-datum-coordinate'}:{}),...(d.version===4?{datumFeatureFacts:o.datumFeatures,requirementFacts:o.requirements,manufacturingRequirementRole:'authored-manufacturing-requirement',measurementScope:'nominal-cad-reference-only'}:{}),curvePresentationTolerancePaperMm:.02,dimensionRole:'reference'}))}</metadata><defs>${patterns.join('')}</defs><rect width="100%" height="100%" fill="white"/><g fill="none" stroke="#111" stroke-width=".25">${paths.join('')}</g><g font-family="sans-serif" font-size="3">${title}${annotations.join('')}${notice}</g></svg>`;
  const bytes=new TextEncoder().encode(svg);
  if(bytes.byteLength>16*1024*1024)throw Object.assign(Error('Drawing SVG exceeds its byte budget.'),{code:'RESOURCE_LIMIT'});
  return {format:'svg',mime:'image/svg+xml',status,drawingId:d.drawingId,revision:read.revision,geometryRevision:read.geometryRevision,buffer:bytes.buffer};
}
