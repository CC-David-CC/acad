"""Independent bounded STEP21 subset reader for the finite centered flat-bottom blind plate.

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
        # AP214 uncertainty uses a typed scalar rather than a bare number.
        # Keep the wrapper explicit; it is not a geometric measurement or a
        # reason to relax any of the shell/curve/unit checks below.
        if token=='LENGTH_MEASURE':
            args=value(depth+1)
            require(isinstance(args,tuple) and len(args)==1 and isinstance(args[0],float) and math.isfinite(args[0]),'one finite typed length measure')
            return ('typed',token,args)
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
    shell=record(solids[0],'MANIFOLD_SOLID_BREP')[1][1];faces=record(shell,'CLOSED_SHELL')[1][1];require(0<len(faces)<=256 and len(set(faces))==len(faces),'bounded unique actual face roster')
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
    require(len(cylindrical)==1,'one actual cylindrical blind wall in this finite subset')
    require(all(n==2 for n in edge_use.values()),'actual closed shell edge membership')
    require(len(used_vertices)-len(used_edges)+face_contribution==2,'blind recess does not create a through handle')
    vertices=[vertex(v) for v in used_vertices];lo=[min(p[i] for p in vertices) for i in range(3)];hi=[max(p[i] for p in vertices) for i in range(3)]
    vector(lo,[0,0,0]);vector(hi,[100,50,truth['thickness']]);floor=truth['thickness']-truth['depth'];radius=truth['diameter']/2;require(0<floor<truth['thickness'],'actual interior floor')
    def circle_loop(loop,z):
        require(len(loop)==1,'one actual closed rim edge');e=loop[0];c=e['curve'];require(c['kind']=='CIRCLE' and e['vertices'][0]==e['vertices'][1],'closed circular rim')
        vector(c['center'],[50,25,z]);near(c['radius'],radius);near(abs(c['axis'][2]),1,1e-9);near(math.dist(e['points'][0],c['center']),radius);return e['ref']
    def rectangle(loop,z):
        require(len(loop)==4 and all(e['curve']['kind']=='LINE' for e in loop),'actual rectangular cap loop')
        corners=[(x,y,z) for x in (0,100) for y in (0,50)];counts=[0]*4
        for e in loop:
            for p in e['points']:
                choices=[i for i,q in enumerate(corners) if math.dist(p,q)<=1e-6];require(len(choices)==1,'actual original cap corner');counts[choices[0]]+=1
        require(counts==[2]*4,'every original cap corner belongs to exactly two sides')
    outer=set();floor_face=None;top_rim=None;floor_rim=None
    for f in planar:
        axes=[i for i,n in enumerate(f['normal']) if abs(abs(n)-1)<=1e-9];require(len(axes)==1 and all(abs(f['normal'][j])<=1e-9 for j in range(3) if j!=axes[0]),'actual axis-aligned analytic support');axis=axes[0];sign=1 if f['normal'][axis]>0 else -1
        if axis==2 and abs(f['origin'][2]-floor)<=1e-6:
            require(sign==1 and floor_face is None and len(f['loops'])==1,'one true upward flat blind floor');floor_face=f;floor_rim=circle_loop(f['loops'][0],floor);continue
        key=(axis,sign);require(key not in outer,'no overlapping duplicate outer support in finite subset');outer.add(key);near(f['origin'][axis],hi[axis] if sign>0 else lo[axis])
        if axis==2:
            rect=[r for r in f['loops'] if len(r)==4 and all(e['curve']['kind']=='LINE' for e in r)];require(len(rect)==1,'one actual outer cap rectangle');rectangle(rect[0],f['origin'][2]);others=[r for r in f['loops'] if r is not rect[0]]
            if sign>0:require(len(others)==1,'one blind opening on the entry cap');top_rim=circle_loop(others[0],hi[2])
            else:require(not others,'bottom is closed material, not THRU')
        else:require(len(f['loops'])==1 and len(f['loops'][0])==4 and all(e['curve']['kind']=='LINE' for e in f['loops'][0]),'actual untouched rectangular outer side')
    require(outer=={(i,s) for i in range(3) for s in (-1,1)} and floor_face is not None,'complete source boundary plus genuine interior floor')
    f=cylindrical[0];near(abs(f['axis'][2]),1,1e-9);near(f['origin'][0],50);near(f['origin'][1],25);near(f['radius'],radius);require(len(f['loops'])==1 and len(f['loops'][0])==4,'actual finite cylinder boundary')
    circles=[e for e in f['loops'][0] if e['curve']['kind']=='CIRCLE'];lines=[e for e in f['loops'][0] if e['curve']['kind']=='LINE'];require(len(circles)==2 and len(lines)==2 and lines[0]['ref']==lines[1]['ref'],'two rims and genuine repeated seam')
    require({e['ref'] for e in circles}=={top_rim,floor_rim},'same actual top/floor edges shared by cylinder and planes');vector(sorted(c['curve']['center'][2] for c in circles),[floor,hi[2]]);vector(sorted(p[2] for p in lines[0]['points']),[floor,hi[2]])
    for edge in circles:vector(edge['curve']['center'][:2],[50,25]);near(edge['curve']['radius'],radius)
    volume=(hi[0]-lo[0])*(hi[1]-lo[1])*(hi[2]-lo[2])-math.pi*radius**2*(hi[2]-floor);near(volume,truth['volume'])
    return {'quality':'independent-analytic-STEP21-centered-blind-subset','solidCount':1,'actualFaceCount':len(faces),'actualEdgeCount':len(used_edges),'bounds':{'min':lo,'max':hi},'floorLevel':floor,'depthFromEntry':hi[2]-floor,'diameter':2*radius,'analyticVolume':volume,'generalInterchangeQualified':False}
