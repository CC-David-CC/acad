// Build only disposable, deliberately corrupted workers for negative controls.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const [out,...inputs]=process.argv.slice(2);if(!out||inputs.length!==4)throw Error('usage: node prepare-contact-fixture.cjs EMPTY_OUTPUT OCI_JS OCI_WASM MANIFOLD_JS MANIFOLD_WASM');
execFileSync(process.execPath,[path.join(__dirname,'prepare-fixture.cjs'),out,...inputs],{stdio:'inherit'});
const dir=path.join(out,'static'),needle='if(label){shapes.set(msg.labelToken,label);';
for(const engine of ['occ','manifold']){
 const source=fs.readFileSync(path.join(dir,engine==='occ'?'worker.js':'manifold-worker.js'),'utf8');
 if(source.split(needle).length!==2)throw Error('missing exact label fault marker');
 const injection=engine==='occ'?"if(label){call('box',[baseLid,'-min',plan.label.box.origin[0],plan.label.box.origin[1],plan.label.box.origin[2]+5,'-size',...plan.label.box.dimensions,'-dir',0,0,1,'-xdir',1,0,0]);label=baseLid;shapes.set(msg.labelToken,label);":"if(label){const displaced=label.translate([0,0,5]);release(label);label=displaced;shapes.set(msg.labelToken,label);";
 fs.writeFileSync(path.join(dir,engine+'-displaced-label.js'),source.replace(needle,injection),{flag:'wx'});
 const response='commonVolume:body.group.interfaceEvidence.commonVolume,...evidence';
 if(source.split(response).length!==2)throw Error('missing exact interface fault marker');
 fs.writeFileSync(path.join(dir,engine+'-bad-interface.js'),source.replace(response,response+',minSharedAreaMm2:-1'),{flag:'wx'});
}
