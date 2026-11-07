// Some enclosing APIs also carry revision/selector fields validated separately.
export function captureDocumentJobOptions(input,strict=false) {
 const proto=input&&typeof input==='object'?Object.getPrototypeOf(input):undefined;
 if(!input||typeof input!=='object'||Array.isArray(input)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||strict&&Reflect.ownKeys(input).some(key=>typeof key!=='string'||!['signal','valid'].includes(key)))throw new Error('Invalid document job options.');
 /** @type {{signal?: AbortSignal, valid?: () => boolean}} */
 const options={};
 for(const key of ['signal','valid']){const field=Object.getOwnPropertyDescriptor(input,key);if(!field)continue;if(!field.enumerable||!Object.prototype.hasOwnProperty.call(field,'value'))throw new Error('Document job options must be data.');options[key]=field.value;}
 if(options.valid!==undefined&&typeof options.valid!=='function')throw new Error('Invalid document session guard.');
 if(options.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(options.signal)}catch{throw new Error('Invalid document cancellation signal.')}
 return Object.freeze(options);
}
