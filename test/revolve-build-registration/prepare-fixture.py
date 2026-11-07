"""Pin emitted public code assets for a private real-factory component test."""
import pathlib, hashlib, json, shutil, sys
root=pathlib.Path(__file__).resolve().parents[2];dist=root/'.build/revolve-catalog-factory'
shutil.copyfile(root/'test/revolve-build-registration/factory-adapter.mjs',dist/'factory-adapter.mjs')
(dist/'engine-test.html').write_text('<!doctype html><title>Private native factory qualification</title>\n')
files={str(p.relative_to(dist)):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(dist.rglob('*')) if p.is_file()}
names=['modules/engine/mount/engineCatalog.mjs','modules/engine/mount/catalogMount.ts','modules/engine/mount/oci-verified-worker.js','modules/engine/mount/worker-controller.mjs','build/prepare-revolve-assets.cjs','build/prepare-revolve-profile-assets.cjs','build/revolve-profile-assets-entry.cjs','webpack.config.js','package.json']
receipt={'scope':'Private actual catalog factory, emitted asset closure; not ordinary app or signed history qualification','files':files,'sourceSHA256':{n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in names},'assetCount':len(files),'assetBytes':sum(v['bytes']for v in files.values()),'revolveAssetBytes':sum(v['bytes']for n,v in files.items()if n.startswith('revolve-profile/')),'configuredAppBundleCeilingBytes':320*1024*1024,'revolveComponent':json.loads((root/'.build/revolve-profile-assets/component.json').read_text())}
pathlib.Path(sys.argv[1]).write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({k:receipt[k] for k in ['assetCount','assetBytes','revolveAssetBytes','configuredAppBundleCeilingBytes']}))
