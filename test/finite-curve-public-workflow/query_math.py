"""Independent original-source rational support census; no production imports.

Surds are enclosed with integer isqrt at 256 fractional bits, never sampled.
This offline expectation neither issues events nor authenticates a live source.
"""
from fractions import Fraction as F
from functools import cmp_to_key
from math import isqrt, isfinite
import re

def require(v, message):
    if not v: raise ValueError(message)

def number(v):
    require(type(v) in (int, float) and isfinite(v), 'finite represented coordinate')
    return F(v)

def point(v): return tuple(number(v[k]) for k in ('x', 'y'))
def add(a,b): return tuple(x+y for x,y in zip(a,b))
def sub(a,b): return tuple(x-y for x,y in zip(a,b))
def scale(a,t): return tuple(x*t for x in a)
def dot(a,b): return sum(x*y for x,y in zip(a,b))
def cross(a,b): return a[0]*b[1]-a[1]*b[0]
def sign(n): return (n>0)-(n<0)
def rng(v): return (v,v)
def plus(a,b): return (a[0]+b[0],a[1]+b[1])
def times(a,n): return tuple(sorted((a[0]*n,a[1]*n)))
def rsign(a):
    if a[0]>0:return 1
    if a[1]<0:return -1
    require(a==(0,0),'independent interval sign must be resolved')
    return 0

