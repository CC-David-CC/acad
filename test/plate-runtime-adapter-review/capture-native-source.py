"""Read tracked native Git objects only; no native operation or build."""
import hashlib,json,pathlib,subprocess,sys
root=pathlib.Path(sys.argv[1]);git=lambda *a:subprocess.check_output(['git','-C',str(root),*a])
assert not git('status','--porcelain'),'native source not clean'
paths={'occt/src/CommandInterpreter/DBRep.hxx':(35,45),'occt/src/CommandInterpreter/DBRep.cxx':(784,790),'shape-io/main.cpp':(133,173),'shape-io/ownedTopologyV1.hpp':(95,101),'shape-io/ownedEdgeTreatmentV1.hpp':(55,75),'shape-io/selectedProfileV2.hpp':(32,60),'shape-io/profilePrismProvenanceV1.hpp':None}
sources={}
for p,lines in paths.items():
 b=git('show','HEAD:'+p);v={'sha256':hashlib.sha256(b).hexdigest()}
 if lines:v.update(firstLine=lines[0],excerpt='\n'.join(b.decode().splitlines()[lines[0]-1:lines[1]]))
 sources[p]=v
print(json.dumps({'status':'READ_ONLY_SOURCE_OBSERVED','scope':'Tracked source; not proof/replay of frozen C++ build','root':str(root),'commit':git('rev-parse','HEAD').decode().strip(),'clean':True,'sources':sources},indent=2))
