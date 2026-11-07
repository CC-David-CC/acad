import sys
import lib3mf
w=lib3mf.get_wrapper();m=w.CreateModel();r=m.QueryReader('3mf');r.SetStrictModeActive(True);r.ReadFromFile(sys.argv[1])
assert r.GetWarningCount()==0
it=m.GetMeshObjects();assert it.Count()==1;it.MoveNext();mesh=it.GetCurrentMeshObject()
assert mesh.GetVertexCount()==32 and mesh.GetTriangleCount()==48
assert mesh.IsValid() and mesh.IsManifoldAndOriented()
print('lib3mf strict reader: nested box cavity, island and disconnected solid')
