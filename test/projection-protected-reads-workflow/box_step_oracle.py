"""Independent bounded STEP21 subset reader for the genuine unchanged rectangular plate.

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
        _,v=record(a[2],'VECTOR');require(isinstance(v[2],float) and math.isfinite(v[2]) and v[2]>0,'finite positive LINE vector magnitude');return {'kind':typ,'origin':xyz(a[1]),'direction':direction(v[1],None),'scale':v[2]}
    def dot(a,b):return math.fsum(x*y for x,y in zip(a,b))
    def sub(a,b):return tuple(x-y for x,y in zip(a,b))
    def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
    def curve_incidence(c,p,q,same_sense):
        require(same_sense in (('enum','T'),('enum','F')),'actual EDGE_CURVE same_sense')
        if c['kind']=='LINE':
            parameters=[]
            for point in (p,q):
                relative=sub(point,c['origin']);require(math.hypot(*cross(relative,c['direction']))<=1e-6,'actual LINE support contains actual endpoint')
                parameter=dot(relative,c['direction'])/c['scale'];require(math.isfinite(parameter),'finite LINE endpoint parameter');parameters.append(parameter)
                vector(tuple(c['origin'][i]+parameter*c['scale']*c['direction'][i] for i in range(3)),point)
            require(parameters[0]!=parameters[1] and ((parameters[1]>parameters[0])==(same_sense==('enum','T'))),'actual finite LINE endpoint traversal agrees with same_sense')
        else:
            for point in (p,q):
                relative=sub(point,c['center']);require(abs(dot(relative,c['axis']))<=1e-6,'actual CIRCLE endpoint plane incidence');near(math.hypot(*relative),c['radius'])
    def surface_incidence(loops,typ,origin,axis,radius):
        for loop in loops:
            for edge in loop:
                c=edge['curve']
                for point in edge['points']:
                    relative=sub(point,origin)
                    if typ=='PLANE':require(abs(dot(relative,axis))<=1e-6,'actual edge endpoint lies on its actual planar face support')
                    else:near(math.hypot(*cross(relative,axis)),radius)
                if typ=='PLANE':
                    if c['kind']=='LINE':require(abs(dot(c['direction'],axis))<=1e-9 and abs(dot(sub(c['origin'],origin),axis))<=1e-6,'actual LINE is incident with its actual planar face')
                    else:require(math.hypot(*cross(c['axis'],axis))<=1e-9 and abs(dot(sub(c['center'],origin),axis))<=1e-6,'actual CIRCLE is incident with its actual planar face')
                elif c['kind']=='LINE':
                    require(math.hypot(*cross(c['direction'],axis))<=1e-9,'actual cylindrical seam LINE follows actual cylinder axis');near(math.hypot(*cross(sub(c['origin'],origin),axis)),radius)
                else:
                    require(math.hypot(*cross(c['axis'],axis))<=1e-9 and math.hypot(*cross(sub(c['center'],origin),axis))<=1e-6,'actual circular rim follows actual cylinder support');near(c['radius'],radius)
    solids=[('ref',i) for i,(kind,_) in records.items() if kind=='MANIFOLD_SOLID_BREP'];require(len(solids)==1,'exactly one STEP manifold solid')
    shell=record(solids[0],'MANIFOLD_SOLID_BREP')[1][1];faces=record(shell,'CLOSED_SHELL')[1][1];require(0<len(faces)<=256 and len(set(faces))==len(faces),'bounded unique actual face roster')
    edge_use=collections.Counter();edge_incidence=collections.defaultdict(list);used_vertices=set();used_edges=set();planar=[];cylindrical=[];face_contribution=0
    for face_ref in faces:
        _,a=record(face_ref,'ADVANCED_FACE');bounds,surface,sense=a[1:];require(sense in (('enum','T'),('enum','F')),'face orientation');loops=[];face_contribution+=2-len(bounds)
        for bound in bounds:
            typ,b=record(bound);require(typ in ('FACE_BOUND','FACE_OUTER_BOUND') and len(b)==3 and b[2] in (('enum','T'),('enum','F')),'actual face-bound kind/orientation');bound_kind=typ;bound_sign=1 if b[2]==('enum','T') else -1;_,loop=record(b[1],'EDGE_LOOP');edges=[]
            for oriented in loop[1]:
                _,o=record(oriented,'ORIENTED_EDGE');edge=o[3];_,e=record(edge,'EDGE_CURVE');require(o[4] in (('enum','T'),('enum','F')),'oriented edge sense')
                start,end=e[1],e[2];used_vertices.update((start,end));used_edges.add(edge);edge_use[edge]+=1
                p,q=vertex(start),vertex(end);ends=(start,end) if o[4]==('enum','T') else (end,start);support=curve(e[3]);curve_incidence(support,p,q,e[4])
                edges.append({'ref':edge,'vertices':(start,end),'points':(p,q),'ends':ends,'curve':support,'sameSense':e[4],'effectiveSign':(1 if o[4]==('enum','T') else -1)*bound_sign,'boundKind':bound_kind})
            require(edges and all(edges[j]['ends'][1]==edges[(j+1)%len(edges)]['ends'][0] for j in range(len(edges))),'closed underlying edge loop')
            # STEP bounds explicitly orient their loop in the face. Unlike
            # TopoDS, ADVANCED_FACE.same_sense does NOT implicitly flip these
            # edge uses again; it sets the geometric normal separately below.
            if bound_sign<0:edges=[{**edge,'ends':edge['ends'][::-1]} for edge in reversed(edges)]
            require(all(edges[j]['ends'][1]==edges[(j+1)%len(edges)]['ends'][0] for j in range(len(edges))),'closed effective face-bound loop')
            for edge in edges:edge_incidence[edge['ref']].append((face_ref,bound,edge['effectiveSign']))
            loops.append(edges)
        typ,s=record(surface);require(typ in ('PLANE','CYLINDRICAL_SURFACE'),'only actual analytic plane/cylinder surfaces')
        origin,axis=placement(s[1]);normal=tuple(x*(1 if sense==('enum','T') else -1) for x in axis)
        surface_incidence(loops,typ,origin,axis,None if typ=='PLANE' else s[2])
        require(sum(loop[0]['boundKind']=='FACE_OUTER_BOUND' for loop in loops)<=1,'at most one declared outer bound per analytic face')
        row={'origin':origin,'axis':axis,'normal':normal,'loops':loops,'sameSense':sense}
        if typ=='PLANE':planar.append(row)
        else:require(s[2]>0 and sense==('enum','F'),'inward cylindrical hole face');row['radius']=s[2];cylindrical.append(row)
    require(not cylindrical and len(planar)==6,'exactly six actual planar box faces, no other surfaces')
    require(all(n==2 for n in edge_use.values()) and all(len(v)==2 and v[0][2]==-v[1][2] for v in edge_incidence.values()),'closed shell exact two opposite edge uses')
    require(len(used_vertices)==8 and len(used_edges)==12 and face_contribution==6,'complete actual box topology')
    require(len(used_vertices)-len(used_edges)+face_contribution==2,'closed genus-zero box')
    size=(100,50,20);corners=[(x,y,z) for x in (0,100) for y in (0,50) for z in (0,20)];vertices=[vertex(v) for v in used_vertices]
    assigned=[]
    for point in vertices:
        candidates=[i for i,p in enumerate(corners) if math.dist(point,p)<=1e-6];require(len(candidates)==1,'each actual vertex is one analytic box corner');assigned.append(candidates[0])
    require(set(assigned)==set(range(8)),'all corners exactly once');seen=set();volume=0
    for f in planar:
        axis=[i for i,n in enumerate(f['normal']) if abs(abs(n)-1)<=1e-9];require(len(axis)==1,'one principal support axis');axis=axis[0];sign=1 if f['normal'][axis]>0 else -1
        require(all(abs(f['normal'][j])<=1e-9 for j in range(3) if j!=axis),'actual outward principal normal');key=(axis,sign);require(key not in seen,'unique actual support');seen.add(key);near(f['origin'][axis],size[axis] if sign>0 else 0)
        require(len(f['loops'])==1 and len(f['loops'][0])==4,'one four-edge actual finite face bound');loop=f['loops'][0];require(all(e['curve']['kind']=='LINE' for e in loop),'every actual boundary is a LINE')
        ps=[vertex(e['ends'][0]) for e in loop];actual=set()
        for edge in loop:
            p,q=[vertex(end) for end in edge['ends']];near(p[axis],size[axis] if sign>0 else 0);near(q[axis],size[axis] if sign>0 else 0)
            changed=[j for j in range(3) if abs(p[j]-q[j])>1e-6];require(len(changed)==1 and changed[0]!=axis,'true box side not diagonal');near(abs(p[changed[0]]-q[changed[0]]),size[changed[0]])
            actual.add(next(i for i,c in enumerate(corners) if math.dist(p,c)<=1e-6))
        require(len(actual)==4,'four distinct face corners');area_vec=tuple(math.fsum(cross(ps[j],ps[(j+1)%4])[i] for j in range(4))/2 for i in range(3));area=dot(area_vec,f['normal']);near(area,math.prod(size[j] for j in range(3) if j!=axis),1e-6)
        # Actual finite oriented bound + outward support proves enclosed volume.
        volume+=dot(f['origin'],f['normal'])*area/3
    require(seen=={(i,s) for i in range(3) for s in (-1,1)},'complete six outward finite supports');near(volume,100000,1e-6)
    return {'quality':'independent-finite-six-plane-STEP-box','faces':6,'edges':12,'vertices':8,'lineSupportAndSenseChecked':True,'outwardFiniteBoundsChecked':True,'volume':volume,'bounds':{'min':[0,0,0],'max':list(size)}}
