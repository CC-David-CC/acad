# Independent source review of root registration b8776ad

Reviewed commit `b8776ad974bbf60cc57c2ebe913f041ba07f271f` read-only. No product edits, test, TSC, build, Native call, probe or browser execution was performed. These are source-confirmed integration omissions, not observed runtime failures. Root owns the repair/composed build and whole qualification.

## Findings requiring source repair

1. **Circular staged resources lack their webpack asset/resource rule.** `webpack.config.js:67` resolves the generated circular entry, and `build/circular-assets-entry.cjs:11` imports the staged Worker/glue/WASM plus verbatim `.mjs` graph. However the resource rules at `webpack.config.js:163–172` cover Shell and STEP and have no corresponding `.build/circular-assets` rule anywhere. The generated entry expects URL default exports preserving paths, while its imported files are otherwise handled as JS/modules or unsupported binary. In particular no `circular/modules/engine/mount/circular-worker.js` resource URL/colocation contract is established. Add the exact sibling rule (no broader include/allowlist):

   ```js
   {include:[path.join(__dirname,'.build/circular-assets')],type:'asset/resource',generator:{filename:data=>{
     const relative=path.relative(path.join(__dirname,'.build/circular-assets'),path.resolve(__dirname,data.filename));
     if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected circular asset path');
     return 'circular/'+relative.split(path.sep).join('/');
   }}},
   ```

   This matches `loftMountOptions(circularAssets,'circular',circularModules)` and the Worker’s relative dynamic imports. Preserve old rules exactly.

2. **The new catalog asset import has no ambient declaration.** `modules/engine/mount/catalogMount.ts:2` imports `codi-circular-assets`. `modules/engine/extrusion/worker-assets.d.ts:50` ends at the existing Shell declaration, and neither this file nor `externals.d.ts` declares the new alias or a wildcard that covers it. TypeScript paths do not map webpack aliases. Add a narrow declaration alongside Shell, including the actual small capability fields because `requireAvailableShellBuild` accesses `circularAssets.circularArrangementVersion`:

   ```ts
   declare module 'codi-circular-assets' {
     const assets:null|{circularArrangementVersion:1;selectedRegionArrangementVersion:1;worker:string;js:string;wasm:string;modules:Record<string,string>};
     export default assets;
   }
   ```

   No typecheck was run; the finding is the missing source declaration and mapping, not a claimed captured compiler failure.

## Reviewed source paths without another confirmed finding

- Exact portable pair `f262510bd8f65fc518e6e5ea146004ad357d6d35f80bf0fd5c8eec2de984c504` / `186b13d47f5afee372dddc4aa843275d3d3bd593a764cd85d070014fac87e382` agrees between literal module, new catalog singleton, factory and stagers. The matcher is pure exact equality. Native183ab32/source820 identity is recorded, without functional qualification inferred.
- The catalog's new singleton is explicit and experimental. Existing default/preferred/saved revisions remain. It declares selectedProfileVersion3 for retained profiles and a distinct circularArrangementVersion1/version4 descriptor. Descriptor validation requires the exact v4 schema and rejects v4/circular advertisement by old cohorts; inherited V3/selection-plan-v2, Boolean, hole/pattern, edge, revolve, sweep, loft, checked metrology, STEP, orthographic/drawing, mesh, Shell/box and planar-attachment bindings remain checked.
- New factory supplies the reviewed request/certificate captures, exact matcher and finite Native error array privately. Controller admits the new pair only with explicit circular mode and required inherited flags. OCI loads new circular modules only in that mode, verifies the exact pair before Native fetch, checks both actual exports after initialization, and retains its original old-pair branches when the mode is absent. Version4 request dispatch remains distinct from V2/V3. No caller JSON function or generic validation bypass was introduced.
- Optional build with absent CODI_CIRCULAR_NATIVE_DIR writes a null entry and reads no circular Native bytes. Configured input verifies exact bytes before staging, compares a fresh source/native stage rather than trusting a stale editable manifest, and verifies prior staged bytes. This follows the existing optional cohort pattern.
- The new entry's explicit resource list and catalog `loftMountOptions` required list cover inherited Shell resources plus exactly the seven circular leaves. Their static transitive imports stay within the listed Native module graph; constructor/controller staging records remain host-side rather than falsely emitted as Worker resources. The shared closure checker was not weakened. The new stage flag only adds the marker for this explicit prefix; old emitted flag schema stays unchanged.
- All explicit common OCI bootstrap guards in this source use `44ad4cff5b13e3585e8a00a0c16c61f3be212d0f3dced71de6ed2287ae530214`: embedded legacy OCI; selected V2; loft; adaptive; STEP; orthographic; manufacturing; Shell; circular. Existing Native byte pairs retain their original literals. The new Worker source's dynamic circular branch does not add a static import to old Worker dependency graphs.
- Staged discovery reaches the new build through Shell→Loft inherited availability, then existing selected profile, point, STEP, manufacturing, revolve/sweep and box guards. Require paths retain exact catalog-singleton checks and staged colocation. An unconfigured optional cohort is not advertised. Same-part revision and existing budgets remain exact; Read creates no persistent-name charge.
- The source-only driver/oracle remain unexecuted. Near-boundary source relations are deliberately not tiny-cell Native qualification. No claims about real Native success, cleanup, actual emitted webpack output, browser import availability or whole application behavior follow from this review.

## Whole R1 source/manifest follow-up — Core9189366

Root's first real whole run failed at initial capture after genuine two-Circle source creation with `Loft Worker module graph is not colocated`. Root preserved that failure. Read-only comparison of Core9189366 source, actual generated R730 `.build/circular-entry.mjs` and the supplied pins-r3 manifest confirms the root diagnosis:

- The catalog's base `loftMountOptions` modules plus inherited Shell/circular extras require exactly **50 unique .mjs resources**. The circular entry advertises exactly the same **50**, with no missing, extra or duplicate module names. Actual generated entry binds them p3 through p52; Worker/glue/WASM are p0/p1/p2. No source module list or closure allowlist change is warranted.
- Its exact asset/resource rule now correctly emits the circular subtree. However `webpack.config.js`'s later generic `/\.wasm$/` file-loader exclusion roster includes Shell and all earlier native cohorts but omits `.build/circular-assets`. Both rules therefore apply to the new WASM; the generic loader changes the expected colocation contract.
- The actual pins manifest contains **52 circular paths** (50 modules plus Worker/glue) and **no** `static/circular/circular-occ.wasm`. The generated entry nevertheless expects p2 at the circular WASM slot. This matches the precise catalog guard branch `assetPath(assets.wasm)!==base+'circular-occ.wasm'`; it is not evidence of an incorrect Native pair or missing source module.

Precise repair: append only `path.join(__dirname,'.build/circular-assets')` to the existing generic WASM file-loader `exclude` array. Preserve its other exclusions and loader behavior, circular resource rule, all exact lists and Native pins. Root owns that patch and coherent rebuild/whole run.

My initial source review identified the missing circular resource rule but did not also identify the sibling generic-WASM exclusion. This follow-up corrects that review scope; no altered expected paths, weak colocation guard or blanket runtime pass is proposed. No tests, TSC, builds, Native calls or browser execution were performed during this follow-up; only existing source/manifest/generated-entry text was read and compared.
