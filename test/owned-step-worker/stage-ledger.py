"""Stage only a source-pinned optional ESM graph for the genuine ledger probe.
The original component files/manifest are never modified or relabeled.
"""
import pathlib,re,sys,json,hashlib
root=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(sys.argv[1]).resolve()/"ledger";out.mkdir()
pending=[root/"modules/engine/solid/solidLedger.mjs",root/"modules/engine/mount/engineCatalog.mjs",root/"web/app/cad/craft/evaluationResources.mjs"];files={}
while pending:
 p=pending.pop().resolve();n=str(p.relative_to(root))
 if n in files:continue
 b=p.read_bytes();s=b.decode();files[n]={"sha256":hashlib.sha256(b).hexdigest(),"bytes":len(b)};d=out/n;d.parent.mkdir(parents=True,exist_ok=True);d.write_bytes(b)
 for spec in re.findall(r"(?:from\s*|import\s*)['\"](\.[^'\"]+)['\"]",s):pending.append((p.parent/spec).resolve())
(out/"manifest.json").write_text(json.dumps({"scope":"optional exact ledger source graph; not the native component manifest","files":files},indent=2)+"\n")
