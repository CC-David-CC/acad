"""Independent strict reader: pip install lib3mf==2.5.0 in an isolated venv."""
import sys
import lib3mf
w=lib3mf.get_wrapper()
m=w.CreateModel()
r=m.QueryReader('3mf')
r.SetStrictModeActive(True)
r.ReadFromFile(sys.argv[1])
assert r.GetWarningCount()==0, [r.GetWarning(i) for i in range(r.GetWarningCount())]
assert m.GetUnit()==lib3mf.ModelUnit.MilliMeter
meta=m.GetMetaDataGroup()
assert any(meta.GetMetaData(i).GetName()=='SourceRevision' and meta.GetMetaData(i).GetValue()=='rev <42> & draft' for i in range(meta.GetMetaDataCount()))
mi=m.GetMeshObjects(); assert mi.Count()==2
names=[]
while mi.MoveNext():
 obj=mi.GetCurrentMeshObject(); names.append(obj.GetName())
 assert obj.GetVertexCount()==4 and obj.GetTriangleCount()==4
 assert obj.IsValid() and obj.IsManifoldAndOriented()
 resource, prop, valid = obj.GetObjectLevelProperty()
 assert valid and resource==1 and prop=={'left':1,'right':2}[obj.GetName()]
assert names==['left','right']
groups=m.GetBaseMaterialGroups(); assert groups.Count()==1; groups.MoveNext()
group=groups.GetCurrentBaseMaterialGroup(); assert group.GetCount()==2
pids=group.GetAllPropertyIDs()
assert [group.GetName(i) for i in pids]==['Red & opaque','Blue']
colors=[group.GetDisplayColor(i) for i in pids]
assert [(c.Red,c.Green,c.Blue,c.Alpha) for c in colors]==[(255,0,0,255),(0,0,255,255)]
components=m.GetComponentsObjects(); assert components.Count()==(3 if len(sys.argv)>2 else 4)
transforms={}
while components.MoveNext():
 obj=components.GetCurrentComponentsObject()
 if obj.GetName() in ('left','right'):
  assert obj.GetComponentCount()==1
  transforms[obj.GetName()]=[list(row) for row in obj.GetComponent(0).GetTransform().Fields]
 elif obj.GetName()=='Lid with label':
  assert obj.GetComponentCount()==2
  assert [obj.GetComponent(i).GetObjectResource().GetName() for i in range(2)]==['left','right']
assert transforms['left'][3]==[0,0,0] and transforms['right'][3]==[5,6,7]
build=m.GetBuildItems(); assert build.Count()==(1 if len(sys.argv)>2 else 2)
print('lib3mf strict reader: two valid oriented meshes, materials, components and build items')
