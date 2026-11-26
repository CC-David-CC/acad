import assert from 'node:assert/strict';
import test from 'node:test';
import {
  nativeProjectFormat,
  nativeSaveExtension,
  withNativeSaveExtension,
} from '../../webos/native-project-file.mjs';

const archive = {
  prepareHostNativeArchive() {},
  restoreNativeArchiveBytesInEmptyWorkspace() {},
  closeNativeArchive() {},
};

test('a bare Save As name uses the format of the open project or the runtime default', () => {
  assert.equal(nativeSaveExtension(archive), '.cad');
  assert.equal(nativeSaveExtension(archive, '/Plan.JSKETCHER.JSON'), '.jsketcher.json');
  assert.equal(nativeSaveExtension({}), '.jsketcher.json');
  assert.equal(withNativeSaveExtension(' /Dotted.Folder/New Plan ', '.cad'), '/Dotted.Folder/New Plan.cad');
});

test('explicit project formats and invalid filenames pass through to the file validator', () => {
  for (const path of ['/Plan.CAD', '/Plan.jsketcher.json', '/Plan.svg', '/Documents/', '']) {
    assert.equal(withNativeSaveExtension(path, '.cad'), path);
  }
  assert.equal(nativeProjectFormat(withNativeSaveExtension('/Plan', '.cad')), 'cad');
  assert.throws(() => nativeProjectFormat(withNativeSaveExtension('/Plan.svg', '.cad')));
});
