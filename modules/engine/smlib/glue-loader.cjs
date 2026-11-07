// The verified source is bundled into the Worker. Bind its module URL to the
// executing Worker, avoiding machine-specific build paths in the artifact.
const crypto=require('node:crypto');
module.exports=function(source){if(crypto.createHash('sha256').update(source).digest('hex')!=='edf63120f9e08e7fbad9fa2e44bebb8b28eee0dfaae50b4b720fd084438f6c24')throw Error('SMLib glue digest mismatch');const token='import.meta.url',count=source.split(token).length-1;if(count!==2)throw Error('Unexpected SMLib glue shape');return source.replaceAll(token,'self.location.href')};
