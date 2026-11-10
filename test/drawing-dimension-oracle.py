"""Independent AFTER-WHOLE aligned-paper-dimension inequalities.

No renderer, lane search, Native implementation or production layout import.
Callers independently bind actual source/Native values, anchors and view bounds.
"""
import json, math, re
from fractions import Fraction as F

S = '{http://www.w3.org/2000/svg}'
PAPER = 1e-6  # Existing paper serialization/incidence budget, not source truth.
NUMBER = r'[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?'
REASONS = frozenset('DECLARED_TEXT_OUTSIDE_SHEET RESERVED_SHEET_BAND_CONFLICT DECLARED_TEXT_BOX_CONFLICT DECLARED_TEXT_GEOMETRY_CONFLICT VIEW_ENVELOPE_UNCERTAINTY PROJECTED_SPAN_COLLAPSED DERIVED_SPAN_UNREPRESENTABLE NO_CLEAR_BOUNDED_DIMENSION_LANE DIMENSION_LANE_OUTSIDE_SHEET DECLARED_TEXT_STROKE_CONFLICT DIMENSION_LINE_CROSSING PROJECTED_GEOMETRY_LINE_CROSSING ANCHOR_OR_PORT_BLOCKED NO_ROUTE_IN_BOUNDED_GRAPH'.split())

def box(points):
    return [min(p[0] for p in points), min(p[1] for p in points), max(p[0] for p in points), max(p[1] for p in points)]

def overlap(a, b):
    return a[0] < b[2] and a[2] > b[0] and a[1] < b[3] and a[3] > b[1]

def clipped_interval(a, b, rectangle, padding=F(0), closed=False):
    """Exact rational segment/open-or-closed-rectangle intersection interval."""
    if padding <= F(1,8) and (max(a[0],b[0]) < rectangle[0]-.25 or min(a[0],b[0]) > rectangle[2]+.25 or max(a[1],b[1]) < rectangle[1]-.25 or min(a[1],b[1]) > rectangle[3]+.25):
        return None
    a, b = tuple(map(F, a)), tuple(map(F, b))
    lo = [F(rectangle[i]) - padding for i in range(2)]
    hi = [F(rectangle[i + 2]) + padding for i in range(2)]
    lower, upper = F(0), F(1)
    for k in range(2):
        delta = b[k] - a[k]
        if not delta:
            if not (lo[k] <= a[k] <= hi[k] if closed else lo[k] < a[k] < hi[k]):
                return None
            continue
        x, y = sorted(((lo[k] - a[k]) / delta, (hi[k] - a[k]) / delta))
        lower, upper = max(lower, x), min(upper, y)
        if lower > upper or (not closed and lower == upper):
            return None
    return (lower, upper) if (lower <= upper if closed else lower < upper) else None

def crosses(a, b, c, d):
    if max(a[0],b[0]) < min(c[0],d[0]) or min(a[0],b[0]) > max(c[0],d[0]) or max(a[1],b[1]) < min(c[1],d[1]) or min(a[1],b[1]) > max(c[1],d[1]):
        return False
    a, b, c, d = [tuple(map(F, p)) for p in (a, b, c, d)]
    def orient(x, y, p):
        return (y[0]-x[0])*(p[1]-x[1])-(y[1]-x[1])*(p[0]-x[0])
    p, q, r, s = orient(a,b,c), orient(a,b,d), orient(c,d,a), orient(c,d,b)
    if p*q < 0 and r*s < 0:
        return True
    if p == q == 0:
        k = 0 if a[0] != b[0] else 1
        x, y = sorted((a[k],b[k])), sorted((c[k],d[k]))
        return max(x[0],y[0]) < min(x[1],y[1])
    def within(p, x, y):
        return all(min(x[k],y[k]) <= p[k] <= max(x[k],y[k]) for k in range(2))
    return any(sign == 0 and within(p,x,y) and p not in (x,y)
               for sign,p,x,y in ((p,c,a,b),(q,d,a,b),(r,a,c,d),(s,b,c,d)))

