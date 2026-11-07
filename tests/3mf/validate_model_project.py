import sys
import lib3mf
w=lib3mf.get_wrapper();m=w.CreateModel();r=m.QueryReader('3mf');r.SetStrictModeActive(True);r.ReadFromFile(sys.argv[1]);assert r.GetWarningCount()==0
assert m.GetBuildItems().Count()==(1 if sys.argv[2]=='grouped' else 2)
it=m.GetMeshObjects();assert it.Count()==2
names=[]
while it.MoveNext():
 o=it.GetCurrentMeshObject();names.append(o.GetName());assert o.IsValid() and o.IsManifoldAndOriented();assert o.GetTriangleCount()==12
assert set(names)=={'lid-region','label-region'}
g=m.GetBaseMaterialGroups();assert g.Count()==1;g.MoveNext();mg=g.GetCurrentBaseMaterialGroup()
assert {mg.GetName(i) for i in mg.GetAllPropertyIDs()}=={'PLA','PETG'}
colors={}
for i in mg.GetAllPropertyIDs():
 c=mg.GetDisplayColor(i);colors[mg.GetName(i)]=(c.Red,c.Green,c.Blue,c.Alpha)
assert colors=={'PLA':(255,0,0,255),'PETG':(0,0,255,255)}
c=m.GetComponentsObjects();names=[]
while c.MoveNext():
 o=c.GetCurrentComponentsObject();names.append(o.GetName())
 if o.GetName()=='label-region': assert list(o.GetComponent(0).GetTransform().Fields[3])==[10,0,0]
 if o.GetName()=='Lid and label': assert o.GetComponentCount()==2
assert 'Lid and label' in names if sys.argv[2]=='grouped' else ('Lid' in names and 'Label' in names)
print('lib3mf: real project two boxes, material assignments and',sys.argv[2])
