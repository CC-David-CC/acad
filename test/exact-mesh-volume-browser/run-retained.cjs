// Own Chromium process. Existing drivers use own contexts/disconnect, unchanged.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ppRoot='/path/to/workspace/CodiServer/desktop-preview/SIMPLIFIED/tests/node_modules/puppeteer-core',pp=require(ppRoot),out=__dirname;
(async()=>{const profile=fs.mkdtempSync('/path/to/workspace/snap/chromium/common/codi-exact-retained-');let b;
 try{b=await pp.launch({executablePath:'/snap/bin/chromium',headless:true,userDataDir:profile,args:['--no-sandbox','--disable-gpu','--use-angle=swiftshader-webgl']});const u=new URL(b.wsEndpoint()),cdp='http://127.0.0.1:'+u.port;
  for(const [name,driver]of[['through-holes','test/through-hole-browser/browser.cjs'],['boolean-history','test/boolean-history-browser/browser.cjs']]){
   const log=fs.openSync(path.join(out,'retained-'+name+'.log'),'w');
   const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[driver],{cwd:path.resolve(__dirname,'../..'),env:{...process.env,CODI_COMPONENT_PINS:path.join(out,'retained-pins.json'),CODI_TEST_CDP:cdp,PUPPETEER_CORE_PATH:ppRoot,CODI_RECEIPT:path.join(out,'retained-'+name+'.json')},stdio:['ignore',log,log]});child.on('error',reject);child.on('exit',resolve);});fs.closeSync(log);assert.equal(code,0,name);console.log('PASS retained',name);
  }
 }finally{if(b)await b.close();fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
