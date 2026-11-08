"""Independent arithmetic/source/native-observation check after one whole run."""
import hashlib,json,math,pathlib,sys
from fractions import Fraction

def require(v,message):
    if not v: raise ValueError(message)
def near(a,b,t=1e-6): require(isinstance(a,(int,float)) and not isinstance(a,bool) and math.isfinite(a) and abs(a-b)<=t,f'{a} != {b}')
def main():
    folder=pathlib.Path(sys.argv[1]);r=json.loads((folder/'receipt.json').read_text())
    require(r['status']=='PASS','Complete workflow did not pass')
    require(r['sourcePins']==r['sourcePinsAfter'],'Executing source changed')
    require(r['ownedContextsClosed'] and not r['privateAuthoring'] and not r['sourceSeeds'],'Ownership/authoring boundary')
    inch=Fraction(127,5)
    fixed={'twoInches':('length',2*inch,'millimeter'),'squareInch':('area',inch**2,'square-millimeter'),'cubicInch':('volume',inch**3,'cubic-millimeter'),'rightAngle':('angle',math.pi/2,'radian'),'ten':('length',10,'millimeter'),'twenty':('length',20,'millimeter'),'three':('length',3,'millimeter'),'patchArea':('area',200,'square-millimeter'),'patchVolume':('volume',600,'cubic-millimeter'),'ratio':('scalar',Fraction(1,2),'dimensionless'),'copies':('count',3,'count'),'enabled':('boolean',True,None)}
    measured=[]
    for row in r['rows']:
        if 'truth' not in row: continue
        width=row['truth']['width'];s=row['before'];q=s['physical']['quantities']
        require(row['before']==row['after'],'Inspection mutated current state')
        defs=s['physical']['definitions'];require([x['name'] for x in q]==[x['name'] for x in defs],'Quantity identity/order')
        expected={'width':('length',width,'millimeter'),'height':('length',width/2,'millimeter'),'depth':('length',width/5,'millimeter'),'hole':('length',width/10,'millimeter'),'corner':('length',width/25,'millimeter'),'edge':('length',width*2/25,'millimeter')}
        if any(d['name']=='twoInches' for d in defs): expected.update(fixed)
        require(len(q)==len(expected),'Quantity membership')
        for x in q:
            dimension,value,unit=expected[x['name']];require(x['dimension']==dimension and x['unit']==unit,'Typed quantity unit/dimension')
            if dimension=='boolean':require(x['value'] is value,'Boolean type/value')
            else:near(x['value'],float(value),1e-9)
        bodies=s['capture']['solids']['bodies'];require(len(bodies)==1,'One actual output')
        m=bodies[0]['metrics'];require(m['nativeValidity']['valid'] and m['resultKind']=='single-solid' and m['solidCount']==1,'Actual valid native solid')
        expected_volume=(width*(width/2)-math.pi*((width/20)**2+4*(width/50)**2))*(width/5)
        near(m['nativeVolume'],expected_volume)
        for a,b in zip(m['nativeBounds']['min'],[0,0,0]):near(a,b)
        for a,b in zip(m['nativeBounds']['max'],[width,width/2,width/5]):near(a,b)
        measured.append({'label':row['label'],'widthMm':width,'volumeMm3':expected_volume,'quantities':len(q)})
    refusals=[x for x in r['rows'] if x['label'].startswith('Refused ')]
    require(len(refusals)==12,'All declared quantity failure cases')
    for row in refusals:
        require(row['error']['code']==row['expectedCode'],'Precise refusal cause')
        require(not row['error']['committed'] and not row['error']['possiblyCommitted'],'Refusal publication')
        def normalize(value):
            v=json.loads(json.dumps(value))
            for x in[v['host'],v['physical'],v['capture']['journal'],v['capture']['solids']]:x.pop('revision',None)
            return v
        require(normalize(row['before'])==normalize(row['after']),'Durable state changed on refusal')
    require(len(r['saved'])==3,'Three actual native files')
    files=[]
    for saved in r['saved']:
        raw=(folder/saved['savedFile']).read_bytes();require(len(raw)==saved['bytes'] and hashlib.sha256(raw).hexdigest()==saved['sha256'],'Actual saved file bytes')
        native=json.loads(raw);require(native['format']=='codi-jsketcher-project' and native['unit']=='millimeter','Native file framing')
        model=native['project']['model'];capture=saved['before']['capture'];require(model['history']==capture['native']['history'] and model['counters']==capture['native']['counters'],'Authored history/counters')
        expression=model['expressions'];prefix='codi-physical-parameters:1\n';require(expression.startswith(prefix),'Typed authored source')
        require(json.loads(expression[len(prefix):])==saved['definitions'],'Saved formulas, not evaluated flags')
        source=next(s['data'] for s in native['project']['sketches'] if s['id']==r['binding']['faceId']);require(source==json.loads(capture['native']['source']),'Saved source/identities')
        require([x['type'] for x in model['history']]==['PLANE','WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_THROUGH_HOLES_V1','WORKER_THROUGH_HOLES_V1'],'One shared editable graph')
        width=next(x for x in saved['definitions'] if x['name']=='width')['expression'];require(width in ['mm(100)','inch(4)','mm(101.6)'],'Explicit retained width spelling')
        files.append({'file':saved['savedFile'],'sha256':saved['sha256'],'widthExpression':width,'widthMm':saved['width']})
    require([f['widthExpression'] for f in files]==['mm(100)','inch(4)','mm(101.6)'],'Native edit/reopen sequence')
    print(json.dumps({'status':'PASS','scope':'Independent literal dimensional arithmetic, actual saved source and Native metric observations; no production evaluator imports','observations':measured,'refusals':len(refusals),'nativeFiles':files},indent=2))
if __name__=='__main__':main()
