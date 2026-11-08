"""Independent bounded STEP21 subset reader for the frozen five-bore plate.

No OCCT/production imports. Unsupported surfaces/curves/topology refuse; this
does not implement general STEP interchange or claim arbitrary BRep validity.
"""
import collections, math, re

def require(value, message):
    if not value: raise ValueError(message)
def near(a,b,t=1e-6): require(math.isfinite(a) and abs(a-b)<=t, f'{a} != {b}')
def vector(a,b,t=1e-6):
    require(len(a)==len(b),'vector length')
    for x,y in zip(a,b): near(x,y,t)
TOKEN=re.compile(r"'(?:[^']|'')*'|#[0-9]+|[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[EeDd][+-]?\d+)?|\.[A-Z_0-9]+\.|[A-Z_][A-Z_0-9]*|[(),$*]")
def parameters(text):
    tokens=[];end=0
    for match in TOKEN.finditer(text):
        require(not text[end:match.start()].strip(),'Unsupported STEP parameter syntax');tokens.append(match[0]);end=match.end()
    require(not text[end:].strip(),'Unsupported STEP parameter suffix');pos=0
    def value(depth=0):
        nonlocal pos
        require(depth<=16 and pos<len(tokens),'bounded STEP parameters');token=tokens[pos];pos+=1
        if token=='(':
            result=[]
            if pos<len(tokens) and tokens[pos]!=')':
                while True:
                    result.append(value(depth+1));require(pos<len(tokens),'STEP list terminator')
                    if tokens[pos]!=',': break
                    pos+=1
            require(pos<len(tokens) and tokens[pos]==')','STEP list closure');pos+=1;return tuple(result)
        if token.startswith("'"): return token[1:-1].replace("''", "'")
        if token.startswith('#'): return ('ref',int(token[1:]))
        if token.startswith('.') and token.endswith('.'): return ('enum',token[1:-1])
        if token=='$': return None
        if token=='*': return '*'
        try:
            number=float(token.replace('D','E'));require(math.isfinite(number),'finite STEP number');return number
        except ValueError: raise ValueError('Unsupported STEP parameter token: '+token)
    result=value();require(pos==len(tokens),'Unexpected STEP parameter suffix');return result

