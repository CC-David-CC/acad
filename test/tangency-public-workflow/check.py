#!/usr/bin/env python3
"""After-whole independent Fraction/Decimal source/contact/native-ZIP oracle."""
import binascii,copy,hashlib,json,math,re,sys,zlib
from decimal import Decimal,localcontext
from fractions import Fraction
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive,structure,rebuild,manifest_row,canonical,root_record
TYPES=('TangentLC','FiniteTangentLC','TangentCC');BRANCHES=('external','first-contains-second','second-contains-first')
sha=lambda b:hashlib.sha256(b).hexdigest()
def need(v,m):
    if not v:raise ValueError(m)
def one(v,m):need(len(v)==1,'one '+m);return v[0]
def F(v):need(type(v) in (int,float) and math.isfinite(v),'finite actual Number');return Fraction(v)
def dec(v):
    if isinstance(v,Fraction):return Decimal(v.numerator)/Decimal(v.denominator)
    return Decimal.from_float(v) if type(v) is float else Decimal(v)
def near(x,y,t='5e-8'):need(abs(dec(x)-dec(y))<=Decimal(t),f'{x} != {y}; {t}mm budget')
def p(v):return [F(v[k]) for k in ('x','y')]
def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def norm(v):return dec(dot(v,v)).sqrt()
def rad(o):return dec(F(o['data']['r'])) if o['type']=='Circle' else norm(sub(p(o['data']['a']),p(o['data']['c'])))
def source(state,face):return json.loads(one([s for s in state['capture']['native']['sketches'] if s['id']==face],'actual retained source')['source'])
def same(a,b):return all(a[k]==b[k] for k in ('typeId','objects','constants'))
def sector(a,b,q):
    need(all(dot(v,v)>0 for v in (a,b,q)),'nonzero radial vectors')
    half=lambda v:0 if v[1]>0 or v[1]==0 and v[0]>=0 else 1
    def cmp(u,v):return half(u)-half(v) if half(u)!=half(v) else -(cross(u,v)>0)+(cross(u,v)<0)
    ab=cmp(a,b);need(ab!=0,'actual nonfull CCW branch')
    return cmp(a,q)<=0 and cmp(q,b)<=0 if ab<0 else cmp(a,q)<=0 or cmp(q,b)<=0
def foot(line,curve,finite=False):
    A,B,C=p(line['a']),p(line['b']),p(curve['c']);D=sub(B,A);S=dot(D,D);need(S>0,'nondegenerate source line');t=dot(sub(C,A),D)/S;q=[A[i]+t*D[i] for i in range(2)]
    if finite:
        need(0<=t<=1,'exact Segment extent without tolerance band')
        if 'a' in curve:need(sector(sub(p(curve['a']),C),sub(p(curve['b']),C),sub(q,C)),'exact actual CCW Arc inclusion')
    return q,t
