import hashlib,json,sys
from pathlib import Path
original=Path(sys.argv[1]); candidate=Path(sys.argv[2]); output=Path(sys.argv[3]);
def digest(b):return hashlib.sha256(b).hexdigest()
a=original.read_bytes();b=candidate.read_bytes();count=abs(len(a)-len(b));first=[]
for i,(x,y) in enumerate(zip(a,b)):
 if x!=y:
  count+=1
  if len(first)<64:first.append({'offset':i,'published':x,'candidate':y})
result={'published_sha256':digest(a),'candidate_sha256':digest(b),'published_size':len(a),'candidate_size':len(b),'changed_positions_count':count,'changed_positions_first_64':first}
output.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