def inspect_step(raw, truth):
    require(0<len(raw)<=8388608,'STEP byte cap');text=raw.decode('ascii')
    require(text.startswith('ISO-10303-21;') and text.rstrip().endswith('END-ISO-10303-21;'),'STEP21 framing')
    require('AUTOMOTIVE_DESIGN' in text,'AP214 schema')
    require(re.search(r'\bLENGTH_UNIT\s*\(\s*\).*?\bSI_UNIT\s*\(\s*\.MILLI\.\s*,\s*\.METRE\.\s*\)',text,re.S),'actual millimeter length unit')
    data=text.split('DATA;',1)[1].split('ENDSEC;',1)[0];records={}
    # The native exporter uses fixed product strings. Split statements outside
    # quoted STEP strings rather than treating embedded semicolons as syntax.
    statements=[];start=0;quoted=False;i=0
    while i<len(data):
        if data[i]=="'":
            if quoted and i+1<len(data) and data[i+1]=="'": i+=2;continue
            quoted=not quoted
        if data[i]==';' and not quoted: statements.append(data[start:i].strip());start=i+1
        i+=1
    require(not quoted and not data[start:].strip(),'complete STEP statements')
    for statement in statements:
        if not statement: continue
        match=re.fullmatch(r'#([0-9]+)\s*=\s*(.*)',statement,re.S);require(match is not None,'STEP entity assignment');index=int(match[1]);body=match[2].strip();require(index>0 and index not in records,'unique STEP entity IDs')
        regular=re.fullmatch(r'([A-Z_][A-Z_0-9]*)\s*(\(.*\))',body,re.S)
        records[index]=(regular[1],parameters(regular[2])) if regular else ('COMPLEX',body)
        require(len(records)<=100000,'STEP entity cap')
    def record(ref,kind=None):
        require(isinstance(ref,tuple) and len(ref)==2 and ref[0]=='ref' and ref[1] in records,'actual STEP reference')
        typ,args=records[ref[1]];require(kind is None or typ==kind,f'Expected STEP {kind}, got {typ}');return typ,args
    def xyz(ref):
        _,a=record(ref,'CARTESIAN_POINT');p=a[1];require(len(p)==3 and all(isinstance(x,float) and math.isfinite(x) for x in p),'actual 3D point');return p
    def direction(ref,default):
        if ref is None:return default
        _,a=record(ref,'DIRECTION');p=a[1];require(len(p)==3,'3D direction');near(math.sqrt(sum(x*x for x in p)),1,1e-9);return p
    def placement(ref):
        _,a=record(ref,'AXIS2_PLACEMENT_3D');return xyz(a[1]),direction(a[2],(0.,0.,1.))
    def vertex(ref): return xyz(record(ref,'VERTEX_POINT')[1][1])
    def curve(ref):
        typ,a=record(ref)
        while typ in ('SURFACE_CURVE','SEAM_CURVE'):typ,a=record(a[1])
        require(typ in ('LINE','CIRCLE'),'No approximated/unsupported STEP curve')
        if typ=='CIRCLE':
            center,axis=placement(a[1]);require(a[2]>0,'positive circle');return {'kind':typ,'center':center,'axis':axis,'radius':a[2]}
        _,v=record(a[2],'VECTOR');return {'kind':typ,'origin':xyz(a[1]),'direction':direction(v[1],None),'scale':v[2]}
    solids=[('ref',i) for i,(kind,_) in records.items() if kind=='MANIFOLD_SOLID_BREP'];require(len(solids)==1,'exactly one STEP manifold solid')
    shell=record(solids[0],'MANIFOLD_SOLID_BREP')[1][1];faces=record(shell,'CLOSED_SHELL')[1][1];require(len(faces)==11 and len(set(faces))==11,'six planar plus five cylindrical faces')
    edge_use=collections.Counter();used_vertices=set();used_edges=set();planar=[];cylindrical=[];face_contribution=0
    for face_ref in faces:
        _,a=record(face_ref,'ADVANCED_FACE');bounds,surface,sense=a[1:];require(sense in (('enum','T'),('enum','F')),'face orientation');loops=[];face_contribution+=2-len(bounds)
        for bound in bounds:
            typ,b=record(bound);require(typ in ('FACE_BOUND','FACE_OUTER_BOUND'),'face loop bound');_,loop=record(b[1],'EDGE_LOOP');edges=[]
            for oriented in loop[1]:
                _,o=record(oriented,'ORIENTED_EDGE');edge=o[3];_,e=record(edge,'EDGE_CURVE');require(o[4] in (('enum','T'),('enum','F')),'oriented edge sense')
                start,end=e[1],e[2];used_vertices.update((start,end));used_edges.add(edge);edge_use[edge]+=1
                p,q=vertex(start),vertex(end);ends=(start,end) if o[4]==('enum','T') else (end,start)
                edges.append({'ref':edge,'vertices':(start,end),'points':(p,q),'ends':ends,'curve':curve(e[3])})
            require(edges and all(edges[j]['ends'][1]==edges[(j+1)%len(edges)]['ends'][0] for j in range(len(edges))),'closed actual edge loop');loops.append(edges)
        typ,s=record(surface);require(typ in ('PLANE','CYLINDRICAL_SURFACE'),'only actual analytic plane/cylinder surfaces')
        origin,axis=placement(s[1]);normal=tuple(x*(1 if sense==('enum','T') else -1) for x in axis)
        row={'origin':origin,'axis':axis,'normal':normal,'loops':loops}
        if typ=='PLANE':planar.append(row)
        else:require(s[2]>0 and sense==('enum','F'),'inward cylindrical hole face');row['radius']=s[2];cylindrical.append(row)
    require(len(planar)==6 and len(cylindrical)==5,'complete analytic face census');require(all(n==2 for n in edge_use.values()),'closed shell edge membership')
    require(len(used_vertices)-len(used_edges)+face_contribution==2-2*5,'five through-bore shell Euler characteristic')
    vertices=[vertex(v) for v in used_vertices];lo=[min(p[i] for p in vertices) for i in range(3)];hi=[max(p[i] for p in vertices) for i in range(3)]
    vector(lo,truth['bounds']['min']);vector(hi,truth['bounds']['max']);w,h,d=[b-a for a,b in zip(lo,hi)];bores=truth['bores']
    def hole_key(center,radius):
        matches=[i for i,(x,y,r) in enumerate(bores) if math.hypot(center[0]-x,center[1]-y)<=1e-7 and abs(radius-r)<=1e-7];require(len(matches)==1,'actual circle/cylinder belongs to one independently expected bore');return matches[0]
    caps=[];outer_sides=[]
    for face in planar:
        axes=[i for i,n in enumerate(face['normal']) if abs(abs(n)-1)<=1e-9];require(len(axes)==1 and all(abs(face['normal'][j])<=1e-9 for j in range(3) if j!=axes[0]),'axis-aligned outer plane');axis=axes[0];sign=1 if face['normal'][axis]>0 else -1;near(face['origin'][axis],hi[axis] if sign>0 else lo[axis]);
        if axis==2:
            require(len(face['loops'])==6,'one rectangle and five hole loops on each cap');rect=[loop for loop in face['loops'] if len(loop)==4 and all(e['curve']['kind']=='LINE' for e in loop)];require(len(rect)==1,'actual rectangular cap outer loop')
            points={tuple(round(v,7) for v in p) for edge in rect[0] for p in edge['points']};expected={(x,y,round(face['origin'][2],7)) for x in (round(lo[0],7),round(hi[0],7)) for y in (round(lo[1],7),round(hi[1],7))};require(points==expected,'cap outer rectangle corners')
            found=set()
            for loop in face['loops']:
                if loop is rect[0]:continue
                require(len(loop)==1,'one closed analytic circular edge per hole cap');e=loop[0];c=e['curve'];require(c['kind']=='CIRCLE' and e['vertices'][0]==e['vertices'][1],'full circle rim');near(abs(c['axis'][2]),1,1e-9);near(c['center'][2],face['origin'][2]);near(math.dist(e['points'][0],c['center']),c['radius']);key=hole_key(c['center'],c['radius']);require(key not in found,'unique cap bore');found.add(key)
            require(len(found)==5,'all five actual cap bores');caps.append(face)
        else:require(len(face['loops'])==1 and len(face['loops'][0])==4 and all(e['curve']['kind']=='LINE' for e in face['loops'][0]),'four-edge outer side');outer_sides.append(face)
    require(len(caps)==2 and len(outer_sides)==4,'all six outer planes');seen=set()
    for face in cylindrical:
        near(abs(face['axis'][2]),1,1e-9);key=hole_key(face['origin'],face['radius']);require(key not in seen,'unique cylindrical bore');seen.add(key);require(len(face['loops'])==1 and len(face['loops'][0])==4,'finite cylindrical trim')
        circles=[e for e in face['loops'][0] if e['curve']['kind']=='CIRCLE'];lines=[e for e in face['loops'][0] if e['curve']['kind']=='LINE'];require(len(circles)==2 and len(lines)==2 and lines[0]['ref']==lines[1]['ref'],'actual two rims and repeated seam')
        vector(sorted(c['curve']['center'][2] for c in circles),[lo[2],hi[2]]);vector(sorted(p[2] for p in lines[0]['points']),[lo[2],hi[2]])
        for edge in circles:require(hole_key(edge['curve']['center'],edge['curve']['radius'])==key,'rim belongs to the same bore')
    volume=(w*h-math.pi*sum(face['radius']**2 for face in cylindrical))*d;near(volume,truth['volume'])
    return {'quality':'independent-analytic-STEP21-five-bore-subset','solidCount':1,'faces':len(faces),'planes':6,'cylinders':5,'vertices':len(used_vertices),'edges':len(used_edges),'bounds':{'min':lo,'max':hi},'analyticVolume':volume,'holes':sorted([[c['origin'][0],c['origin'][1],c['radius']] for c in cylindrical]),'generalInterchangeQualified':False}
