import {test} from 'node:test';
import assert from 'node:assert/strict';
import {labelPreview,MAX_LABEL_PREVIEW} from '../../web/app/sketcher/shapes/labelPreview.mjs';

test('ordinary labels retain their complete visible text',()=>{
  for(const text of ['', 'Bracket Ø12', 'a'.repeat(MAX_LABEL_PREVIEW)]) assert.equal(labelPreview(text),text);
});
test('a huge authored string produces a bounded and explicitly labeled display preview',()=>{
  const authored='x'.repeat(1037000),before=authored;
  const preview=labelPreview(authored);
  assert.equal(preview.length,MAX_LABEL_PREVIEW);
  assert.match(preview,/\[long label preview\]$/);
  assert.equal(authored,before);
  assert.equal(authored.length,1037000);
});
test('a preview boundary never splits an astral character surrogate pair',()=>{
  const text='😀'.repeat(MAX_LABEL_PREVIEW),preview=labelPreview(text);
  assert.ok(preview.length<=MAX_LABEL_PREVIEW);
  const prefix=preview.slice(0,preview.indexOf('…'));
  assert.equal(prefix.length%2,0);
  assert.equal(prefix,prefix.toWellFormed());
});
