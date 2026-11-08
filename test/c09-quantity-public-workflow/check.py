#!/usr/bin/env python3
"""Run AFTER the complete public driver. No producer evaluator/geometry imports.
Fraction-based dimensional arithmetic, saved intent/source, real Native metrics
and point replies, including actual public formatted rows, are independently checked.
"""
import ast, copy, hashlib, importlib.util, json, math, sys
from fractions import Fraction
from pathlib import Path

def require(value,message):
    if not value: raise ValueError(message)
def canonical(value): return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False)
def near(value,expected,budget,message):
    require(type(value) in (int,float) and math.isfinite(value) and abs(value-float(expected))<=budget,message)
PREFIX='codi-physical-parameters:1\n'
UNITS={'length':'millimeter','area':'square-millimeter','volume':'cubic-millimeter','angle':'radian','scalar':'dimensionless','count':'count','boolean':None}
DIM={'scalar':(0,0),'length':(1,0),'area':(2,0),'volume':(3,0),'angle':(0,1)}
BASE=[('width','length',None),('height','length','mm(20)'),('depth','length','mm(3)'),('inchArea','area','inch(1) * inch(1)'),('inchVolume','volume','inch(1) * inch(1) * inch(1)'),('quarterTurn','angle','deg(90)'),('rectangleArea','area','mm(10) * mm(20)'),('rectangleVolume','volume','rectangleArea * mm(3)'),('ratio','scalar','inch(2) / inch(1)'),('copies','count','3'),('lengthThree','length','mm(3)'),('enabled','boolean','true'),('tinyLength','length','mm(5e-324)')]
FAILURES={'length-plus-angle':'DIMENSION_MISMATCH','area-as-length':'DIMENSION_MISMATCH','unknown-unit':'INVALID_EXPRESSION','locale-comma':'INVALID_EXPRESSION','overflow-literal':'NUMERIC_DOMAIN','overflow-finite-domain':'NUMERIC_DOMAIN','division-by-zero':'NUMERIC_DOMAIN','length-as-count':'COUNT_DOMAIN','fractional-count':'COUNT_DOMAIN','length-as-boolean':'DIMENSION_MISMATCH','boolean-arithmetic':'DIMENSION_MISMATCH','unknown-parameter':'UNKNOWN_PARAMETER'}
GAPS=[]
BUDGET={'length':1e-10,'area':1e-9,'volume':1e-8,'angle':1e-14,'scalar':1e-14}

def evaluate(definitions):
    specs={r['name']:r for r in definitions};require(len(specs)==len(definitions),'duplicate authored name');done={};active=set()
    def definition(name):
        if name in done:return done[name]
        require(name in specs and name not in active,'unknown/cyclic authored quantity');active.add(name);row=specs[name];expression=row['expression']
        def visit(node):
            if isinstance(node,ast.Constant) and type(node.value) in (int,float): return (Fraction(ast.get_source_segment(expression,node)),0,0,'scalar')
            if isinstance(node,ast.Name):
                if node.id in ('true','false'):return (node.id=='true',0,0,'boolean')
                return definition(node.id)
            if isinstance(node,ast.UnaryOp) and isinstance(node.op,(ast.UAdd,ast.USub)):
                v,l,a,t=visit(node.operand);require(t!='boolean','boolean unary');return ((-v if isinstance(node.op,ast.USub) else v),l,a,t)
            if isinstance(node,ast.Call) and isinstance(node.func,ast.Name) and node.func.id in ('mm','inch','rad','deg') and len(node.args)==1 and not node.keywords:
                v,l,a,t=visit(node.args[0]);require((l,a,t)==(0,0,'scalar'),'unit operand');unit=node.func.id
                return (v*(Fraction(127,5) if unit=='inch' else math.pi/180 if unit=='deg' else 1),int(unit in ('mm','inch')),int(unit in ('rad','deg')),'quantity')
            if isinstance(node,ast.BinOp) and isinstance(node.op,(ast.Add,ast.Sub,ast.Mult,ast.Div)):
                x,lx,ax,tx=visit(node.left);y,ly,ay,ty=visit(node.right);require('boolean' not in (tx,ty),'boolean arithmetic')
                if isinstance(node.op,(ast.Add,ast.Sub)):
                    require((lx,ax)==(ly,ay),'add dimension');return (x+y if isinstance(node.op,ast.Add) else x-y,lx,ax,'quantity')
                if isinstance(node.op,ast.Mult):return (x*y,lx+ly,ax+ay,'quantity')
                require(y!=0,'zero divisor');return (x/y,lx-ly,ax-ay,'quantity')
            raise ValueError('unexpected frozen expression node')
        result=visit(ast.parse(expression,mode='eval').body);v,l,a,t=result;dimension=row['dimension']
        if dimension=='boolean':require(t=='boolean','boolean declaration')
        elif dimension=='count':require((l,a)==(0,0) and t!='boolean' and v.denominator==1 and 0<=v<=1000000,'integer count declaration');result=(v,l,a,'count')
        else:require(t not in ('boolean','count') and (l,a)==DIM[dimension],'declared dimension')
        active.remove(name);done[name]=result;return result
    for name in specs:definition(name)
    return {name:(row['dimension'],done[name][0]) for name,row in specs.items()}

