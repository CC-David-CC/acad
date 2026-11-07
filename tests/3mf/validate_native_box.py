import sys
import lib3mf
w=lib3mf.get_wrapper();m=w.CreateModel();r=m.QueryReader('3mf');r.SetStrictModeActive(True);r.ReadFromFile(sys.argv[1]);assert r.GetWarningCount()==0
it=m.GetMeshObjects();assert it.Count()==1;it.MoveNext();obj=it.GetCurrentMeshObject()
assert obj.GetName()=='Box' and obj.IsManifoldAndOriented() and obj.IsValid()
assert obj.GetVertexCount()==8 and obj.GetTriangleCount()==12
resource,prop,valid=obj.GetObjectLevelProperty(); assert valid
groups=m.GetBaseMaterialGroups(); assert groups.Count()==1;groups.MoveNext();group=groups.GetCurrentBaseMaterialGroup()
assert resource==group.GetResourceID() and group.GetName(prop)=='PLA'
color=group.GetDisplayColor(prop);assert (color.Red,color.Green,color.Blue,color.Alpha)==(0,255,0,255)
v=obj.GetVertices(); assert [min(p.Coordinates[i] for p in v) for i in range(3)]==[1,2,3]
assert [max(p.Coordinates[i] for p in v) for i in range(3)]==[11,22,33]
it=m.GetComponentsObjects();transforms=[]
while it.MoveNext():
 c=it.GetCurrentComponentsObject()
 if c.GetName()=='Box' and c.GetComponent(0).HasTransform(): transforms.append([list(row) for row in c.GetComponent(0).GetTransform().Fields])
assert [[[0,1,0],[-1,0,0],[0,0,1],[5,6,7]]] == transforms
print('lib3mf: native box bounds, material mesh and rotation/translation preserved')
