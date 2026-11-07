// The verified source is bundled into the Worker. Bind its module URL to the
// executing Worker, avoiding machine-specific build paths in the artifact.
const crypto=require('node:crypto');
module.exports=function(source){if(crypto.createHash('sha256').update(source).digest('hex')!=='8e49622c97d839cf94d6c4d5e2de6cbd96d1166075741e08dcbda3b1a223d8fa')throw Error('SMLib glue digest mismatch');const token='import.meta.url',count=source.split(token).length-1;if(count!==2)throw Error('Unexpected SMLib glue shape');return source.replaceAll(token,'self.location.href')};