def expected_definitions(expression):return [{'name':n,'dimension':d,'expression':expression if n=='width' else text} for n,d,text in BASE]
def check_quantities(rows,definitions,display):
    expected=evaluate(definitions);require(len(rows)==len(expected),'quantity census');seen=set()
    for row in rows:
        name=row['name'];require(name in expected and name not in seen,'quantity identity');seen.add(name);dimension,value=expected[name];require(row['dimension']==dimension and row['unit']==UNITS[dimension],'quantity dimension/unit')
        if dimension=='boolean':require(type(row['value']) is bool and row['value']==value,'boolean versus numeric identity')
        elif dimension=='count':require(type(row['value']) is int and row['value']==value,'integer count versus length identity')
        else:near(row['value'],value,BUDGET[dimension],'canonical '+name)
        if dimension in ('scalar','count','boolean'):
            require(row['display'] is None and row['displayStatus']=='not-applicable' and row['displayReason']=='NON_DIMENSIONED_QUANTITY','explicit no-display '+name);continue
        if name=='tinyLength':
            require(row['value']==float(Fraction('5e-324')) and row['value']>0,'tiny canonical value must remain nonzero')
            if display=='inch':
                require(row['display'] is None and row['displayStatus']=='unavailable' and row['displayReason']=='FORMATTER_REJECTED','actual underflow has no substituted display');continue
        require(row['displayStatus']=='available' and row['displayReason'] is None,'actual public display '+name);shown=row['display'];require(set(shown)=={'canonicalValue','canonicalUnit','value','unit','text'} and shown['canonicalValue']==row['value'] and shown['canonicalUnit']==UNITS[dimension],'display retains canonical data '+name)
        angle=dimension=='angle';inch=display=='inch';power=DIM[dimension][0];converted=float(value)*180/math.pi if angle else value/Fraction(127,5)**power if inch else value;unit='degree' if angle else {'length':'inch','area':'square-inch','volume':'cubic-inch'}[dimension] if inch else UNITS[dimension];symbol='°' if angle else {'length':'in','area':'in²','volume':'in³'}[dimension] if inch else {'length':'mm','area':'mm²','volume':'mm³'}[dimension]
        require(shown['unit']==unit,'formatted unit '+name);near(shown['value'],converted,1e-12 if angle else BUDGET[dimension],'full converted value '+name);require(shown['text']==format(float(converted),'.2f')+('' if angle else ' ')+symbol,'actual human text '+name)
        if name=='tinyLength':require(shown['value']==row['value'] and shown['value']>0 and shown['text']=='0.00 mm','text rounding must not zero tiny numeric data')
        if inch and name in ('rectangleArea','rectangleVolume'):require(abs(shown['value']-round(shown['value'],2))>1e-9,'full converted number must not be text-rounded')
    # Exact rational truths, separate from the provider's numeric result.
    require(expected['inchArea'][1]==Fraction(16129,25),'1in² rational');require(expected['inchVolume'][1]==Fraction(2048383,125),'1in³ rational');require(expected['rectangleArea'][1]==200 and expected['rectangleVolume'][1]==600,'dimensional products');require(expected['ratio'][1]==2,'length quotient scalar');near(float(expected['quarterTurn'][1]),math.pi/2,1e-15,'90deg radians');return expected

