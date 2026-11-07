// Private qualification entry. Never package as a public application asset.
import {prepareSolvedSelectedRegion} from '/modules/engine/extrusion/selectedSketchProfile.mjs';
self.onmessage=async event=>{
 try{self.postMessage({ok:true,prepared:await prepareSolvedSelectedRegion(event.data)});}
 catch(error){self.postMessage({ok:false,error:{code:error.code,message:error.message}});}
};