def verify_source(row):
    b=row['binding'];s=source(row['before'],b['faceId']);objects={o['id']:o for o in s['objects']};need(len(objects)==len(s['objects']) and s['version']==3 and len(s['stages'])==1 and not s['stages'][0]['generators'] and all(not v for v in s['boundary'].values()),'genuine native source graph');need(s['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual principal source frame')
    edges={(tuple(objects[id]['data']['a'][k] for k in ('x','y')),tuple(objects[id]['data']['b'][k] for k in ('x','y'))) for id in b['rectangleIds']};need(edges=={((100,100),(110,100)),((110,100),(110,110)),((110,110),(100,110)),((100,110),(100,100))},'exact unrelated rectangle');need(objects[b['objects']['Q']['id']]['data']=={'x':7,'y':9},'exact unrelated Point2')
    for name,o in b['objects'].items():need(objects[o['id']]['type']==o['kind'] and objects[o['id']]['role']=='construction','actual construction target type/identity')
    for name,data in row.get('protectedGeometry',{}).items():need(objects[b['objects'][name]['id']]['data']==data,'unchanged explicitly authored '+name)
    points={}
    for point in row['inspection']['points']:
        o=objects[point['parentId']];d=o['data'];role=b['pointRoles'].get(point['id'])
        if role:need(role['parentId']==o['id'],'real endpoint owner');q=d if role['field']=='point' else d[role['field']]
        else:need(o['id'] in b['rectangleIds'],'no endpoint-ID parsing');q=one([d[k] for k in ('a','b') if abs(d[k]['x']-point['x'])<=5e-8 and abs(d[k]['y']-point['y'])<=5e-8],'actual original rectangle endpoint in known parent')
        for axis in ('x','y'):near(point[axis],q[axis])
        points[point['id']]=q
    definition=row['definition'];values={} if definition is None else {'baseTangentRadius':definition,'tangentRadius':definition}
    if definition is not None:
        raw=row['before']['capture']['native']['expressions'];prefix='codi-physical-parameters:1\n';need(raw.startswith(prefix) and json.loads(raw[len(prefix):])==[{'name':'baseTangentRadius','dimension':'length','expression':'mm('+str(definition)+')'},{'name':'tangentRadius','dimension':'length','expression':'baseTangentRadius'}],'actual named parameter provenance');need(one([c for c in s['stages'][0]['constraints'] if c['typeId']=='RadiusLength' and c['objects']==[b['objects']['B']['id']]],'named RadiusLength')['constants']['length']=='tangentRadius','no literal substitution')
    def val(v):return F(values[v]) if v in values else F(float(v))
    for o in objects.values():
        if o['type']=='Arc':near(norm(sub(p(o['data']['a']),p(o['data']['c']))),norm(sub(p(o['data']['b']),p(o['data']['c']))))
    rows=s['stages'][0]['constraints'];tangents=[]
    for c in rows:
        t,ids,k=c['typeId'],c['objects'],c.get('constants',{});need(c['admission']['state'] in ('accepted','redundant'),'actual source admission')
        if t=='PCoincident':
            for axis in ('x','y'):near(points[ids[0]][axis],points[ids[1]][axis])
        elif t=='LockPoint':
            for axis in ('x','y'):near(points[ids[0]][axis],val(k[axis]))
        elif t in ('Horizontal','Vertical','SegmentLength'):
            d=objects[ids[0]]['data'];v=sub(p(d['b']),p(d['a']))
            if t=='SegmentLength':near(norm(v),val(k['length']))
            else:
                angle=int(float(k['angle']))%360;need(angle in ([0,180] if t=='Horizontal' else [90,270]),'directed axis branch');near(v[1 if t=='Horizontal' else 0],0);need(v[0 if t=='Horizontal' else 1]*(1 if angle in (0,90) else -1)>0,'actual directed axis')
        elif t in ('SignedDistanceX','SignedDistanceY'):
            axis='x' if t=='SignedDistanceX' else 'y';near(F(points[ids[1]][axis])-F(points[ids[0]][axis]),val(k['distance']))
        elif t=='RadiusLength':near(rad(objects[ids[0]]),val(k['length']))
        elif t in TYPES:
            A,B=[objects[id] for id in ids];read=one([x for x in row['inspection']['tangencies']['rows'] if same(x,c)],'actual native tangent');need(read['canRemove'] and read['reason'] is None and read['status']==c['admission']['state'] and read['stage']==0 and read['index']==rows.index(c),'actual native row/stage/admission identity');g=read['geometry'];tangents.append(c)
            if t=='TangentCC':
                need(set(k)=={'branch'} and k['branch'] in BRANCHES and A['type']==B['type']=='Circle','exact literal CC source');delta=sub(p(B['data']['c']),p(A['data']['c']));distance=norm(delta);ra,rb=rad(A),rad(B);target=ra+rb if k['branch']=='external' else abs(ra-rb);near(distance,target);need(distance>0,'unique circle contact')
                if k['branch']=='first-contains-second':need(ra>rb,'first contains second')
                if k['branch']=='second-contains-first':need(rb>ra,'second contains first')
                sign=-1 if k['branch']=='second-contains-first' else 1;q=[dec(v)+sign*ra*dec(d)/distance for v,d in zip(p(A['data']['c']),delta)];qa=[q[i]-dec(p(A['data']['c'])[i]) for i in range(2)];qb=[q[i]-dec(p(B['data']['c'])[i]) for i in range(2)];product=sum(x*y for x,y in zip(qa,qb));need(product<0 if k['branch']=='external' else product>0,'actual contact radial orientation');near(g['distance'],distance);near(g['target'],target);near(g['radialResidual'],distance-target)
            else:
                need(set(k)=={'inverted'} and k['inverted'] in (True,False,'true','false'),'literal native polar side');line,curve=A['data'],B['data'];v=sub(p(line['b']),p(line['a']));length=norm(v);normal=[-dec(v[1])/length,dec(v[0])/length];signed=dec(cross(v,sub(p(curve['c']),p(line['a']))))/length;sign=-1 if k['inverted'] in (True,'true') else 1;near(signed,sign*rad(B));near(g['radius'],rad(B));near(g['signedDistance'],signed);near(g['residual'],0,'1e-6')
                for x,y in zip(g['normal'],normal):near(x,y,'1e-10')
                near(g['polarLength']*math.cos(g['angleRadians']),v[0]);near(g['polarLength']*math.sin(g['angleRadians']),v[1])
                q,parameter=foot(line,curve,t=='FiniteTangentLC')
                if t=='FiniteTangentLC':near(g['segmentParameter'],parameter,'1e-12');near(norm(sub(q,p(curve['c']))),rad(B))
            for x,y in zip(g['contact'],q):near(x,y)
        else:raise ValueError('Unexpected actual fixture schema '+t)
    need(len(row['inspection']['tangencies']['rows'])==len(tangents),'complete native tangent census')
    if 'active' in row:need(len(tangents)==len(row['active']) and all(any(same(c,w) for w in row['active']) for c in tangents),'exact requested relation roster')
    return s,objects
def normalize(state):
    v=copy.deepcopy(state)
    for o in (v['capture']['solids'],v['capture']['journal'],v['host'],v['parameters']):o.pop('revision',None)
    return v
def rank(matrix):
    matrix=copy.deepcopy(matrix);r=0
    for j in range(3):
        p=next((i for i in range(r,len(matrix)) if matrix[i][j]),None)
        if p is None:continue
        matrix[r],matrix[p]=matrix[p],matrix[r];a=matrix[r][j];matrix[r]=[x/a for x in matrix[r]]
        for i in range(len(matrix)):
            if i!=r:a=matrix[i][j];matrix[i]=[x-a*y for x,y in zip(matrix[i],matrix[r])]
        r+=1
    return r
def component_nullity(row,s,obj):
    b=row['binding'];name='C' if row['case']=='support' else 'B';id=b['objects'][name]['id'];matrix=[]
    for c in s['stages'][0]['constraints']:
        t,ids,k=c['typeId'],c['objects'],c.get('constants',{})
        if t=='RadiusLength' and ids==[id]:matrix.append([Fraction(0),Fraction(0),Fraction(1)])
        elif t in ('SignedDistanceX','SignedDistanceY') and ids==[b['datumId'],b['objects'][name]['roles']['c']]:matrix.append([Fraction(t=='SignedDistanceX'),Fraction(t=='SignedDistanceY'),Fraction(0)])
        elif t=='TangentLC' and ids[1]==id:
            need(obj[ids[0]]['data']=={'a':{'x':0,'y':0},'b':{'x':10,'y':0}},'genuinely fixed +X rank fixture');matrix.append([Fraction(0),Fraction(1),Fraction(-1 if k['inverted'] in (False,'false') else 1)])
        elif t=='TangentCC' and ids[1]==id:
            need(k['branch']=='external','actual external rank fixture');A,B=[obj[id]['data'] for id in ids];delta=sub(p(B['c']),p(A['c']));matrix.append([2*delta[0],2*delta[1],-2*(F(A['r'])+F(B['r']))])
    return 3-rank(matrix)+2
def make_bad(file,destination,face):
    base=read_archive(file);original=json.loads(base['rawSketches'][face]);healthy=one([c for stage in original['stages'] for c in stage['constraints'] if c['typeId']=='TangentCC' and c['constants']['branch']=='external'],'genuine healthy external row');entry=one([e for e in base['manifest']['entries'] if e['role']=='sketch' and e['logicalId']==face],'original actual entry');rows=structure(Path(file).read_bytes());dest=Path(destination);dest.mkdir(exist_ok=False);result=[]
    for kind in ('unknown-branch','named-branch','extra-field'):
        sketch=copy.deepcopy(original);c=one([c for stage in sketch['stages'] for c in stage['constraints'] if c['typeId']=='TangentCC' and c['objects']==healthy['objects']],'same actual source row')
        if kind=='unknown-branch':c['constants']['branch']='external-unregistered'
        elif kind=='named-branch':c['constants']['branch']='tangentRadius'
        else:c['constants']['sourceVerified']=True
        body=json.dumps(sketch,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode();m=copy.deepcopy(base['manifest']);e=one([e for e in m['entries'] if e['path']==entry['path']],'entry descriptor');e['bytes']=len(body);e['sha256']=sha(body);m['designRevision']=sha(canonical(root_record(m)));codec=zlib.compressobj(6,zlib.DEFLATED,-15);compressed=codec.compress(body)+codec.flush();replacement={'path':entry['path'],'method':8,'crc':binascii.crc32(body)&0xffffffff,'bytes':len(body),'compressed':compressed};output=dest/(kind+'.cad');output.write_bytes(rebuild([replacement if r['path']==entry['path'] else manifest_row(m) if r['path']=='manifest.json' else r for r in rows]));result.append({'kind':kind,'file':str(output.resolve()),'sourceSha256':base['sha256']})
    return result
def check(folder):
    root=Path(folder);r=json.loads((root/'receipt.json').read_text());need(r['status']=='PASS' and r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'],'whole application PASS and own cleanup');need(r['sourcePins']==r['sourcePinsAfter'] and not any(r[k] for k in ('sourceSeeds','privateAuthoring','fakeReplies')),'genuine immutable inputs');need(r['tolerances']['coordinateMm']==5e-8 and r['tolerances']['originalResidualMm']==1e-6,'separate frozen precision/residual policy');need(all(re.fullmatch('[0-9a-f]{40}',r[k]) for k in ('driverSourceCommit','desktopHelperCommit')),'actual driver/helper Git identities')
    expected={'test/tangency-public-workflow/'+n for n in ('desktop-driver.mjs','example.mjs','check.py','README.md')}|{'test/native-cad-container/archive_oracle.py','docs/reviews/C03-TANGENCY-IMPLEMENTATION-20261108.md','test/agent-cad-corpus/sweep/signed-harness.mjs'};need(len(r['sourceSnapshots'])==len(expected) and {s['gitPath'] for s in r['sourceSnapshots']}==expected,'exact producer roster')
    for item in r['sourceSnapshots']:
        p=(root/item['file']).resolve();need(p.is_relative_to(root.resolve()) and sha(p.read_bytes())==item['sha256']==r['sourcePins'][item['originalFile']],'exact executed bytes');need(item['commit']==r['desktopHelperCommit' if item['gitPath'].startswith('test/agent-cad-corpus/') else 'driverSourceCommit'],'source Git-object binding')
        if item['gitPath'].startswith('test/tangency-public-workflow/'):need(sha((Path(__file__).parent/Path(item['gitPath']).name).read_bytes())==item['sha256'],'use frozen acceptance/checker')
    need({x['case'] for x in r['observations']}=={'support','finite','circle-circle'},'all ordinary mechanical domains');schemas=set();branches=set();points=0
    for row in r['observations']:
        need(row['before']==row['after'],'read-only exact state');resource=row['before']['ownership']['resources'];need(not row['before']['ownership']['processing'] and not resource['cleanupFailed'] and all(resource[k]==0 for k in ('candidates','accepted','mounts')) and resource['owners']==resource['detached'],'settled actual resources');s,obj=verify_source(row);body=one(row['before']['capture']['solids']['bodies'],'actual preserved Native rectangle');m=body['metrics'];need(body['id']==row['binding']['body']['outputId'] and body['featureId']==row['binding']['body']['featureId'],'actual producer/body');need(m['nativeValidity']['valid'] and m['solidCount']==1 and m['resultKind']=='single-solid' and 'sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==r['engineRevision'],'genuine bound Native output');near(m['nativeVolume'],2000,'1e-6')
        for key,values in {'min':[100,100,0],'max':[110,110,20]}.items():
            for x,y in zip(m['nativeBounds'][key],values):near(x,y,'1e-6')
        q,req=row['query'],row['input'];need(req['points']==[[105,105,10],[99,105,10],[100,105,10],[105,105,21]],'frozen actual Native probe coordinates');need(q['quality']=='native-re-evaluation-observation' and q['points']==[{'point':p,'classification':c} for p,c in zip(req['points'],('inside','outside','boundary','outside'))],'independent retained cube material/boundary truth')
        for key in ('revision','version','unit','engine','engineRevision','bodyId','featureId'):need(q[key]==req[key],'actual query binding')
        points+=len(q['points'])
        for c in s['stages'][0]['constraints']:
            if c['typeId'] in TYPES:schemas.add(c['typeId'])
            if c['typeId']=='TangentCC':branches.add(c['constants']['branch'])
    need(schemas==set(TYPES) and branches==set(BRANCHES),'all actual new schemas/ordered branches')
    for row in r['diagnostics']:
        need(row['before']==row['after'] and row['report']['localJacobian']['localNullity']==row['nullity'],'actual readonly local report');s,obj=verify_source(row);need(component_nullity(row,s,obj)==row['nullity'],'independent exact regular-component rank plus unrelated Point2')
    need([x['nullity'] for x in r['diagnostics']]==[5,4,2,4,3,2,2],'frozen under/full/redundant states')
    for row in r['noops']:need(row['before']==row['after'] and row['before']['capture']['journal']['canRedo'] and row['result']['changed'] is False,'actual no-op preserves source and nonempty redo')
    need(len(r['noops'])==3,'support/external/reversed-internal no-ops');need(any(x['label']=='Explicit remove-create changes branch without a hidden update' for x in r['observations']) and any(x['label']=='Removed circle tangency permits independent center motion' for x in r['observations']),'actual branch change and restored motion, not metadata-only removal')
    for row in r['refusals']:need(normalize(row['before'])==normalize(row['after']) and not row['error']['committed'] and not row['error']['possiblyCommitted'],'atomic actual refusal')
    failures={x['label']:x for x in r['refusals']};need('Actual nonfinite public radius Number refuses' in failures,'genuine nonfinite Number constructed at the public command boundary')
    for label,code in [('Supporting tangent outside finite Segment is not finite contact','FINITE_CONTACT_OUTSIDE'),('Arc supporting circle does not imply trimmed contact','FINITE_CONTACT_OUTSIDE'),('Actual publicly edited collapsed native sweep is uncertain','FINITE_CONTACT_UNCERTAIN'),('Wrong containing order is a branch-domain refusal','TANGENCY_BRANCH_DOMAIN'),('Coincident equal circles do not have a unique internal tangent','TANGENCY_DOMAIN')]:need(failures[label]['error']['code']==code,'outside/uncertain/domain distinctions')
    rotated=one([o for o in r['observations'] if o['label']=='Exact 3-4-5 rotated finite endpoint and interior'],'actual rotated witness');b=rotated['binding'];er=one([x for x in rotated['inspection']['tangencies']['rows'] if x['objects'][1]==b['objects']['rotatedEndpoint']['id']],'rotated endpoint');ir=one([x for x in rotated['inspection']['tangencies']['rows'] if x['objects'][1]==b['objects']['rotatedInterior']['id']],'rotated interior');need(er['geometry']['contact']==[20,0] and er['geometry']['segmentParameter']==er['geometry']['arcParameter']==0 and ir['geometry']['contact']==[23,4] and ir['geometry']['segmentParameter']==.5,'actual exact3-4-5 finite witnesses')
    redundant=one([o for o in r['observations'] if o['label']=='Distinct normal coordinate is actually redundant'],'distinct redundancy');b=redundant['binding'];need(one([c for c in redundant['inspection']['constraints'] if c['typeId']=='SignedDistanceY' and c['objects']==[b['datumId'],b['objects']['C']['roles']['c']]],'actual distinct signed row')['admission']['state']=='redundant','redundancy is not a duplicate command')
    need(len(r['saves'])==len(r['reopens'])==6,'six actual native cycles');archives=[]
    for saved in r['saves']:
        arc=read_archive(root/saved['savedFile']);native=saved['before']['capture']['native'];model=arc['envelope']['project']['model'];need(arc['sha256']==saved['sha256'] and arc['bytes']==saved['bytes'],'actual server bytes/CRC/descriptor SHA');need(arc['rawSketches']=={s['id']:s['source'] for s in native['sketches']},'EXACT retained archive source bytes');need(all(model[k]==native[k] for k in ('history','counters','expressions')) and saved['before']['capture']==saved['after']['capture'],'same authoritative graph/formulas/highwater/no Save mutation');need(len(model['history'])==2,'one genuine plane and retained original body');op=one([x for x in model['history'] if x['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2'],'actual Native source feature')['params'];need(op['faceId']==saved['binding']['faceId'] and op['regionId']==saved['binding']['regionId'] and op['featureId']==saved['binding']['body']['featureId'] and op['engineRevision']==r['engineRevision'] and op['depth']==20,'same actual selected source/build/producer intent');archives.append({'file':saved['savedFile'],'sha256':arc['sha256'],'designRevision':arc['manifest']['designRevision']})
    for opened in r['reopens']:
        need(all(opened['before']['capture']['native'][k]==opened['opened']['capture']['native'][k] for k in ('history','source','sketches','expressions','counters','presentation')),'fresh Open exact native source/IDs');need(not opened['opened']['capture']['journal']['canUndo'] and not opened['opened']['capture']['journal']['canRedo'],'fresh journal')
    need({x['kind'] for x in r['negativeArchives']}=={'unknown-branch','named-branch','extra-field'},'genuine own malformed native branches/fields')
    for item in r['negativeArchives']:need(item['sourceSha256'] in {x['sha256'] for x in r['saves']} and sha((root/item['file']).read_bytes())==item['sha256']==sha((root/item['serverFile']).read_bytes()),'actual malformed My files bytes from a genuine completed Save')
    return {'status':'PASS','scope':'finite sketch tangent equations/contact/branches/source/travel/native archives; retained Native rectangle only, not BRep tangency/full C03/Gate1','observations':len(r['observations']),'nativeSuffixPoints':points,'archives':archives,'coordinateBudgetMm':'5e-8','originalResidualPolicyMm':'1e-6 (not achieved accuracy)'}
if __name__=='__main__':
    with localcontext() as ctx:
        ctx.prec=100
        print(json.dumps(make_bad(*sys.argv[2:]) if sys.argv[1]=='make-bad' else check(sys.argv[1]),indent=2))