def check_metrics(observation,binding,width,build):
    state=observation['before'];require(canonical(state)==canonical(observation['after']),'read-only state/token preservation');bodies=state['capture']['solids']['bodies'];require(len(bodies)==1,'one output');body=bodies[0];metrics=body['metrics'];require(body['id']==binding['profile']['outputId'] and body['featureId']==binding['profile']['featureId'],'actual producer/body binding');require(metrics['nativeValidity']['valid'] is True and metrics['solidCount']==1 and metrics['resultKind']=='single-solid','real Native valid single solid');runtime=metrics['runtime'];require('sha256:'+runtime['jsSha256']+':'+runtime['wasmSha256']==build,'actual runtime pin');near(metrics['nativeVolume'],width*20*3,1e-6,'actual Native analytic volume')
    for k,values in [('min',[0,0,0]),('max',[width,20,3])]:
        for got,want in zip(metrics['nativeBounds'][k],values):near(got,want,1e-6,'actual Native bounds')
    require(state['capture']['native']['counters']==binding['counters'],'feature high-water preserved');resources=state['ownership']['resources'];require(state['ownership']['processing'] is False and resources['cleanupFailed'] is False and all(resources[k]==0 for k in ('candidates','accepted','mounts')) and resources['owners']==resources['detached'],'owner cleanup')
    query=observation['query'];request=observation['input'];require(query['quality']=='native-re-evaluation-observation','real native query quality')
    for key in ('revision','bodyId','featureId','engine','engineRevision','unit'):require(query[key]==request[key],'query binding '+key)
    points=[[float(width)/2,10,1.5],[float(width)+1,10,1.5],[0,10,1.5],[float(width)/2,10,4],[1,1,1]];classes=['inside','outside','boundary','outside','inside'];require(len(query['points'])==5,'query census')
    for row,point,kind in zip(query['points'],points,classes):require(row['point']==point and row['classification']==kind,'analytic actual point result')
    read=observation['measurement'];rows=[r for r in read['measurements'] if r['segmentId']==binding['widthSegmentId']];require(len(rows)==1,'measurement binding');row=rows[0];require(row['measurementId']==binding['measurementId'],'stable genuine ruler');display=row['display'];inch=observation['display']=='inch';near(display['canonicalValue'],width,1e-10,'formatted canonical length');require(display['canonicalUnit']=='millimeter' and display['unit']==('inch' if inch else 'millimeter'),'formatted length unit');shown=width/Fraction(127,5) if inch else width;near(display['value'],shown,1e-10,'actual formatted length');require(display['text']==format(float(shown),'.2f')+(' in' if inch else ' mm'),'actual readable length text')

def read_archive_info(file):
    module=Path(__file__).resolve().parent.parent/'native-cad-container'/'archive_oracle.py';spec=importlib.util.spec_from_file_location('c09_native_archive_oracle',module);reader=importlib.util.module_from_spec(spec);spec.loader.exec_module(reader)
    return reader.read_archive(file)
def read_native(file,extension):
    require(extension=='.cad','current .cad required, no legacy fallback');return read_archive_info(file)['envelope']

