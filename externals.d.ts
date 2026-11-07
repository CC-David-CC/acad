declare module '*.less' {
  const resource: {[key: string]: string};
  export = resource;
}
declare module "*.svg" {
  const content: any;
  export default content;
}
declare module 'codi-project-validation-worker' {
  const url: string;
  export default url;
}
declare module 'codi-selected-profile-worker' { const url:string; export default url; }
declare module 'codi-selected-profile-occ-portable' { const url:string; export default url; }
declare module 'codi-selected-profile-occ-wasm' { const url:string; export default url; }
declare module 'codi-selected-profile-plan' { const url:string; export default url; }

declare const verb: any;
declare const FS: any;
declare const __CAD_APP: any;
declare const __DEBUG__: any;
declare let out: any;

declare module 'codi-physical-parameters-worker' { const url: string; export default url; }
