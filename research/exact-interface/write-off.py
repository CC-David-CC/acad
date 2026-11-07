"""Create exact-input research OFF files from the captured native CAD fixture."""
import json
from pathlib import Path
m=json.loads(Path('fixtures/native-enclosure-meshes.json').read_text())
def off(name,data,fn):
 v=data['mesh']['verts'];t=data['mesh']['tris'];lines=['OFF',f'{len(v)//3} {len(t)//3} 0']
 for i in range(0,len(v),3):lines.append(' '.join(format(x,'.17g') for x in fn(*v[i:i+3])))
 for i in range(0,len(t),3):lines.append(f'3 {t[i]} {t[i+1]} {t[i+2]}')
 Path(name).write_text('\n'.join(lines)+'\n')
lid=next(x for x in m if x['id']=='native:6');label=next(x for x in m if x['id']=='native:7')
off('lid.off',lid,lambda x,y,z:(x,y,z))
off('label.off',label,lambda x,y,z:(x,y,z))
off('overlap.off',label,lambda x,y,z:(x,y,z-1e-6))
off('apart.off',label,lambda x,y,z:(x+100,y,z))
off('contained.off',label,lambda x,y,z:(1+(x-10)*0.1,1+(y-10)*0.1,12.25+(z-13)*0.1))