def check_malformed_rulers(directory,receipt):
    rows=receipt['malformed'];require([r['kind'] for r in rows]==['unknown-data-field','segment-reference'],'two additive ruler admission controls')
    sources=[r for r in receipt['saves'] if r['label']=='edited-3inch'];require(len(sources)==1,'genuine second Save lineage');source=sources[0];original=read_archive_info(directory/source['savedFile']);binding=receipt['binding'];source_sketches=[s for s in original['envelope']['project']['sketches'] if s['id']==binding['faceId']];require(len(source_sketches)==1,'actual saved source');source_sketch=source_sketches[0];rulers=[r for r in source_sketch['data']['dimensions'] if r['id']==binding['measurementId']];require(len(rulers)==1 and rulers[0]['type']=='LinearDimension','genuine saved ruler')
    for row in rows:
        file=directory/row['file'];stored=directory/row['storedFile'];raw=file.read_bytes();require(raw==stored.read_bytes() and len(raw)==row['bytes'] and hashlib.sha256(raw).hexdigest()==row['sha256'],'independent My files/server readback matches constructed own negative bytes');bad=read_archive_info(file)
        require(row['expectedCode']=='CAD_ARCHIVE_INVALID' and row['sourceSavedFile']==source['savedFile'] and row['sourceSha256']==source['sha256']==original['sha256'],'genuine unchanged source file lineage');require(row['sketchId']==binding['faceId'] and row['rulerId']==binding['measurementId'],'actual native identity, no guessed locator')
        segment=[o for o in source_sketch['data']['objects'] if o['type']=='Segment' and o['id']==row['segmentId']];require(len(segment)==1 and row['segmentId'] in binding['segmentIds'] and row['segmentId'] not in (rulers[0]['data']['a'],rulers[0]['data']['b']),'existing actual Segment, not unknown/made-up endpoint')
        expected=copy.deepcopy(original['envelope']);sketch=next(s for s in expected['project']['sketches'] if s['id']==binding['faceId']);ruler=next(r for r in sketch['data']['dimensions'] if r['id']==binding['measurementId'])
        if row['kind']=='unknown-data-field':
            require('unsupportedRulerField' not in ruler['data'] and row['mutation']=={'field':'data.unsupportedRulerField','value':True},'single unknown data-field mutation');ruler['data']['unsupportedRulerField']=True
        else:
            require(row['mutation']=={'field':'data.a','from':ruler['data']['a'],'to':row['segmentId']},'single actual Segment reference mutation');ruler['data']['a']=row['segmentId']
        require(canonical(bad['envelope'])==canonical(expected),'exactly one intended ruler corruption, all other authored domains intact')
        changed=[e for e in original['manifest']['entries'] if e['role']=='sketch' and e['logicalId']==binding['faceId']];require(len(changed)==1 and changed[0]['path']==row['changedEntryPath'],'actual source entry identity');expected_manifest=copy.deepcopy(original['manifest']);new_entry=next(e for e in bad['manifest']['entries'] if e['path']==row['changedEntryPath']);old_entry=next(e for e in expected_manifest['entries'] if e['path']==row['changedEntryPath']);old_entry['bytes']=new_entry['bytes'];old_entry['sha256']=new_entry['sha256'];expected_manifest['designRevision']=bad['manifest']['designRevision'];require(expected_manifest==bad['manifest'] and bad['manifest']['designRevision']!=original['manifest']['designRevision'],'valid updated authored entry and design root only')
        require(set(bad['spans'])==set(original['spans']),'complete unchanged archive roster')
        for path,span in original['spans'].items():
            if path!=row['changedEntryPath']:require(span['compressedSha256']==bad['spans'][path]['compressedSha256'] and span['contentSha256']==bad['spans'][path]['contentSha256'],'all other archive payloads retained exactly')
        failure=row['failure'];require(failure['code']=='CAD_ARCHIVE_INVALID' and failure['committed'] is False and failure['possiblyCommitted'] is False and row['unexpectedResult'] is None,'exact semantic preflight public refusal');require(canonical(row['before'])==canonical(row['after']),'failed Open preserves accepted source/history/geometry/quantities/presentation/journal/tokens/association/resources');require(row['before']['host']['dirty'] is True and row['before']['capture']['journal']['canUndo'] and row['before']['physical']['definitions'][0]['expression']=='inch(2.5)','nontrivial current journal/newer state at refused adoption');require(row['confirmation']['title']=='Unsaved changes' and row['confirmation']['action']=='trusted existing Discard and open button' and 'Discard and open' in row['confirmation']['buttons'],'normal visible unsaved replacement confirmation, no mocked consent')
    labels={r['label']:r for r in receipt['observations']};require('Healthy canonical/public formatted/native reads after both malformed ruler Opens' in labels and 'Healthy public typed reedit after malformed ruler Opens' in labels,'positive public read/edit continuation');require(labels['Healthy canonical/public formatted/native reads after both malformed ruler Opens']['expression']=='inch(2.5)' and labels['Healthy public typed reedit after malformed ruler Opens']['expression']=='inch(3)','real post-refusal geometric edit');return {'archives':2,'publicCode':'CAD_ARCHIVE_INVALID','unknownDataField':True,'savedSegmentRejectedAsEndPoint':True,'integrity':'Independent ZIP32/CRC/SHA/designRevision valid; only selected ruler mutation differs.'}

