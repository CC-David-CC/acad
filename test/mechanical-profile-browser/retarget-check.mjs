import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const old=readFileSync(new URL('../polygon-profile-v3-browser/browser.cjs',import.meta.url),'utf8'),actual=readFileSync(new URL('./retained-v3.cjs',import.meta.url),'utf8');
const edits=[
 ["['browser.cjs','cases.mjs','oracle.mjs']","['retained-v3.cjs','../polygon-profile-v3-browser/browser.cjs','../polygon-profile-v3-browser/cases.mjs','../polygon-profile-v3-browser/oracle.mjs']"],
 ["scope:'Actual Chromium Worker V3 geometry/provenance component; explicit fixtures, no public authored/sketch/history/Files qualification'","scope:'Retained unchanged eight-case V3 geometry/provenance corpus on actual mechanical-profile Chromium Worker; no public authored/sketch/history/Files qualification'"],
 ["await import('./cases.mjs')","await import('../polygon-profile-v3-browser/cases.mjs')"],
 ["await import('./oracle.mjs')","await import('../polygon-profile-v3-browser/oracle.mjs')"],
 ['createPolygonProfileOccMount','createMechanicalProfileOccMount']
];
let expected=old;for(const [before,after]of edits){assert(expected.includes(before));expected=expected.replaceAll(before,after);}
expected='// Test-only constructor retarget of the retained V3 driver; mathematical and refusal assertions unchanged.\n'+expected;
assert.equal(actual,expected,'Retained corpus assertions or execution changed beyond exact allowed constructor/source-path/receipt-label edits');
const hash=s=>createHash('sha256').update(s).digest('hex'),report={status:'PASS',scope:'Exact source transformation, not geometry observations',originalDriverSHA256:hash(old),retargetedDriverSHA256:hash(actual),edits,mathematicalAndRefusalAssertionsUnchanged:true};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
