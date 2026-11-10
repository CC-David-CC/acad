// Acceptance-only source construction. This does not run a math parser or
// bypass a product validator. The real public command must accept the source.
import a from 'node:assert/strict';
export function unicodeBoundarySource(initialText,marker){
 a.equal(typeof initialText,'string');a.equal(typeof marker,'string');a(marker.length>0);
 const initialIndex=initialText.indexOf(marker);a(initialIndex>=0,'Marker present in actual first saved JSON');
 const initialScript=JSON.parse(initialText).project.model.expressions;a.equal(typeof initialScript,'string');
 const initialEncodedLength=JSON.stringify(initialScript).length-2;
 // parseMathDefinitions explicitly ignores whitespace-only lines before it
 // calls the expression evaluator. The one real RHS remains " 1" (2 units).
 // The newline is TWO escaped JSON units, not one unit of persisted JSON.
 const suffix='\npad = 1',suffixEncodedLength=JSON.stringify(suffix).length-2;
 const padding=((16383-(initialIndex+suffixEncodedLength-initialEncodedLength))%16384+16384)%16384;
 const script=' '.repeat(padding)+suffix,encodedLength=JSON.stringify(script).length-2,lines=script.split('\n');
 a.equal(lines.length,2);a.equal(lines[0].trim(),'');a.equal(lines[1],'pad = 1');
 const rhs=lines[1].slice(lines[1].indexOf('=')+1);
 a(rhs.trim().length>0&&rhs.length<=2048,'Actual existing per-expression limit');
 a(lines.length<=2048&&script.length<=65536&&new TextEncoder().encode(script).length<=65536,'Actual total source/line limits');
 a.equal(encodedLength,padding+suffixEncodedLength,'Exact JSON-escaped newline contribution');
 a.equal((initialIndex+encodedLength-initialEncodedLength)%16384,16383,'One exact source-derived boundary placement');
 return {initialIndex,initialEncodedLength,suffixEncodedLength,padding,script,encodedLength,lineCount:lines.length,rhsLength:rhs.length};
}