def main(directory):
    directory=Path(directory);receipt=json.loads((directory/'receipt.json').read_text());require(receipt['status']=='PASS','complete composed workflow must finish before independent oracle');require(receipt['nativeExtension']=='.cad','actual required .cad path');require(receipt['remainingRequirements']==GAPS,'bounded projection requirements');require(receipt['sourcePins']==receipt['sourcePinsAfter'],'frozen executing source');require(receipt['ownedContextClosed'] and receipt['sharedBrowserDisconnectedOnly'],'owned browser cleanup');binding=receipt['binding'];build=receipt['engineRevision'];require(len(receipt['saves'])==3,'three whole native files');require(len(receipt['observations'])>=16,'whole edit/travel/reopen/read and malformed-Open continuation chain');require({r['display'] for r in receipt['observations']}=={'millimeter','inch'},'both document presentations')
    for observation in receipt['observations']:
        defs=expected_definitions(observation['expression']);expected=check_quantities(observation['before']['physical']['quantities'],defs,observation['display']);require(observation['before']['physical']['definitions']==defs,'exact public expression intent');require(observation['before']['physical']['presentationRevision']==observation['before']['units']['revision'] and observation['before']['physical']['presentationRevision'],'current presentation token');check_metrics(observation,binding,expected['width'][1],build)
    require({r['label']:r['expectedCode'] for r in receipt['refusals']}==FAILURES,'all finite refusal requirements')
    for row in receipt['refusals']:
        failure=row['failure'];require(failure['code']==FAILURES[row['label']] and not failure['committed'] and not failure['possiblyCommitted'],'precise refusal layer');require(canonical(row['before'])==canonical(row['after']),'refusal preserves every captured accepted field/token')
    saved=[]
    for item in receipt['saves']:
        file=directory/item['savedFile'];raw=file.read_bytes();require(len(raw)==item['bytes'] and hashlib.sha256(raw).hexdigest()==item['sha256'],'actual server/local saved bytes');native=read_native(file,receipt['nativeExtension']);require(native['format']=='codi-jsketcher-project' and native['unit']=='millimeter','native authored envelope');project=native['project'];model=project['model'];defs=expected_definitions(item['expression']);source=model['expressions'];require(source.startswith(PREFIX) and json.loads(source[len(PREFIX):])==defs,'raw saved expression intent');expected=evaluate(defs);width=expected['width'][1];require(model['counters']==binding['counters'],'saved high-water');history=model['history'];require(len(history)==2 and history[0]['type']=='PLANE' and history[1]['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2','one actual shared authored graph');plane=history[0]['params'];require(plane['datum'] is None and plane['depth']==0 and plane['orientation']=='XY','bounded independent source frame');p=history[1]['params'];require(p['featureId']==binding['profile']['featureId'] and p['faceId']==binding['faceId'] and p['regionId']==binding['regionId'] and p['engineRevision']==build and p['depth']=='depth' and p['unit']=='millimeter','saved actual selected source/build/depth intent');require(native['presentation']=={'version':1,'lengthUnit':'inch'},'saved document units')
        sketches=project['sketches'];require(len(sketches)==1 and sketches[0]['id']==binding['faceId'],'one source inventory');sketch=sketches[0]['data'];require(len(sketch['objects'])==4 and {r['id'] for r in sketch['objects']}==set(binding['segmentIds']),'actual source Segment identity');corners=[(0,0),(width,0),(width,20),(0,20)];uses=[]
        for segment in sketch['objects']:
            require(segment['type']=='Segment' and segment['stage']==0 and segment['role'] is None,'actual source type/stage');endpoints=[]
            for endpoint in ('a','b'):
                point=segment['data'][endpoint];matches=[i for i,c in enumerate(corners) if abs(point['x']-float(c[0]))<=5e-8 and abs(point['y']-float(c[1]))<=5e-8];require(len(matches)==1,'independent 50pm source corner');endpoints.append(matches[0])
            require((endpoints[0]+1)%4==endpoints[1],'directed rectangle boundary');uses.append(tuple(endpoints))
        require(set(uses)=={(0,1),(1,2),(2,3),(3,0)},'complete independent bounded rectangle');rulers=sketch['dimensions'];require(len(rulers)==1 and rulers[0]['id']==binding['measurementId'] and rulers[0]['type']=='LinearDimension' and {rulers[0]['data']['a'],rulers[0]['data']['b']}==set(binding['widthPointIds']),'saved original ruler endpoints/ID');constraints=sketch['stages'][0]['constraints'];require(len(constraints)==11,'retained actual source equations');width_rows=[r for r in constraints if r['typeId']=='SegmentLength' and r['objects']==[binding['widthSegmentId']]];require(len(width_rows)==1 and width_rows[0]['constants']['length']=='width','actual named width')
        original=binding['originalSource'];wanted=json.loads(json.dumps(original['stages']));lengths=0
        for stage in wanted:
            for row in stage['constraints']:
                if row['typeId']=='SegmentLength':
                    require(len(row['objects'])==1,'original actual length locator');row['constants']['length']='width' if row['objects']==[binding['widthSegmentId']] else 'height';lengths+=1
        require(lengths==2 and sketch['stages']==wanted,'all original rows/classifications/refs retained except explicit width/height binding');require(all(sketch.get(k)==original.get(k) for k in ('dimensions','labels','constants','metadata','boundary')),'unrelated source/ruler/frame intent unchanged');require(canonical(item['before']['capture'])==canonical(item['after']['capture']),'native Save does not mutate authored/native/journal state');saved.append({'file':item['savedFile'],'sha256':item['sha256'],'widthMillimeters':float(width),'analyticNativeVolume':float(width*60)})
    ruler_admission=check_malformed_rulers(directory,receipt)
    return {'status':'PASS','scope':'Finite C09 quantity/public formatted-read/native .cad persistence plus owned ruler semantic admission; not universal unit/locale/UI/foreign-import or wholeGate1 qualification.','canonicalQuantityDimensions':7,'publicDisplayDimensions':['length','area','volume','angle'],'tinyCanonicalValuePreservedWithExplicitInchDisplayUnavailability':True,'refusals':len(receipt['refusals']),'actualNativePointObservations':5*len(receipt['observations']),'nativeFiles':saved,'rulerAdmission':ruler_admission,'readerScope':'Independent Fraction/AST quantity/display and analytic source/Native checks; independent ZIP32/CRC/SHA/designRevision reader. No production encoder/parser as oracle.'}

if __name__=='__main__':
    require(len(sys.argv)==2,'check.py EVIDENCE-DIRECTORY');print(json.dumps(main(sys.argv[1]),indent=2))
