import sys
import lib3mf
w=lib3mf.get_wrapper();m=w.CreateModel();r=m.QueryReader('3mf');r.SetStrictModeActive(True);r.ReadFromFile(sys.argv[1]);assert r.GetWarningCount()==0
i=m.GetMeshObjects();assert i.Count()==1;i.MoveNext();mesh=i.GetCurrentMeshObject()
assert mesh.GetVertexCount()==8 and mesh.GetTriangleCount()==12 and mesh.IsValid() and mesh.IsManifoldAndOriented()
v=mesh.GetVertices();assert [min(p.Coordinates[k] for p in v) for k in range(3)]==[0,0,0]
assert [max(p.Coordinates[k] for p in v) for k in range(3)]==[10,20,30]
print('lib3mf strict reader: real OCC box, exact indexed closed mesh')
