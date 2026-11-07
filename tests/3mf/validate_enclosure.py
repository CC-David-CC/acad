import sys
import lib3mf
w=lib3mf.get_wrapper();m=w.CreateModel();r=m.QueryReader('3mf');r.SetStrictModeActive(True);r.ReadFromFile(sys.argv[1]);assert r.GetWarningCount()==0
assert m.GetBuildItems().Count()==2
it=m.GetMeshObjects();assert it.Count()==3;names=[]
while it.MoveNext():
 o=it.GetCurrentMeshObject();names.append(o.GetName());assert o.IsValid() and o.IsManifoldAndOriented()
 if o.GetName()=='body-region':
  verts=o.GetVertices(); assert max(p.Coordinates[0] for p in verts)==float(sys.argv[2] if len(sys.argv)>2 else 40)
assert set(names)=={'body-region','lid-region','label-region'}
it=m.GetComponentsObjects();seen=False
while it.MoveNext():
 o=it.GetCurrentComponentsObject()
 if o.GetName()=='Lid with inset label':assert o.GetComponentCount()==2;seen=True
assert seen
print('lib3mf strict: enclosure + separate lid with two grouped materials')
