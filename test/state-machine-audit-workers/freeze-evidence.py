"""Archive complete successful receipts before compacting display-only arrays.

Run once after the original native browser oracles pass. Compacted receipts are
evidence summaries, not inputs to those full-array oracles. Native observations,
plans, point checks and metrics remain unchanged. No generated geometry here.
"""
import hashlib
import json
import pathlib
import shutil
import struct
import sys

root = pathlib.Path(__file__).resolve().parent
archive = pathlib.Path(sys.argv[1])
archive.mkdir(parents=True, exist_ok=False)
names = ['retained-paths-after.json', 'retained-old-after.json',
         'retained-controller-after.json', 'retained-old-controller-after.json']
records = {}
for name in names:
    source = root / name
    raw = source.read_bytes()
    value = json.loads(raw)
    assert value['status'] == 'PASS'
    shutil.copyfile(source, archive / name)
    replacements = []

    def visit(obj, path=''):
        if isinstance(obj, dict):
            for key, item in list(obj.items()):
                if key == 'coordinates' and isinstance(item, list):
                    digest = hashlib.sha256()
                    for number in item:
                        digest.update(struct.pack('<d', number))
                    obj[key] = {'omittedDisplayArray': True, 'elements': len(item),
                                'encoding': 'IEEE754-binary64-little-endian',
                                'sha256': digest.hexdigest()}
                    replacements.append(path + '/' + key)
                else:
                    visit(item, path + '/' + key)
        elif isinstance(obj, list):
            for index, item in enumerate(obj):
                visit(item, path + '/' + str(index))

    visit(value)
    value['evidenceCompaction'] = {
        'scope': 'Display coordinates only, AFTER original full-array assertions passed',
        'rawSHA256': hashlib.sha256(raw).hexdigest(), 'rawBytes': len(raw),
        'rawArchive': str(archive / name), 'replacements': replacements}
    source.write_text(json.dumps(value, separators=(',', ':')) + '\n')
    records[name] = {'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw),
                     'compactedSHA256': hashlib.sha256(source.read_bytes()).hexdigest(),
                     'displayArrays': len(replacements)}
(root / 'raw-receipt-pins.json').write_text(json.dumps(records, indent=2) + '\n')
