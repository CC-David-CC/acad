const {Parser}=require('browser-xml2js');
self.onmessage=event=>{
  const parser=new Parser({async:true,chunkSize:4});
  self.postMessage({kind:'started'});
  parser.parseString(event.data,(error,value)=>self.postMessage({kind:'done',error:error?.message||null,value}));
};