class DimensionPresentation:
    def __init__(self, xml, definition, need):
        self.xml, self.d, self.need = xml, definition, need
        metas = xml.findall(S+'metadata')
        need(len(metas) == 1, 'one actual metadata record for dimension layout')
        self.meta = json.loads(metas[0].text)
        self.layout = self.meta.get('dimensionPresentation')
        need(isinstance(self.layout,dict) and set(self.layout) == {'version','role','status','dimensions'} and self.layout['version'] == 1 and self.layout['role'] == 'derived-paper-layout', 'exact separate dimension presentation metadata')
        rows = self.layout['dimensions']
        need(isinstance(rows,list) and len(rows) <= 16, 'bounded complete presentation identity list')
        self.rows = {}
        authored = {a['dimensionId']: a for a in definition['dimensions']}
        for r in rows:
            need(isinstance(r,dict) and set(r) == {'dimensionId','status','reason'} and r['dimensionId'] in authored and r['dimensionId'] not in self.rows, 'unique actual authored dimension layout identity')
            need(r['status'] in ('available','uncertain') and (r['reason'] is None if r['status']=='available' else r['reason'] in REASONS), 'closed reason/status vocabulary, never a source validity claim')
            self.rows[r['dimensionId']] = r
        self.uncertain = sum(r['status']=='uncertain' for r in rows)
        need(self.layout['status'] == ('uncertain' if self.uncertain else 'available'), 'actual complete uncertainty count/status')
        groups = xml.findall(S+'g')
        need(len(groups) == 2, 'sole actual geometry and text groups')
        self.paths = [n for n in groups[0] if 'data-dimension-id' in n.attrib]
        self.texts = [n for n in groups[1] if 'data-dimension-id' in n.attrib]
        need(all(n.get('data-dimension-id') in self.rows for n in self.paths+self.texts), 'no unknown dimension paths or labels')
        need(all(n in self.paths for n in groups[0] if n.get('stroke') in ('#246','#789')), 'no untagged dimension/leader paths outside the independently checked roster')
        need(all(n in self.texts for n in groups[1] if n.get('fill')=='#124' and not n.get('data-annotation-id')), 'no ghost untagged physical dimension text')
        self.checked, self.stroke_boxes = set(), []
        self.main_segments, self.connector_segments, self.reference_segments, self.reference_marks = [], [], [], []

    def base_metadata(self):
        return {k:v for k,v in self.meta.items() if k != 'dimensionPresentation'}

    def footer(self, original):
        routed=sum(n.get('data-dimension-role')=='reference-connector' for n in self.paths)
        return original + (f' · LAYOUT UNCERTAIN ({self.uncertain})' if self.uncertain else '') + (f' · ROUTED REFERENCES ({routed})' if routed else '')

    def common_attributes(self, dimension_id):
        r = self.rows[dimension_id]
        paths = [n for n in self.paths if n.get('data-dimension-id') == dimension_id]
        layouts = {n.get('data-dimension-layout') for n in paths}
        self.need(len(layouts)==1 and layouts <= {'aligned-v1','uncertain-original-v1'}, 'one explicit actual dimension presentation family')
        a = {'data-dimension-id':dimension_id,'data-dimension-layout':next(iter(layouts)), 'data-dimension-layout-status':r['status']}
        if r['reason'] is not None:
            a['data-dimension-layout-reason'] = r['reason']
        return a

    def text_attributes(self, dimension_id):
        return self.common_attributes(dimension_id) | {'fill':'#124'}

    def points(self, node):
        value = node.get('d','')
        self.need(isinstance(value,str) and len(value)<=8192 and re.fullmatch('M'+NUMBER+','+NUMBER+'(?: [ML]'+NUMBER+','+NUMBER+')*',value), 'bounded exact visible ML dimension grammar')
        tokens = re.findall('[ML]|'+NUMBER,value)
        chains=[]
        for k in range(0,len(tokens),3):
            point=tuple(float(v) for v in tokens[k+1:k+3])
            self.need(len(point)==2 and all(math.isfinite(v) and abs(v)<=1e9 for v in point), 'finite represented paper endpoints')
            if tokens[k]=='M': chains.append([])
            self.need(chains, 'move before dimension line');chains[-1].append(point)
        self.need(all(2<=len(c)<=64 for c in chains), 'bounded complete actual dimension subpaths')
        return chains

    def near_point(self,a,b):
        return len(a)==len(b)==2 and all(abs(x-y)<=PAPER for x,y in zip(a,b))

    def _coverage(self, chains, a, b, own):
        length=math.dist(a,b)
        if not length:return not chains
        unit=[(b[k]-a[k])/length for k in range(2)]
        intervals=[]
        for c in chains:
            if len(c)!=2:return False
            positions=[]
            for p in c:
                delta=[p[k]-a[k] for k in range(2)]
                if abs(delta[0]*unit[1]-delta[1]*unit[0])>PAPER:return False
                t=sum(delta[k]*unit[k] for k in range(2))
                if not -PAPER<=t<=length+PAPER:return False
                positions.append(t)
            lo,hi=sorted(positions)
            if hi<=lo:return False
            intervals.append((lo,hi))
        gap=clipped_interval(a,b,own,F(1),True)
        expected=[(0,length)] if gap is None else [(0,float(gap[0])*length),(float(gap[1])*length,length)]
        expected=[(a,b) for a,b in expected if b-a>PAPER]
        actual=sorted(intervals)
        if len(actual)!=len(expected):return False
        return all(abs(a-c)<=PAPER and abs(b-d)<=PAPER for (a,b),(c,d) in zip(actual,expected))

    def verify(self, dimension_id, anchor_candidates, value_text, view_bounds=None):
        need=self.need
        need(dimension_id in self.rows and dimension_id not in self.checked, 'exact once available dimension proof')
        authored=next(a for a in self.d['dimensions'] if a['dimensionId']==dimension_id)
        common=self.common_attributes(dimension_id)
        text=[n for n in self.texts if n.get('data-dimension-id')==dimension_id]
        need(len(text)==1, 'one complete actual physical label per available dimension');text=text[0]
        need(set(text.attrib)==set(common)|{'x','y','fill'} and all(text.get(k)==v for k,v in (common|{'fill':'#124'}).items()) and not list(text) and text.text==value_text, 'unchanged visible physical quantity/label with closed derived attributes')
        label=tuple(float(text.get(k,'nan')) for k in ('x','y'))
        need(label==tuple(authored['label']), 'exact authored label origin, not automatic relocation')
        own=[label[0]-1,label[1]-4,label[0]+len(value_text)*3+1,label[1]+2]
        nodes=[n for n in self.paths if n.get('data-dimension-id')==dimension_id]
        roles={}
        for n in nodes:
            role=n.get('data-dimension-role');roles.setdefault(role,[]).append((n,self.points(n)))
            attrs=common|{'data-dimension-role':role,'stroke':'#789' if role in ('extension-line','reference-anchor','reference-connector','fallback-leader') else '#246'}
            if role in ('extension-line','reference-anchor','reference-connector'):
                anchor=n.get('data-dimension-anchor-index');need(anchor in ('0','1'), 'exact actual endpoint index for every witness/reference')
                attrs['data-dimension-anchor-index']=anchor
            if role in ('extension-line','reference-anchor'):attrs['stroke-width']='.18'
            if role=='reference-connector':attrs['stroke-dasharray']='1 1'
            if common['data-dimension-layout']=='aligned-v1':attrs['stroke-linejoin']='round'
            elif role=='fallback-leader':attrs['stroke-dasharray']='1 1'
            need(n.tag==S+'path' and not list(n) and not(n.text or '').strip() and set(n.attrib)==set(attrs)|{'d'} and all(n.get(k)==v for k,v in attrs.items()), 'exact dimension role/style, no opacity/transforms/hidden marks')
            if common['data-dimension-layout']=='aligned-v1':
                need(len(roles[role][-1][1])==1, 'one connected chain per new dimension path')
                count=len(roles[role][-1][1][0]);need(count==3 if role=='arrowhead' else 2<=count<=64 if role in ('label-connector','reference-connector') else count==2, 'exact finite dimension path arity')
        if common['data-dimension-layout']=='uncertain-original-v1':
            need(self.rows[dimension_id]['status']=='uncertain' and set(roles)=={'reference-span','fallback-leader'} and all(len(v)==1 for v in roles.values()), 'complete original fallback explicitly uncertain')
            span,leaders=roles['reference-span'][0][1],roles['fallback-leader'][0][1]
            need(any(len(span)==1 and len(leaders)==2 and all(self.near_point(x,y) for x,y in zip(span[0],pair)) and all(len(c)==2 and self.near_point(c[0],pair[i]) and self.near_point(c[1],label) for i,c in enumerate(leaders)) for pair in anchor_candidates), 'complete fallback keeps genuine original anchors and rays')
            need(all(a==b for a,b in anchor_candidates), 'ordinary noncollapsed acceptance cases must produce aligned dimensions, not succeed via an uncertain fan fallback')
        else:
            need(set(roles)<= {'dimension-line','extension-line','reference-connector','reference-anchor','arrowhead','label-connector'} and len(roles.get('arrowhead',[]))==2 and len(roles.get('dimension-line',[]))<=2 and len(roles.get('extension-line',[]))<=4 and len(roles.get('reference-connector',[]))<=2 and len(roles.get('reference-anchor',[]))<=4 and len(roles.get('label-connector',[]))<=1, 'complete aligned dimension role roster')
            heads=[c[0] for _,c in roles['arrowhead']]
            need(all(len(c)==3 for c in heads), 'two complete open arrowheads')
            qa,qb=heads[0][1],heads[1][1];matched=[]
            for a,b in anchor_candidates:
                length=math.dist(a,b)
                if not length:continue
                u=[(b[k]-a[k])/length for k in range(2)];n=[-u[1],u[0]]
                offset=sum((qa[k]-a[k])*n[k] for k in range(2));side=-1 if offset<0 else 1
                if abs(offset)<6-PAPER or not self.near_point(qa,[a[k]+n[k]*offset for k in range(2)]) or not self.near_point(qb,[b[k]+n[k]*offset for k in range(2)]):continue
                inward=1 if length>=8 else -1
                expected_heads=[]
                for tip,direction in ((qa,inward),(qb,-inward)):
                    expected_heads.append([[tip[k]+u[k]*direction*2+n[k]*.65 for k in range(2)],list(tip),[tip[k]+u[k]*direction*2-n[k]*.65 for k in range(2)]])
                if not all(self.near_point(x,y) for actual,want in zip(heads,expected_heads) for x,y in zip(actual,want)):continue
                main=[c[0] for _,c in roles.get('dimension-line',[])]
                if not self._coverage(main,qa,qb,own):continue
                valid=True
                for index,anchor,tip in ((0,a,qa),(1,b,qb)):
                    belongs=lambda node:node.get('data-dimension-anchor-index')==str(index)
                    extensions=[c[0] for node,c in roles.get('extension-line',[]) if belongs(node)]
                    refs=[c[0] for node,c in roles.get('reference-connector',[]) if belongs(node)]
                    marks=[c[0] for node,c in roles.get('reference-anchor',[]) if belongs(node)]
                    if refs:
                        expected_marks=[[[anchor[0]-.6,anchor[1]],[anchor[0]+.6,anchor[1]]],[[anchor[0],anchor[1]-.6],[anchor[0],anchor[1]+.6]]]
                        valid=valid and not extensions and len(refs)==1 and len(marks)==2 and self.near_point(refs[0][0],anchor) and self.near_point(refs[0][-1],tip) and all(self.near_point(x,y) for actual,want in zip(marks,expected_marks) for x,y in zip(actual,want))
                    else:
                        valid=valid and not marks and 1<=len(extensions)<=2 and self._coverage(extensions,[anchor[k]+n[k]*side*1.5 for k in range(2)],[tip[k]+n[k]*side*1.5 for k in range(2)],own)
                if valid:matched.append((qa,qb,u,length))
            need(len(matched)==1, 'actual complete aligned span/extensions/arrows match one independently source-bound anchor pair')
            qa,qb,u,length=matched[0]
            connectors=roles.get('label-connector',[])
            # A remote actual label needs a real visible association. This
            # is an endpoint/box inequality, never a replay of the route.
            if clipped_interval(qa,qb,own,closed=True) is None:
                need(len(connectors)==1, 'disconnected finite dimension span requires its actual label connector')
            for _,chains in roles.get('reference-connector',[]):
                points=chains[0];need(all(x!=y for x,y in zip(points,points[1:])), 'no collapsed routed reference segments')
                need(not any(crosses(x,y,c[0],c[1]) for x,y in zip(points,points[1:]) for _,cc in roles.get('dimension-line',[]) for c in cc), 'routed reference meets its own finite dimension line only at the true endpoint')
                self.reference_segments.extend((dimension_id,x,y) for x,y in zip(points,points[1:]))
            self.reference_marks.extend((dimension_id,*c[0]) for _,c in roles.get('reference-anchor',[]))
            if connectors:
                connector=connectors[0][1];need(len(connector)==1, 'one connected visible label leader');points=connector[0]
                delta=[points[0][k]-qa[k] for k in range(2)]
                need(abs(delta[0]*u[1]-delta[1]*u[0])<=PAPER and -PAPER<=sum(delta[k]*u[k] for k in range(2))<=length+PAPER, 'connector starts on this actual dimension span')
                def on_visible_segment(x,a,b):
                    distance=math.dist(a,b)
                    if not distance:return self.near_point(x,a)
                    direction=[(b[k]-a[k])/distance for k in range(2)];v=[x[k]-a[k] for k in range(2)]
                    return abs(v[0]*direction[1]-v[1]*direction[0])<=PAPER and -PAPER<=sum(v[k]*direction[k] for k in range(2))<=distance+PAPER
                need(self.near_point(points[0],qa) or self.near_point(points[0],qb) or any(on_visible_segment(points[0],c[0],c[1]) for _,cc in roles.get('dimension-line',[]) for c in cc), 'label connector actually touches emitted finite span ink or a complete arrow tip')
                ports=[(own[0],(own[1]+own[3])/2),(own[2],(own[1]+own[3])/2),((own[0]+own[2])/2,own[1]),((own[0]+own[2])/2,own[3])]
                valid_sides=[i for i,p in enumerate(ports) if self.near_point(points[-1],p)]
                need(any((points[-2][0]<own[0],points[-2][0]>own[2],points[-2][1]<own[1],points[-2][1]>own[3])[i] for i in valid_sides), 'connector ends at a physical port from its strict exterior side')
                for x,y in zip(points,points[1:]):need(x!=y, 'no duplicate/zero connector segment')
                for x,y in zip(points[:-2],points[1:-1]):need(clipped_interval(x,y,own,closed=True) is None, 'connector prefix avoids its own complete label')
                self.connector_segments.extend((dimension_id,a,b) for a,b in zip(points,points[1:]))
            self.main_segments.extend((dimension_id,*c[0]) for _,c in roles.get('dimension-line',[]))
            for role,records in roles.items():
                for _,chains in records:
                    for chain in chains:
                        need(all(F(1,8)<=F(p[0])<=F(self.d['sheet']['width'])-F(1,8) and F(129,8)<=F(p[1])<=F(self.d['sheet']['height'])-F(129,8) for p in chain), 'whole new dimension stroke in sheet with declared16mm title/footer bands')
                        if role=='label-connector':
                            # A label connector deliberately touches the outer
                            # declared box port; its strict exterior final
                            # approach above may contact that boundary only.
                            need(all(clipped_interval(a,b,own) is None for a,b in zip(chain,chain[1:])), 'connector never enters its own declared text interior')
                        else:
                            need(all(clipped_interval(a,b,own,F(1,8)) is None for a,b in zip(chain,chain[1:])), 'every actual new span/extension/arrow clears its own text ink box')
        for _,chains in sum(roles.values(),[]):
            for chain in chains:
                self.stroke_boxes.extend(box([a,b]) for a,b in zip(chain,chain[1:]))
        self.checked.add(dimension_id)

    def finish(self, view_bounds):
        need=self.need
        need(self.checked==set(self.rows), 'every emitted dimension is independently proved, no omitted or extra physical labels')
        need(len(self.texts)==len(self.rows) and len(self.stroke_boxes)<=256, 'bounded complete actual dimension output')
        labels=[]
        for n in self.xml.findall('.//'+S+'text'):
            if n.get('fill')=='#124' and not n.get('data-requirement-text') and not list(n):
                x,y=float(n.get('x')),float(n.get('y'));labels.append((n.get('data-dimension-id'),[x-1,y-4,x+len(n.text or '')*3+1,y+2]))
            elif n.get('data-view-caption-id'):
                x,y,L=(float(n.get(k)) for k in ('x','y','textLength'));labels.append((None,[x-1,y-4,x+L+1,y+2]))
        for n in self.xml.findall(S+'g')[0]:
            if n.get('data-presentation')=='requirement-frame':
                chains=self.points(n);labels.append((None,box([p for c in chains for p in c])))
        geometry=[];legacy_leaders=[]
        for n in self.xml.findall(S+'g')[0]:
            if n.get('data-dimension-id') is not None:continue
            if n.get('stroke')=='#357' and (n.get('stroke-dasharray')=='1 1' or n.get('data-presentation')=='requirement-leader'):
                for chain in self.points(n):legacy_leaders.extend(zip(chain,chain[1:]))
            # Filled section and long conic paths are checked by each family;
            # the exact independent envelope separately covers their interiors.
            if (n.get('data-view-id') or n.get('stroke') in (None,'#777')) and not n.get('fill') and not n.get('data-annotation-id'):
                raw=n.get('d','')
                if 'Z' not in raw and len(raw)<=16*1024*1024:
                    tokens=re.findall('[ML]|'+NUMBER,raw);previous=None
                    for k in range(0,len(tokens),3):
                        p=tuple(float(v) for v in tokens[k+1:k+3])
                        if tokens[k]=='L' and previous is not None:geometry.append((previous,p))
                        previous=p
        for dimension_id,row in self.rows.items():
            node=next(n for n in self.texts if n.get('data-dimension-id')==dimension_id);x,y=float(node.get('x')),float(node.get('y'));own=[x-1,y-4,x+len(node.text or '')*3+1,y+2]
            outside=own[0]<.125 or own[1]<.125 or own[2]>self.d['sheet']['width']-.125 or own[3]>self.d['sheet']['height']-.125
            conflict=any(other_id!=dimension_id and overlap(own,b) for other_id,b in labels)
            geometry_conflict=any(clipped_interval(a,b,own,F(1,8)) is not None for a,b in geometry)
            envelope=any(b is not None and overlap(own,b) for b in view_bounds)
            reserved=own[1]<16 or own[3]>self.d['sheet']['height']-16
            witnesses={'RESERVED_SHEET_BAND_CONFLICT':reserved,'DECLARED_TEXT_OUTSIDE_SHEET':outside,'DECLARED_TEXT_BOX_CONFLICT':conflict,'DECLARED_TEXT_GEOMETRY_CONFLICT':geometry_conflict,'VIEW_ENVELOPE_UNCERTAINTY':envelope}
            if row['status']=='available':need(not(outside or reserved or conflict or geometry_conflict or envelope), 'available layout is independently clear of every declared label/view obstacle')
            elif row['reason'] in witnesses:need(witnesses[row['reason']], 'uncertainty has an independent actual declared-domain witness, not a trusted status flag')
            if self.common_attributes(dimension_id)['data-dimension-layout']=='aligned-v1':
                for n in self.paths:
                    if n.get('data-dimension-id')!=dimension_id:continue
                    for chain in self.points(n):
                        for a,b in zip(chain,chain[1:]):need(all(other_id==dimension_id or clipped_interval(a,b,rect,F(1,8)) is None for other_id,rect in labels), 'every actual new line/arrow/connector clears all other declared text/form/caption boxes')
        need(not any(aid!=bid and crosses(a,b,c,d) for i,(aid,a,b) in enumerate(self.main_segments) for bid,c,d in self.main_segments[i+1:]+self.connector_segments+self.reference_segments+self.reference_marks), 'no actual cross-dimension line/connector crossing')
        need(not any(crosses(a,b,c,d) for i,(_,a,b) in enumerate(self.connector_segments+self.reference_segments) for _,c,d in (self.connector_segments+self.reference_segments)[i+1:]), 'actual label/reference connectors do not self-cross or cross one another')
        need(not any(crosses(a,b,c,d) for _,a,b in self.main_segments for c,d in geometry), 'dimension lines clear actual projected geometry without an AABB being geometry authority')
        need(not any(crosses(a,b,c,d) for _,a,b in self.main_segments+self.connector_segments+self.reference_segments for c,d in legacy_leaders), 'new dimension lines/connectors clear actual pre-existing bore/ordinate/requirement leaders')
        footer=self.footer('Reference drawing · '+self.meta['status']+' · scale '+str(self.d['sheet']['scale']['numerator'])+':'+str(self.d['sheet']['scale']['denominator']))
        notices=[n for n in self.xml.findall('.//'+S+'text') if n.text==footer and n.attrib=={'x':'8','y':str(self.d['sheet']['height']-5)} and not list(n)]
        need(len(notices)==1,'one exact visible reference/layout-uncertainty footer, no hidden diagnostic substitution')
        return {'paths':{id(n) for n in self.paths},'texts':{id(n) for n in self.texts},'strokeBoxes':self.stroke_boxes,'uncertain':self.uncertain,'dimensions':len(self.checked)}