def sqrt_range(v):
    require(v>=0,'nonnegative radical')
    n,d=isqrt(v.numerator),isqrt(v.denominator)
    if n*n==v.numerator and d*d==v.denominator:return rng(F(n,d))
    bits=256; q=isqrt((v.numerator << (2*bits))//v.denominator)
    lo,hi=F(q,1<<bits),F(q+1,1<<bits)
    require(lo*lo<=v<=hi*hi,'exact radical enclosure')
    return lo,hi

def encoded(v):
    require(type(v) is dict and set(v)=={'numeratorHex','denominatorHex'},'encoded rational fields')
    n,d=v['numeratorHex'],v['denominatorHex']
    require(type(n) is str and type(d) is str and len(n)<=4097 and len(d)<=4096,'bounded encoded integers')
    require(re.fullmatch(r'0|-?[1-9a-f][0-9a-f]*',n) and re.fullmatch(r'[1-9a-f][0-9a-f]*',d),'canonical hex integers')
    return F(int(n,16),int(d,16))

def half(v):return 0 if v[1]>0 or v[1]==0 and v[0]>=0 else 1
def cmp(a,b):return half(a)-half(b) if half(a)!=half(b) else -sign(cross(a,b))
def compare_root(a,w):
    sy=rsign(w[1]);sx=rsign(w[0]) if sy==0 else 1
    h=0 if sy>0 or sy==0 and sx>=0 else 1
    if half(a)!=h:return half(a)-h
    return -rsign(plus(times(w[1],a[0]),times(w[0],-a[1])))

def geometry(row):
    d=row['data'];kind=row['type']
    require(kind in ('Segment','Circle','Arc'),'ordinary source curve')
    if kind=='Segment':return {'id':row['id'],'kind':kind,'a':point(d['a']),'b':point(d['b'])}
    value={'id':row['id'],'kind':kind,'c':point(d['c'])}
    if kind=='Circle':value['r']=number(d['r'])
    else:
        require(d['branch'] in ('proper-ccw','full-ccw'),'explicit original Arc branch')
        value.update(a=point(d['a']),b=point(d['b']),branch=d['branch'])
        value['r2']=dot(sub(value['a'],value['c']),sub(value['a'],value['c']))
    return value

def r2(c):return c['r2'] if c['kind']=='Arc' else c['r']**2
def inside_direction(c,w):
    if c['kind']=='Circle':return True
    a,b=sub(c['a'],c['c']),sub(c['b'],c['c']);av,bv=cmp(a,w),cmp(b,w)
    return av<=0 and bv>=0 if cmp(a,b)<0 else av<=0 or bv>=0

def membership(c,root,domain):
    xy=root['xy']
    if c['kind']=='Segment':
        d=sub(c['b'],c['a']);k=0 if d[0] else 1
        t=times(plus(xy[k],rng(-c['a'][k])),1/d[k])
        if t==(0,0):location='endpoint-a'
        elif t==(1,1):location='endpoint-b'
        elif t[0]>0 and t[1]<1:location='interior'
        elif t[1]<0 or t[0]>1:location='outside'
        else:raise ValueError('Unresolved independent finite endpoint interval')
        selected=location!='outside'
        if domain['kind']=='endpoint-ray' and domain['targetCurveId']==c['id']:
            selected=t[1]<0 if domain['endpoint']=='a' else t[0]>1
        return {'curveId':c['id'],'location':location},selected
    if c['kind']=='Circle':return {'curveId':c['id'],'location':'periodic'},True
    require(c['branch']=='proper-ccw','full Arc query remains required OPEN')
    w=tuple(plus(xy[i],rng(-c['c'][i])) for i in range(2))
    a,b=sub(c['a'],c['c']),sub(c['b'],c['c']);av,bv=compare_root(a,w),compare_root(b,w)
    selected=av<=0 and bv>=0 if cmp(a,b)<0 else av<=0 or bv>=0
    location='endpoint-a' if av==0 else 'endpoint-b' if bv==0 else 'interior' if selected else 'outside'
    return {'curveId':c['id'],'location':location},selected

def support(curves):
    lines=[c for c in curves if c['kind']=='Segment']
    if len(lines)==2:
        a,b=lines;u,v=sub(a['b'],a['a']),sub(b['b'],b['a']);D=cross(u,v)
        if D==0:return 'line-line','continuum' if cross(sub(b['a'],a['a']),u)==0 else 0,[]
        t=cross(sub(b['a'],a['a']),v)/D;p=add(a['a'],scale(u,t))
        return 'line-line',1,[{'xy':tuple(rng(x) for x in p),'multiplicity':1}]
    if len(lines)==1:
        line=lines[0];c=next(c for c in curves if c['kind']!='Segment');u=sub(line['b'],line['a']);w=sub(line['a'],c['c']);A=dot(u,u);B=2*dot(u,w);C=dot(w,w)-r2(c);D=B*B-4*A*C
        kind='line-circle';origin=line['a'];direction=u;denominator=2*A;offset=-B
    else:
        a,b=curves;u=sub(b['c'],a['c']);D0=dot(u,u)
        if D0==0:return 'circle-circle','continuum' if r2(a)==r2(b) else 0,[]
        K=D0+r2(a)-r2(b);D=4*D0*r2(a)-K*K;kind='circle-circle'
        origin=add(a['c'],scale(u,K/(2*D0)));direction=(-u[1]/(2*D0),u[0]/(2*D0));denominator=1;offset=0
    if D<0:return kind,0,[]
    radical=sqrt_range(D);roots=[]
    for s in ([1] if D==0 else [-1,1]):
        parameter=times(plus(rng(offset),times(radical,s)),F(1)/denominator)
        roots.append({'xy':tuple(plus(rng(origin[i]),times(parameter,direction[i])) for i in range(2)),'multiplicity':2 if D==0 else 1})
    return kind,len(roots),roots

def overlap_expected(curves,domain):
    if all(c['kind']=='Segment' for c in curves):
        first=curves[0];d=sub(first['b'],first['a']);k=0 if d[0] else 1
        def t(p):return (p[k]-first['a'][k])/d[k]
        bounds=[]
        for c in curves:
            a,b=t(c['a']),t(c['b']);lo,hi=sorted((a,b));lc=hc=True
            if domain['kind']=='endpoint-ray' and domain['targetCurveId']==c['id']:
                end=a if domain['endpoint']=='a' else b
                toward_negative=(domain['endpoint']=='a')==(b>a)
                lo,hi,lc,hc=(None,end,False,False) if toward_negative else (end,None,False,False)
            bounds.append((lo,hi,lc,hc))
        lo=max(x[0] for x in bounds if x[0] is not None);hi=min(x[1] for x in bounds if x[1] is not None)
        lc=all(x[0]!=lo or x[2] for x in bounds);hc=all(x[1]!=hi or x[3] for x in bounds)
        if lo>hi or lo==hi and not(lc and hc):return []
        def owners(at):return [{'curveId':c['id'],'endpoint':end} for c in curves for end in ('a','b') if t(c[end])==at]
        return [{'kind':'linear-contact' if lo==hi else 'linear-interval','lower':lo,'upper':hi,'lowerClosed':lc,'upperClosed':hc,'lowerOccurrences':owners(lo),'upperOccurrences':owners(hi)}]
    if all(c['kind']=='Circle' for c in curves):return [{'kind':'periodic-full'}]
    nodes=[{'direction':(F(1),F(0)),'periodicSeam':True,'occurrences':[]}]
    for c in curves:
        if c['kind']!='Arc':continue
        for end in ('a','b'):
            d=sub(c[end],c['c']);match=[n for n in nodes if cmp(n['direction'],d)==0]
            if not match:nodes.append({'direction':d,'periodicSeam':False,'occurrences':[]});match=[nodes[-1]]
            match[0]['occurrences'].append({'curveId':c['id'],'endpoint':end})
    nodes.sort(key=cmp_to_key(lambda a,b:cmp(a['direction'],b['direction'])))
    def marker(n):return {k:n[k] for k in ('periodicSeam','occurrences')}
    answer=[];covered=set()
    for i,n in enumerate(nodes):
        j=(i+1)%len(nodes);a,b=n['direction'],nodes[j]['direction'];s=sign(cross(a,b))
        w=add(a,b) if s>0 else scale(add(a,b),-1) if s<0 else (-a[1],a[0])
        if all(inside_direction(c,w) for c in curves):
            answer.append({'kind':'circular-interval','from':marker(n),'to':marker(nodes[j]),'wraps':j==0,'lowerClosed':True,'upperClosed':True});covered.update((i,j))
    for i,n in enumerate(nodes):
        if i not in covered and all(inside_direction(c,n['direction']) for c in curves):answer.append({'kind':'circular-contact','at':marker(n)})
    return answer

def check_query(row):
    request,result=row['request'],row['result'];source=json_source(row['before'],request['faceId']);objects={o['id']:o for o in source['objects']}
    require(len(objects)==len(source['objects']),'unique source roots')
    require(set(result)=={'version','revision','faceId','unit','engine','engineRevision','curveIds','domain','status','reason','queryId','support','events','overlaps'},'exact public query fields')
    for k in ('revision','faceId','engine','engineRevision','domain'):require(result[k]==request[k],'original query '+k)
    require(result['version']==1 and result['unit']=='millimeter','query version/unit')
    expected_ids=sorted(request['curveIds'],key=lambda s:s.encode('utf-16-be','surrogatepass'))
    require(result['curveIds']==expected_ids and len(set(expected_ids))==2,'canonical actual input identities')
    spec=row['binding'].get('spec',{});name=row['label']
    if result['status']!='certified':
        require(result['status'] in ('uncertain','unsupported') and result['queryId'] is None and result['support'] is None and result['events']==[] and result['overlaps']==[],'noncertified reply has no authority/partial geometry')
        why=result['reason'];require(type(why) is dict and set(why)=={'layer','code','message'} and all(type(why[k]) is str and why[k] and len(why[k])<=(512 if k=='message' else 64) for k in why),'actual bounded machine reason')
        allowed=spec.get('status')==result['status'] or spec.get('allowConditioningUncertainty') and result['status']=='uncertain'
        require(allowed,'ordinary required positive cannot be replaced by uncertainty')
        if 'reason' in spec:require(why['code']==spec['reason'],'exact intended source/mathematical uncertainty')
        if spec.get('allowConditioningUncertainty'):
            require(why['code'] in ('NATIVE_BASIS_UNQUALIFIED','NATIVE_NOT_DONE','NATIVE_ROOT_CENSUS','NATIVE_FLAGS','CANDIDATE_NOT_ENCLOSED','ROOTS_NOT_SEPARATED','FINITE_DOMAIN_UNRESOLVED','CURVE_QUERY_UNCERTAIN'),'actual finite mathematical/Native uncertainty, not an arbitrary failed request/resource/code')
        if spec.get('requiredOpen'):require(result['status']=='unsupported','full Arc remains explicitly required OPEN')
        return {'label':name,'status':result['status'],'code':why['code'],'requiredOpen':bool(spec.get('requiredOpen'))}
    curves=[geometry(objects[id]) for id in expected_ids]
    require(result['reason'] is None,'certified reason is null')
    kind,count,roots=support(curves);require(result['support']=={'kind':kind,'rootCount':count},'independent exact support root census')
    if count=='continuum':
        expected=overlap_expected(curves,request['domain']);actual=result['overlaps'];remaining=list(expected)
        for r in actual:
            if r['kind'] in ('linear-contact','linear-interval'):
                r=dict(r);r['lower']=encoded(r['lower']);r['upper']=encoded(r['upper'])
                require(r in remaining,'actual linear overlap/source endpoint owners')
            else:require(r in remaining,'actual circular overlap/source endpoint owners')
            remaining.remove(r)
        require(not remaining and result['events']==[] and result['queryId'] is None,'complete common-support intervals, no isolated ticket')
        return {'label':name,'status':'certified','supportCount':'continuum','intervals':len(expected)}
    require(result['overlaps']==[],'isolated support cannot carry intervals')
    wanted=[]
    for root in roots:
        memberships=[membership(c,root,request['domain']) for c in curves]
        if all(selected for _,selected in memberships):wanted.append({**root,'occurrences':[v for v,_ in memberships]})
    require(len(result['events'])==len(wanted),'complete independent finite/ray root census')
    matched=set();ids=[];budget=F(1,20000000)**2
    for event in result['events']:
        require(set(event)=={'eventId','point','multiplicity','occurrences','errorSquaredUpper','withinBudget'},'exact event fields')
        require(type(event['point']) is list and len(event['point'])==2,'actual candidate pair')
        p=tuple(number(v) for v in event['point']);bound=encoded(event['errorSquaredUpper']);require(bound>=0,'nonnegative actual distance enclosure')
        require(type(event['withinBudget']) is bool and event['withinBudget']==(bound<=budget),'independent50pm witness budget')
        matches=[]
        for i,root in enumerate(wanted):
            upper=sum(max(abs(p[k]-root['xy'][k][0]),abs(p[k]-root['xy'][k][1]))**2 for k in range(2))
            if upper<=bound:matches.append(i)
        require(len(matches)==1 and matches[0] not in matched,'one distinct independently enclosed original root per event')
        index=matches[0];matched.add(index);root=wanted[index]
        require(event['multiplicity']==root['multiplicity'] and event['occurrences']==root['occurrences'],'actual original root multiplicity and finite ownership')
        if event['eventId'] is not None:
            require(event['withinBudget'] and type(event['eventId']) is str and 0<len(event['eventId'])<=256,'actual bounded issued event requires distance qualification');ids.append(event['eventId'])
        # withinBudget is necessary, never sufficient: a nonactionable C/C pair
        # can truthfully return mathematical points without any editing ticket.
    require(len(ids)==len(set(ids)),'unique actual event identities')
    require((type(result['queryId']) is str and 0<len(result['queryId'])<=256) if ids else result['queryId'] is None,'query receipt iff a selectable actual event')
    return {'label':name,'status':'certified','supportCount':count,'finiteCount':len(wanted)}

def json_source(state,face_id):
    import json
    rows=[r for r in state['capture']['native']['sketches'] if r['id']==face_id]
    require(len(rows)==1,'one actual original source')
    return json.loads(rows[0]['source'])
