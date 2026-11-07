import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validExternalParameterName,validVariableName,parseMathDefinitions,evaluateMath} from '../../modules/gems/safeExpression.mjs';
import {evaluatePhysicalDefinitions} from '../../web/app/cad/parameters/physicalQuantities.mjs';

test('typed engineering E and Math have explicit literal numeric binding names',()=>{
  for(const name of ['E','Math']) {
    const result=evaluatePhysicalDefinitions({version:1,definitions:[{name,dimension:'length',expression:'mm(16)'}]});
    assert.equal(result.values[0].value,16);
    assert.equal(validExternalParameterName(name),true);
    assert.equal(validVariableName(name),false,'legacy definition names remain unchanged');
    assert.ok(parseMathDefinitions(`${name}=16`).errors.length>0);
  }
  assert.equal(evaluateMath('E'),Math.E);
  assert.equal(evaluateMath('Math.PI'),Math.PI);
});
test('external binding names retain identifier and prototype-key restrictions',()=>{
  for(const name of ['PI','__proto__','prototype','constructor','x.y','E+1','',null,{},'a'.repeat(129)]) assert.equal(validExternalParameterName(name),false);
  for(const name of ['D','D2','width','$gap','e']) assert.equal(validExternalParameterName(name),true);
});
