declare module 'codi-prism-semantic-worker' { const url:string; export default url; }
declare module 'codi-polygon-profile-assets' { const assets:{worker:string;js:string;wasm:string;modules:Record<string,string>}; export default assets; }
declare module 'codi-mechanical-profile-assets' { const assets:{worker:string;js:string;wasm:string;modules:Record<string,string>}; export default assets; }
declare module 'codi-oci-verified-worker' { const url:string; export default url; }
declare module 'codi-occ-portable' { const url:string; export default url; }
declare module 'codi-occ-wasm' { const url:string; export default url; }
declare module 'codi-prism-topology-module' { const url:string; export default url; }
declare module 'codi-prism-profile-module' { const url:string; export default url; }
declare module 'codi-prism-regions-module' { const url:string; export default url; }
declare module 'codi-prism-plan-module' { const url:string; export default url; }
declare module 'codi-hole-plan-module' { const url:string; export default url; }
declare module 'codi-hole-topology-module' { const url:string; export default url; }

declare module 'codi-prism-boundary-module' { const url:string; export default url; }

declare module 'codi-four-corner-plan-module' { const url:string; export default url; }
declare module 'codi-four-corner-topology-module' { const url:string; export default url; }
declare module 'codi-four-corner-provenance-module' { const url:string; export default url; }

declare module 'codi-manifold-worker' { const url:string; export default url; }
declare module 'codi-manifold-worker-wasm' { const url:string; export default url; }
declare module 'codi-smlib-worker' { const url:string; export default url; }
declare module 'codi-smlib-wasm' { const url:string; export default url; }
declare module 'codi-enclosure-plan-module' { const url:string; export default url; }
declare module 'codi-enclosure-mesh-module' { const url:string; export default url; }

declare module 'codi-manufacturing-hash-worker' { const url:string; export default url; }
declare module 'codi-manufacturing-publication-worker' { const url:string; export default url; }
declare module 'codi-controlled-3mf-worker' { const url:string; export default url; }
declare module 'codi-native-archive-worker' { const url:string; export default url; }
declare module 'codi-enclosure-manufacturing-module' { const url:string; export default url; }

declare module 'codi-enclosure-contact-module' { const url:string; export default url; }
declare module 'codi-boolean-history-assets' { const assets:{worker:string;js:string;wasm:string;modules:Record<string,string>}; export default assets; }
declare module 'codi-revolve-profile-assets' { const assets:{worker:string;js:string;wasm:string;modules:Record<string,string>}; export default assets; }

declare module 'codi-selected-profile-exact-volume' { const url:string; export default url; }
declare module 'codi-exact-mesh-volume-module' { const url:string; export default url; }

declare module 'codi-sweep-profile-assets' { const assets:{worker:string;js:string;wasm:string;modules:Record<string,string>}; export default assets; }

declare module 'codi-loft-profile-assets' { const assets:null|{worker:string;js:string;wasm:string;modules:Record<string,string>}; export default assets; }

declare module 'codi-adaptive-metrology-assets' { const assets:null|{worker:string;js:string;wasm:string;modules:Record<string,string>}; export default assets; }

declare module 'codi-step-export-assets' {const assets:null|{worker:string;js:string;wasm:string;modules:Record<string,string>};export default assets;}

declare module 'codi-manufacturing-mesh-assets' {const assets:null|{worker:string;js:string;wasm:string;modules:Record<string,string>};export default assets;}

declare module 'codi-shell-assets' {const assets:null|{worker:string;js:string;wasm:string;modules:Record<string,string>};export default assets;}

declare module 'codi-circular-assets' {
 const assets:null|{circularArrangementVersion:1;selectedRegionArrangementVersion:1;worker:string;js:string;wasm:string;modules:Record<string,string>};
 export default assets;
}

declare module 'codi-mechanical-native-assets' {const assets:null|{format:'mechanical-native-component/1';profileSourceBindingVersion:1;selectedRegionArrangementVersion:1;jsSha256:string;wasmSha256:string;bootstrapSha256:string;workerSha256:string;worker:string;js:string;wasm:string;modules:Record<string,string>};export default assets;}

declare module 'codi-finite-curve-support-assets' {
 type Leaf='modules/engine/mount/finiteCurveNativeCalls.mjs'|'modules/engine/mount/finiteCurveReadProtocol.mjs';
 type File=Leaf|'modules/engine/mount/finite-curve-support-worker.js'|'finite-curve-support-occ-portable.js'|'finite-curve-support-occ.wasm';
 type Source=Leaf|'modules/engine/mount/oci-verified-worker.js'|'build/embedded-display.cjs'|
  'modules/engine/mount/displayProjection.mjs'|'build/owned-profile-resource-closure.cjs'|
  'build/prepare-finite-curve-support-assets.cjs'|'build/finite-curve-support-assets-entry.cjs'|
  'build/finite-curve-support-candidate-entry.mjs'|'build/prepare-finite-curve-support-cohort.cjs'|
  'modules/engine/mount/ownedFiniteCurveSupportCandidate.mjs'|'modules/engine/mount/ownedFiniteCurveSupportResources.mjs'|
  'modules/engine/mount/finiteCurveSupportRequest.mjs'|'modules/engine/mount/occ-finite-curve-support-mount.mjs';
 type Pin=Readonly<{sha256:string;bytes:number}>;
 const assets:null|Readonly<{
  format:'finite-curve-support-component/1';sourceQueryOnly:true;finiteCurveSupportReadVersion:1;
  sourceCommit:'d3b2afa0524807d04021eeeba3ca37298dabd160';sourceTree:'b3800d4e4c858b003b8a3cdead4b77e8e8918ba5';
  jsSha256:'479f0620b6dfe131dac05131a3798fc533e05a2bd11e8074ef240284f61bbe86';
  wasmSha256:'746da919c8457e98daa821fae98c62c0a6c9ad1acafd1c3d5412e0207d6b6325';
  jsBytes:316530;wasmBytes:36216184;bootstrapSha256:string;workerSha256:string;
  worker:string;js:string;wasm:string;modules:Readonly<Record<Leaf,string>>;
  sources:Readonly<Record<Leaf,string>>;files:Readonly<Record<File,Pin>>;
  sourceBindings:Readonly<Record<Source,Pin>>;
  queryImportRoots:readonly [Readonly<{module:'modules/engine/mount/finiteCurveNativeCalls.mjs';
   literal:"await import(new URL('./finiteCurveNativeCalls.mjs',self.location.href))"}>];
 }>;
 export default assets;
}

// Optional analytic source-owned prism; null until a genuine new pair is staged.
declare module 'codi-analytic-profile-assets' {
 const value:null|Readonly<{format:'analytic-profile-component/1';jsSha256:string;wasmSha256:string;nativeSourceCommit:string;nativeHeaderSha256:string;bootstrapSha256:string;workerSha256:string;worker:string;js:string;wasm:string;modules:Readonly<Record<string,string>>;files:Readonly<Record<string,Readonly<{sha256:string;bytes:number}>>>;sources:Readonly<Record<string,string>>;producerSources:Readonly<Record<string,string>>}>;
 export default value;
}