def from_observation(xml,definition,observation,need,view_bounds):
    proof=DimensionPresentation(xml,definition,need)
    frames={r['viewId']:r['frame'] for r in observation['viewFrames']}
    for authored,fact in zip(definition['dimensions'],observation['dimensions']):
        view=next(v for v in definition['views'] if v['viewId']==authored['viewId']);frame=frames[view['viewId']]
        if fact['status']!='available' or frame is None:continue
        scale=view['scale']['numerator']/view['scale']['denominator'] if view['basis']=='detail' else definition['sheet']['scale']['numerator']/definition['sheet']['scale']['denominator']
        def project(p):
            delta=[p[k]-frame['origin'][k] for k in range(3)]
            return [view['paperOrigin'][0]+scale*sum(delta[k]*frame['u'][k] for k in range(3)),view['paperOrigin'][1]-scale*sum(delta[k]*frame['v'][k] for k in range(3))]
        prefix='Ø' if authored['kind']=='hole-diameter' else 'L ' if authored['kind']=='edge-length' else 'ΔZ ' if authored['kind']=='plane-distance' else 'ΔX ' if authored['axis']=='datum-x' else 'ΔY '
        proof.verify(authored['dimensionId'],[[project(p) for p in fact['anchors']]],prefix+format(fact['value'],'.3f')+' mm')
    return proof,proof.finish(view_bounds)
