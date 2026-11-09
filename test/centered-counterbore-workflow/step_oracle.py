"""Independent bounded STEP21 subset reader for the finite centered stepped counterbore plate.

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
    require(len(cylindrical)==2,'exactly two actual inward cylindrical intervals')
    require(all(n==2 for n in edge_use.values()),'actual closed shell two-use incidence')
    require(all(len(uses)==2 and uses[0][2]==-uses[1][2] for uses in edge_incidence.values()),'actual opposite effective face-bound uses including seam occurrences')
    require(len(used_vertices)-len(used_edges)+face_contribution==0,'one genuine through handle, annular shoulder is not a floor disk')
    vertices=[vertex(v) for v in used_vertices];lo=[min(p[i] for p in vertices) for i in range(3)];hi=[max(p[i] for p in vertices) for i in range(3)]
    W,H,T=truth['width'],truth['height'],truth['thickness'];r,R=truth['throughDiameter']/2,truth['stepDiameter']/2;s=T-truth['stepDepth'];cx,cy=W/2,H/2
    vector(lo,[0,0,0]);vector(hi,[W,H,T]);require(0<r<R and 0<s<T,'strict finite step domain')
    def planar_loop_orientation(loop,normal,outer):
        require(outer or loop[0]['boundKind']!='FACE_OUTER_BOUND','declared outer bound cannot be an actual inner hole')
        if all(edge['curve']['kind']=='LINE' for edge in loop):
            area_vector=tuple(math.fsum(cross(vertex(edge['ends'][0]),vertex(edge['ends'][1]))[i] for edge in loop)/2 for i in range(3));oriented_area=dot(area_vector,normal)
        elif len(loop)==1 and loop[0]['curve']['kind']=='CIRCLE' and loop[0]['vertices'][0]==loop[0]['vertices'][1]:
            edge=loop[0];c=edge['curve'];natural_sign=edge['effectiveSign']*(1 if edge['sameSense']==('enum','T') else -1);oriented_area=math.pi*c['radius']**2*dot(c['axis'],normal)*natural_sign
        else:raise ValueError('Unsupported finite planar loop for independent orientation proof')
        require(math.isfinite(oriented_area) and (oriented_area>0 if outer else oriented_area<0),'effective planar outer/inner loop orientation agrees with actual oriented face normal')
    def cylinder_rim_orientation(face,circles):
        # Cylinder UV orientation: increasing angle at the low axial bound,
        # decreasing angle at the high bound, reversed for an inward face.
        ordered=sorted(circles,key=lambda edge:dot(sub(edge['curve']['center'],face['origin']),face['axis']));sense=1 if face['sameSense']==('enum','T') else -1
        require(dot(sub(ordered[1]['curve']['center'],ordered[0]['curve']['center']),face['axis'])>0,'distinct actual cylindrical axial bounds')
        for edge,expected in zip(ordered,(sense,-sense)):
            natural_sign=edge['effectiveSign']*(1 if edge['sameSense']==('enum','T') else -1);actual=dot(edge['curve']['axis'],face['axis'])*natural_sign;near(actual,expected,1e-9)
    def circle_loop(loop,z,radius):
        require(len(loop)==1,'one genuine closed rim edge');e=loop[0];c=e['curve'];require(c['kind']=='CIRCLE' and e['vertices'][0]==e['vertices'][1],'actual closed circular rim')
        vector(c['center'],[cx,cy,z]);near(c['radius'],radius);near(abs(c['axis'][2]),1,1e-9);near(math.dist(e['points'][0],c['center']),radius);return e['ref']
    def rectangle(loop,z):
        require(len(loop)==4 and all(e['curve']['kind']=='LINE' for e in loop),'actual rectangular cap loop')
        corners=[(x,y,z) for x in (0,W) for y in (0,H)];counts=[0]*4;actual=set()
        for e in loop:
            pair=[]
            for p in e['points']:
                choices=[i for i,q in enumerate(corners) if math.dist(p,q)<=1e-6];require(len(choices)==1,'actual original cap corner');counts[choices[0]]+=1;pair.append(choices[0])
            require(pair[0]!=pair[1],'distinct cap corners');a,b=[corners[i] for i in pair];require((a[0]==b[0])!=(a[1]==b[1]),'actual axis side, not diagonal');actual.add(tuple(sorted(pair)))
        require(counts==[2]*4 and len(actual)==4,'complete original cap boundary')
    outer=set();shoulder=None;bottom=None;top=None;inner=None;outer_rim=None
    for f in planar:
        axes=[i for i,n in enumerate(f['normal']) if abs(abs(n)-1)<=1e-9];require(len(axes)==1 and all(abs(f['normal'][j])<=1e-9 for j in range(3) if j!=axes[0]),'actual axis-aligned analytic support');axis=axes[0];sign=1 if f['normal'][axis]>0 else -1
        # Every actual trim endpoint must lie on this actual plane.
        for loop in f['loops']:
            for edge in loop:
                for p in edge['points']:near(sum((p[i]-f['origin'][i])*f['axis'][i] for i in range(3)),0)
        if axis==2 and abs(f['origin'][2]-s)<=1e-6:
            require(sign==1 and shoulder is None and len(f['loops'])==2,'one actual upward TWO-wire annular shoulder');shoulder=f
            radii=sorted((loop[0]['curve'].get('radius',-1),loop) for loop in f['loops']);inner=circle_loop(radii[0][1],s,r);outer_rim=circle_loop(radii[1][1],s,R);require(inner!=outer_rim,'distinct inner/outer shoulder edges');planar_loop_orientation(radii[1][1],f['normal'],True);planar_loop_orientation(radii[0][1],f['normal'],False);continue
        key=(axis,sign);require(key not in outer,'unique outer support');outer.add(key);near(f['origin'][axis],hi[axis] if sign>0 else lo[axis])
        if axis==2:
            rect=[q for q in f['loops'] if len(q)==4 and all(e['curve']['kind']=='LINE' for e in q)];require(len(rect)==1,'one outer source rectangle');rectangle(rect[0],f['origin'][2]);planar_loop_orientation(rect[0],f['normal'],True);holes=[q for q in f['loops'] if q is not rect[0]];require(len(holes)==1,'both actual source caps have one opening')
            if sign>0:top=circle_loop(holes[0],T,R)
            else:bottom=circle_loop(holes[0],0,r)
            planar_loop_orientation(holes[0],f['normal'],False)
        else:
            require(len(f['loops'])==1 and len(f['loops'][0])==4 and all(e['curve']['kind']=='LINE' for e in f['loops'][0]),'untouched rectangular side')
            planar_loop_orientation(f['loops'][0],f['normal'],True)
            points={tuple(p) for edge in f['loops'][0] for p in edge['points']};require(len(points)==4,'four real outer-side vertices')
            for p in points:require(all(any(abs(p[i]-v)<=1e-6 for v in (lo[i],hi[i])) for i in range(3)),'outer side endpoints belong to source box')
    require(outer=={(i,j) for i in range(3) for j in (-1,1)} and shoulder is not None and bottom!=top,'complete source boundary and annular shoulder')
    for f,rad,z0,z1,expected in [(min(cylindrical,key=lambda q:q['radius']),r,0,s,{bottom,inner}),(max(cylindrical,key=lambda q:q['radius']),R,s,T,{outer_rim,top})]:
        near(abs(f['axis'][2]),1,1e-9);near(f['origin'][0],cx);near(f['origin'][1],cy);near(f['radius'],rad);require(len(f['loops'])==1 and len(f['loops'][0])==4,'finite cylindrical four-use boundary')
        circles=[e for e in f['loops'][0] if e['curve']['kind']=='CIRCLE'];lines=[e for e in f['loops'][0] if e['curve']['kind']=='LINE'];require(len(circles)==2 and len(lines)==2 and lines[0]['ref']==lines[1]['ref'],'two real rims and repeated LINE seam')
        near(abs(lines[0]['curve']['direction'][2]),1,1e-9);near(lines[0]['curve']['direction'][0],0,1e-9);near(lines[0]['curve']['direction'][1],0,1e-9)
        cylinder_rim_orientation(f,circles)
        require({e['ref'] for e in circles}==expected,'SAME actual rim edges shared by corresponding cylinder/caps/annulus');vector(sorted(e['curve']['center'][2] for e in circles),[z0,z1]);vector(sorted(p[2] for p in lines[0]['points']),[z0,z1])
        for edge in circles:vector(edge['curve']['center'][:2],[cx,cy]);near(edge['curve']['radius'],rad)
        for edge in f['loops'][0]:
            for p in edge['points']:near(math.hypot(p[0]-cx,p[1]-cy),rad);require(z0-1e-6<=p[2]<=z1+1e-6,'actual trim finite cylinder span')
    volume=W*H*T-math.pi*(r*r*T+(R*R-r*r)*(T-s));near(volume,truth['volume'])
    return {'quality':'independent-analytic-STEP21-counterbore-subset','solidCount':1,'actualFaceCount':len(faces),'actualEdgeCount':len(used_edges),'bounds':{'min':lo,'max':hi},'shoulderLevel':s,'smallSpan':[0,s],'largeSpan':[s,T],'diameters':[2*r,2*R],'sharedRims':True,'lineSupportChecked':True,'analyticVolume':volume,'generalInterchangeQualified':False}
