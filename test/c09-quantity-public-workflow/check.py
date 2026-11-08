#!/usr/bin/env python3
"""Run AFTER the complete public driver. No producer evaluator/geometry imports.
Fraction-based dimensional arithmetic, saved intent/source, real Native metrics
and point replies are independently checked. Does not claim missing format APIs.
"""
import ast, hashlib, importlib.util, json, math, sys
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
BASE=[('width','length',None),('height','length','mm(20)'),('depth','length','mm(3)'),('inchArea','area','inch(1) * inch(1)'),('inchVolume','volume','inch(1) * inch(1) * inch(1)'),('quarterTurn','angle','deg(90)'),('rectangleArea','area','mm(10) * mm(20)'),('rectangleVolume','volume','rectangleArea * mm(3)'),('ratio','scalar','inch(2) / inch(1)'),('copies','count','3'),('lengthThree','length','mm(3)'),('enabled','boolean','true')]
FAILURES={'length-plus-angle':'DIMENSION_MISMATCH','area-as-length':'DIMENSION_MISMATCH','unknown-unit':'INVALID_EXPRESSION','locale-comma':'INVALID_EXPRESSION','overflow-literal':'NUMERIC_DOMAIN','overflow-finite-domain':'NUMERIC_DOMAIN','division-by-zero':'NUMERIC_DOMAIN','length-as-count':'COUNT_DOMAIN','fractional-count':'COUNT_DOMAIN','length-as-boolean':'DIMENSION_MISMATCH','boolean-arithmetic':'DIMENSION_MISMATCH','unknown-parameter':'UNKNOWN_PARAMETER'}
GAPS=['public-formatted-area-read','public-formatted-volume-read','public-formatted-angle-read']
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
def check_quantities(rows,definitions):
    expected=evaluate(definitions);require(len(rows)==len(expected),'quantity census');seen=set()
    for row in rows:
        name=row['name'];require(name in expected and name not in seen,'quantity identity');seen.add(name);dimension,value=expected[name];require(row['dimension']==dimension and row['unit']==UNITS[dimension],'quantity dimension/unit')
        if dimension=='boolean':require(type(row['value']) is bool and row['value']==value,'boolean versus numeric identity')
        elif dimension=='count':require(type(row['value']) is int and row['value']==value,'integer count versus length identity')
        else:near(row['value'],value,BUDGET[dimension],'canonical '+name)
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

def read_native(file,extension):
    module=Path(__file__).resolve().parent.parent/'native-cad-container'/'archive_oracle.py';spec=importlib.util.spec_from_file_location('c09_native_archive_oracle',module);reader=importlib.util.module_from_spec(spec);spec.loader.exec_module(reader)
    if extension=='.cad':return reader.read_archive(file)['envelope']
    require(extension=='.jsketcher.json','explicit native mode');return reader.parse_json(file.read_bytes())

def main(directory):
    directory=Path(directory);receipt=json.loads((directory/'receipt.json').read_text());require(receipt['status']=='SUPPORTED_CHAIN_PASS','complete supported chain must finish before independent oracle');require(receipt['remainingRequirements']==GAPS,'missing formatted APIs must remain explicit');require(receipt['sourcePins']==receipt['sourcePinsAfter'],'frozen executing source');require(receipt['ownedContextClosed'] and receipt['sharedBrowserDisconnectedOnly'],'owned browser cleanup');binding=receipt['binding'];build=receipt['engineRevision'];require(len(receipt['saves'])==3,'three whole native files');require(len(receipt['observations'])>=12,'whole edit/travel/reopen/read chain')
    for observation in receipt['observations']:
        defs=expected_definitions(observation['expression']);expected=check_quantities(observation['before']['physical']['quantities'],defs);require(observation['before']['physical']['definitions']==defs,'exact public expression intent');check_metrics(observation,binding,expected['width'][1],build)
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
    return {'status':'SUPPORTED_CHAIN_PASS','notFullC09Signoff':True,'remainingRequirements':GAPS,'canonicalQuantityDimensions':7,'refusals':len(receipt['refusals']),'actualNativePointObservations':5*len(receipt['observations']),'nativeFiles':saved,'readerScope':'Independent Fraction/AST quantity and analytic source/Native checks; existing independent ZIP32 reader for .cad only. No missing formatted area/volume/angle proof.'}

if __name__=='__main__':
    require(len(sys.argv)==2,'check.py EVIDENCE-DIRECTORY');print(json.dumps(main(sys.argv[1]),indent=2))
