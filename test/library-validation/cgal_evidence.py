"""Read-only intake of pinned completed native mesh-assessment evidence.

No geometry/library execution, repair, artifact writer or source-intent proof.
The caller must pin reviewed Git commits/paths, not take those anchors from the
assessment being checked. See CGAL-EVIDENCE-CONTRACT.md. SOURCE ONLY / UNRUN.
"""
import hashlib
import json
import math
from pathlib import Path, PurePosixPath
import re
import struct
import subprocess
from types import MappingProxyType


MAX_DATA = 128 * 1024 * 1024
MAX_REPORT = 16 * 1024 * 1024
MAX_SMALL = 1024 * 1024
MAX_VERTICES, MAX_TRIANGLES = 150000, 100000
MAX_ARRAY = 8388608
MAX_OBJECTS, MAX_FILES = 512, 32
SHA = re.compile(r'[0-9a-f]{64}\Z')
OID = re.compile(r'[0-9a-f]{40}\Z')
CGAL_LIMITS = {'vertices': 150000, 'triangles': 100000, 'binaryBytes': 8388608,
               'textBytes': 16777216, 'lineBytes': 80, 'detailsPerList': 128,
               'outputBytes': 65536}
SOURCE_CPP = 'test/library-validation/cgal/mesh_readonly.cpp'
SOURCE_CMAKE = 'test/library-validation/cgal/CMakeLists.txt'
SOURCE_OBSERVER = 'test/library-validation/compare_actual.py'
CONTENT_SCOPE = 'PASS: expanded names/counts/exact string values'
PRESERVE_LIMIT = 'UNCERTAIN: v2.5.0 default differs from Core1.3; no roundtrip claim'


class EvidenceRefusal(ValueError):
    """Missing, unbound, incomplete or nonpassing evidence; not invalid design."""


class EvidenceResourceLimit(EvidenceRefusal):
    """Evidence/argument bounds exceeded; never a successful truncated census."""


def _need(condition, reason):
    if not condition:
        raise EvidenceRefusal('CGAL evidence: ' + reason)


def _sha(data):
    return hashlib.sha256(data).hexdigest()


def _digest(value):
    _need(type(value) is str and SHA.fullmatch(value), 'invalid SHA256')
    return value


def _oid(value):
    _need(type(value) is str and OID.fullmatch(value), 'full reviewed Git OID required')
    return value


def _relative(value):
    _need(type(value) is str and 0 < len(value) <= 512 and
          '\\' not in value and ':' not in value and '\x00' not in value,
          'invalid repository-relative evidence path')
    path = PurePosixPath(value)
    _need(not path.is_absolute() and all(p not in ('', '.', '..') for p in path.parts)
          and str(path) == value, 'noncanonical evidence path')
    return value


def _filename(value):
    _relative(value)
    _need(len(PurePosixPath(value).parts) == 1 and len(value) <= 255,
          'artifact must be one exact basename')
    return value


def _integer(value, low, high, label):
    _need(type(value) is int and low <= value <= high, label)
    return value


def _sequence(value, maximum, label):
    _need(type(value) in (list, tuple), label + ' must be a concrete sequence')
    if len(value) > maximum:
        raise EvidenceResourceLimit(label + ' count limit')
    return value


def _json(data, maximum):
    _need(type(data) is bytes, 'immutable evidence bytes required')
    if len(data) > maximum:
        raise EvidenceResourceLimit('JSON byte limit')
    def pairs(rows):
        result = {}
        for key, value in rows:
            _need(key not in result, 'duplicate JSON key')
            result[key] = value
        return result
    def integer(token):
        _need(len(token) <= 24, 'JSON integer limit')
        return int(token)
    def number(token):
        _need(len(token) <= 128, 'JSON number limit')
        value = float(token)
        _need(math.isfinite(value), 'nonfinite JSON number')
        return value
    def constant(_):
        raise EvidenceRefusal('CGAL evidence: nonstandard JSON constant')
    try:
        result = json.loads(data.decode('utf-8'), object_pairs_hook=pairs,
                            parse_int=integer, parse_float=number, parse_constant=constant)
    except (UnicodeError, json.JSONDecodeError, RecursionError) as error:
        raise EvidenceRefusal('CGAL evidence: malformed bounded JSON') from error
    stack, nodes = [(result, 0)], 0
    while stack:
        value, depth = stack.pop()
        nodes += 1
        if depth > 64 or nodes > 2000000:
            raise EvidenceResourceLimit('JSON structural limit')
        if type(value) is dict:
            stack.extend((child, depth + 1) for child in value.values())
        elif type(value) is list:
            stack.extend((child, depth + 1) for child in value)
    return result


class _GitSnapshot:
    def __init__(self, repository, commit):
        self.repository, self.commit = str(Path(repository)), _oid(commit)

    def blob(self, path, maximum):
        path = _relative(path)
        spec = self.commit + ':' + path
        command = ['git', '-C', self.repository, 'cat-file']
        try:
            size = subprocess.run(command + ['-s', spec], capture_output=True,
                                  timeout=30, check=False)
            _need(size.returncode == 0 and len(size.stdout) <= 24 and
                  size.stdout.strip().isdigit(), 'missing pinned Git blob')
            if int(size.stdout) > maximum:
                raise EvidenceResourceLimit('Git blob byte limit')
            child = subprocess.run(command + ['blob', spec], capture_output=True,
                                   timeout=30, check=False)
        except (OSError, subprocess.TimeoutExpired) as error:
            raise EvidenceRefusal('CGAL evidence: pinned Git read failed') from error
        _need(child.returncode == 0 and len(child.stdout) == int(size.stdout),
              'incomplete pinned Git blob')
        return child.stdout


def _record(record, raw, label):
    _need(type(record) is dict and record.get('sha256') == _sha(raw), label + ' SHA256')
    if 'bytes' in record:
        _need(type(record['bytes']) is int and record['bytes'] == len(raw), label + ' byte count')
    if 'gitBlob' in record:
        expected = hashlib.sha1(b'blob ' + str(len(raw)).encode('ascii') + b'\0' + raw).hexdigest()
        _need(record['gitBlob'] == expected, label + ' Git blob')


def _positive_finite(value, label):
    _need(type(value) in (int, float) and math.isfinite(value) and value > 0, label)


def _mesh_arrays(vertices, triangles):
    vertices = _sequence(vertices, MAX_VERTICES, 'raw vertices')
    triangles = _sequence(triangles, MAX_TRIANGLES, 'raw triangles')
    _need(vertices and triangles, 'empty raw mesh')
    if 32 + 24 * len(vertices) + 12 * len(triangles) > MAX_ARRAY:
        raise EvidenceResourceLimit('decoded raw array budget')
    for point in vertices:
        _sequence(point, 3, 'raw point')
        _need(len(point) == 3 and all(type(v) is float and math.isfinite(v) for v in point),
              'original decoded binary64 coordinates required')
    for face in triangles:
        _sequence(face, 3, 'raw triangle')
        _need(len(face) == 3 and all(type(v) is int and 0 <= v < len(vertices) for v in face),
              'raw face indices')
        _need(len(set(face)) == 3, 'repeated raw face index')
    arrays, stdin = hashlib.sha256(), hashlib.sha256()
    stdin.update(f'{len(vertices)} {len(triangles)}\n'.encode('ascii'))
    for point in vertices:
        arrays.update(struct.pack('<ddd', *point))
        stdin.update((' '.join(struct.pack('>d', v).hex() for v in point) + '\n').encode('ascii'))
    for face in triangles:
        arrays.update(struct.pack('<QQQ', *face))
        stdin.update((' '.join(map(str, face)) + '\n').encode('ascii'))
    return arrays.hexdigest(), stdin.hexdigest()


def _mapping(value, label):
    _need(type(value) is dict, label + ' must be an object')
    return value


def _validate_mesh(snapshot, report_path, filename, package, row):
    _mapping(row, 'mesh observation')
    identity = _integer(row.get('objectId'), 1, 2147483647, 'actual mesh object ID')
    obj = _mapping(package['objects'].get(str(identity)), 'actual raw mesh object')
    _need(type(obj.get('id')) is int and obj['id'] == identity and obj.get('kind') == 'mesh',
          'mesh object/source roster mismatch')
    vertices = _integer(obj.get('vertices'), 1, MAX_VERTICES, 'vertex count')
    triangles = _integer(obj.get('triangles'), 1, MAX_TRIANGLES, 'triangle count')
    _need(32 + 24 * vertices + 12 * triangles <= MAX_ARRAY, 'decoded array budget')
    array_sha = _digest(row.get('rawArraySHA256'))
    raw = _mapping(row.get('rawTopology'), 'raw topology')
    _need(raw.get('status') == 'PASS' and raw.get('badEdgesFirst16') == [] and
          raw.get('badVertexLinksFirst16') == [], 'raw indexed topology is not passing')
    for key in ('badEdgeCount', 'badVertexLinkCount', 'unusedVertices'):
        _integer(raw.get(key), 0, 0, 'raw topology nonzero/incomplete ' + key)
    edges = _integer(raw.get('edges'), 1, 3 * triangles, 'raw edge count')
    _need(edges * 2 == 3 * triangles, 'raw closed-edge incidence count')
    euler = _integer(raw.get('eulerCharacteristic'), -3 * triangles, vertices + triangles,
                     'raw Euler characteristic')
    _need(euler == vertices - edges + triangles, 'raw Euler census differs')
    trimesh = _mapping(row.get('trimesh'), 'Trimesh observation')
    measurements = _mapping(trimesh.get('measurements'), 'Trimesh measurements')
    _need(trimesh.get('status') == 'PASS' and
          trimesh.get('arrayBitsAndIndicesUnchanged') is True and
          measurements.get('watertight') is True and measurements.get('windingConsistent') is True
          and type(measurements.get('eulerCharacteristic')) is int and
          measurements['eulerCharacteristic'] == euler and
          trimesh.get('sourceIntentAndDeviation') == 'NOT_CERTIFIED',
          'Trimesh raw-array/winding evidence is not passing')
    components = _integer(measurements.get('faceConnectedComponents'), 1, triangles,
                          'Trimesh face component count')
    _positive_finite(measurements.get('signedVolume'), 'positive finite numerical volume')
    bounds = _sequence(measurements.get('bounds'), 2, 'Trimesh bounds')
    _need(len(bounds) == 2, 'two bounds rows required')
    for bound in bounds:
        _sequence(bound, 3, 'Trimesh bounds row')
        _need(len(bound) == 3 and all(type(v) in (int, float) and math.isfinite(v) for v in bound),
              'finite Trimesh bounds')
    _need(all(bounds[0][i] <= bounds[1][i] for i in range(3)), 'ordered Trimesh bounds')
    cgal = _mapping(row.get('cgal'), 'CGAL invocation')
    _integer(cgal.get('exitCode'), 0, 0, 'CGAL invocation did not settle with exit zero')
    input_sha = _digest(cgal.get('inputSHA256'))
    result = _mapping(cgal.get('report'), 'CGAL report')
    _integer(result.get('version'), 1, 1, 'CGAL report version')
    _need(result.get('adapter') == 'codi-cgal-raw-mesh-v1' and
          result.get('scope') == 'geometric-validity-only' and
          type(result.get('cgalVersion')) is str and
          re.fullmatch(r'5\.6(?:\.\d{1,3})?', result['cgalVersion']) and
          result.get('status') == 'PASS' and result.get('reason') == 'GEOMETRIC_CHECKS_COMPLETED'
          and result.get('limits') == CGAL_LIMITS, 'unsupported/nonpassing CGAL report profile')
    observed_input = _mapping(result.get('input'), 'CGAL input census')
    _integer(observed_input.get('vertices'), vertices, vertices, 'CGAL vertex census')
    _integer(observed_input.get('triangles'), triangles, triangles, 'CGAL triangle census')
    _need(observed_input.get('complete') is True and observed_input.get('errorLine') is None,
          'CGAL input scan incomplete')
    for key, details in (('degenerateFaces', 'ids'), ('insertionFailures', 'rows')):
        scan = _mapping(result.get(key), 'CGAL ' + key)
        _integer(scan.get('count'), 0, 0, 'CGAL nonzero ' + key)
        _need(scan.get('scanComplete') is True and scan.get('complete') is True and
              scan.get(details) == [], 'CGAL incomplete ' + key)
    graph = _mapping(result.get('graph'), 'CGAL graph')
    _need(graph.get('status') == 'PASS' and graph.get('valid') is True and
          graph.get('triangular') is True and graph.get('closed') is True and
          graph.get('componentDetailsComplete') is True, 'CGAL closed graph evidence')
    _integer(graph.get('componentCount'), components, components, 'CGAL component count')
    summaries = _sequence(graph.get('components'), 128, 'CGAL component summaries')
    _need(len(summaries) == components, 'CGAL component census truncated')
    first_ids, face_sum = [], 0
    for component in summaries:
        _mapping(component, 'CGAL component row')
        _need(set(component) == {'firstFaceId', 'faceCount'}, 'CGAL component row shape')
        first_ids.append(_integer(component['firstFaceId'], 0, triangles - 1, 'original first face ID'))
        face_sum += _integer(component['faceCount'], 1, triangles, 'component face count')
    _need(first_ids == sorted(set(first_ids)) and first_ids[0] == 0 and face_sum == triangles,
          'CGAL original component face census')
    intersections = _mapping(result.get('selfIntersections'), 'CGAL intersection census')
    _integer(intersections.get('countAtLeast'), 0, 0, 'CGAL nonzero intersection count')
    _need(intersections.get('status') == 'PASS' and intersections.get('complete') is True and
          intersections.get('originalFacePairs') == [], 'CGAL intersection scan incomplete')
    volume = _mapping(result.get('volumeBoundary'), 'CGAL volume-boundary result')
    _need(volume.get('status') == 'PASS' and volume.get('doesBoundAVolume') is True,
          'CGAL complete volume-boundary check missing')
    _need(result.get('sourceIntent') == 'NOT_RUN' and
          result.get('deviationCertificate') == 'NOT_RUN', 'CGAL geometric scope changed')
    folder = str(PurePosixPath(report_path).parent /
                 (PurePosixPath(filename).stem + '-mesh-' + str(identity)))
    encoded = snapshot.blob(folder + '/cgal-input.txt', CGAL_LIMITS['textBytes'])
    stdout = snapshot.blob(folder + '/cgal-stdout.json', CGAL_LIMITS['outputBytes'])
    stderr = snapshot.blob(folder + '/cgal-stderr.txt', CGAL_LIMITS['outputBytes'])
    _need(_sha(encoded) == input_sha and _json(stdout, 65536) == result and stderr == b'',
          'archived actual CGAL input/output differs from embedded evidence')
    return identity, {'vertices': vertices, 'triangles': triangles,
        'rawArraySHA256': array_sha, 'cgalInputSHA256': input_sha,
        'cgalStdoutSHA256': _sha(stdout), 'components': components,
        'eulerCharacteristic': euler, 'bounds': tuple(tuple(bound) for bound in bounds)}


_ISSUER = object()


class _BoundCGALAssessment:
    """Only load_cgal_evidence issues this detached, bounded offline index."""
    def __init__(self, rows, provenance, issuer):
        _need(issuer is _ISSUER, 'assessment must be issued by complete intake')
        self._rows = MappingProxyType(rows)
        self._provenance = MappingProxyType(provenance)

    def bind_mesh(self, artifact_path, object_id, vertices, triangles):
        """Bind ORIGINAL raw F64 arrays, before any source-frame mapping."""
        path = Path(artifact_path)
        filename = _filename(path.name)
        _integer(object_id, 1, 2147483647, 'requested original object ID')
        row = self._rows.get((filename, object_id))
        _need(row is not None, 'artifact/object absent from complete bound batch')
        arrays_sha, stdin_sha = _mesh_arrays(vertices, triangles)
        _need(len(vertices) == row['vertices'] and len(triangles) == row['triangles'] and
              arrays_sha == row['rawArraySHA256'] and stdin_sha == row['cgalInputSHA256'],
              'actual F64/index arrays or exact stdin differ for this object')
        _need(tuple(min(p[i] for p in vertices) for i in range(3)) == row['bounds'][0] and
              tuple(max(p[i] for p in vertices) for i in range(3)) == row['bounds'][1],
              'actual raw bounds differ from Trimesh observation')
        digest, size = hashlib.sha256(), 0
        with path.open('rb') as source:
            for chunk in iter(lambda: source.read(1024 * 1024), b''):
                size += len(chunk)
                if size > MAX_DATA:
                    raise EvidenceResourceLimit('artifact byte limit')
                digest.update(chunk)
        _need(size == row['artifactBytes'] and digest.hexdigest() == row['artifactSHA256'],
              'actual artifact differs from receipt/assessment')
        return MappingProxyType({**self._provenance, 'artifact': filename,
            'artifactSHA256': row['artifactSHA256'], 'objectId': object_id,
            'vertices': row['vertices'], 'triangles': row['triangles'],
            'rawArraySHA256': arrays_sha, 'cgalInputSHA256': stdin_sha,
            'cgalStdoutSHA256': row['cgalStdoutSHA256'], 'components': row['components'],
            'eulerCharacteristic': row['eulerCharacteristic'],
            'scope': 'bound original-object mesh geometric validity only',
            'rawIndexedTopology': 'PASS', 'trimeshWindingAndUnchangedArrays': 'PASS',
            'cgalCompleteGeometricChecks': 'PASS',
            'lib3mfContent': 'PASS scoped material/scene/unit/expanded-metadata content',
            'float32GeometryAuthority': False, 'metadataPreservation': 'NOT_CERTIFIED',
            'sourceIntent': 'NOT_CERTIFIED', 'analyticSurfaceCoverage': 'NOT_CERTIFIED',
            'surfaceDeviation': 'NOT_CERTIFIED', 'combinedInstanceGeometry': 'NOT_CERTIFIED'})


def load_cgal_evidence(repository, *, evidence_commit, report_path, build_custody_path,
                       acquisition_path, observer_commit, build_source_commit,
                       input_manifest_path, executable_key, receipt_bytes):
    """Load a Root-pinned complete assessment, not caller-supplied valid flags.

    All commits/paths are reviewed caller anchors. No library/tool is executed;
    only bounded local Git blobs and the caller's immutable receipt are read.
    Frozen executable provenance is verified; no fresh binary-rehash claim.
    """
    _need(type(receipt_bytes) is bytes, 'immutable original receipt bytes required')
    if len(receipt_bytes) > MAX_DATA:
        raise EvidenceResourceLimit('whole receipt byte limit')
    snapshot = _GitSnapshot(repository, evidence_commit)
    report_path, build_custody_path = map(_relative, (report_path, build_custody_path))
    acquisition_path, input_manifest_path = map(_relative, (acquisition_path, input_manifest_path))
    executable_key = _relative(executable_key)
    report_bytes = snapshot.blob(report_path, MAX_REPORT)
    build_bytes = snapshot.blob(build_custody_path, MAX_SMALL)
    acquisition_bytes = snapshot.blob(acquisition_path, MAX_SMALL)
    report = _mapping(_json(report_bytes, MAX_REPORT), 'assessment')
    build = _mapping(_json(build_bytes, MAX_SMALL), 'build custody')
    acquisition = _mapping(_json(acquisition_bytes, MAX_SMALL), 'acquisition custody')
    _need(build.get('sourceCommit') == _oid(build_source_commit) and
          build.get('sourceStatus') == '', 'build source/clean-state provenance')
    source_snapshot = _GitSnapshot(repository, build_source_commit)
    sources = _mapping(build.get('sources'), 'build source inventory')
    _need({SOURCE_CPP, SOURCE_CMAKE, input_manifest_path} <= set(sources) and
          0 < len(sources) <= 32, 'build source inventory incomplete/unbounded')
    for name, record in sources.items():
        _mapping(record, 'build source record')
        _oid(record.get('gitBlob'))
        _record(record, source_snapshot.blob(name, MAX_REPORT), 'actual build source ' + name)
    observer = _GitSnapshot(repository, observer_commit).blob(SOURCE_OBSERVER, MAX_SMALL)
    _need(report.get('adapterSHA256') == _sha(observer), 'executed observer source differs from pin')
    corrected = _mapping(build.get('correctedBuild'), 'completed build record')
    _integer(corrected.get('exitCode'), 0, 0, 'CGAL build did not complete')
    directory = _relative(corrected.get('buildDirectory'))
    _need(corrected.get('sameSources') is True and
          str(PurePosixPath(executable_key).parent) == directory,
          'actual executable/build source binding')
    artifacts = _mapping(build.get('artifacts'), 'build artifacts')
    _need(0 < len(artifacts) <= 32, 'bounded build artifact inventory required')
    executable = _mapping(artifacts.get(executable_key), 'actual executable record')
    executable_sha = _digest(executable.get('sha256'))
    _integer(executable.get('bytes'), 1, MAX_DATA, 'actual executable byte count')
    _need(report.get('cgalExecutableSHA256') == executable_sha,
          'assessment executable differs from frozen completed build')
    _record(_mapping(artifacts.get('acquisition.json'), 'acquisition build record'),
            acquisition_bytes, 'actual acquisition record')
    versions = {}
    for row in _sequence(acquisition.get('pythonDistributions'), 32, 'acquired Python packages'):
        _mapping(row, 'acquired Python package')
        _need(type(row.get('name')) is str and type(row.get('version')) is str and
              row['name'] not in versions, 'acquired package identity')
        versions[row['name']] = row['version']
    packages = _mapping(report.get('packages'), 'executed library versions')
    _need(set(packages) == {'lib3mf', 'trimesh', 'numpy', 'networkx'} and
          all(versions.get(name) == value for name, value in packages.items()) and
          packages.get('lib3mf') == '2.5.0', 'unreviewed library/preservation profile')
    _need(report.get('role') == 'native library assessment, NOT Gate 1 qualification' and
          report.get('status') == 'ASSESSMENT_COMPLETE_NOT_QUALIFIED' and
          report.get('sourceAndEvidenceInputsUnchanged') is True and
          report.get('sourceIntentAndDeviation') ==
          'NOT_CERTIFIED; full-surface proof remains required', 'assessment is not complete/scoped')
    manifest_bytes = source_snapshot.blob(input_manifest_path, MAX_SMALL)
    _need(report.get('inputManifestSHA256') == _sha(manifest_bytes), 'assessment input-manifest identity')
    manifest = _mapping(_json(manifest_bytes, MAX_SMALL), 'input manifest')
    inputs = _mapping(manifest.get('inputs'), 'manifest input inventory')
    _record(_mapping(inputs.get('whole/receipt.json'), 'manifest whole receipt'),
            receipt_bytes, 'whole receipt')
    receipt_sha = _sha(receipt_bytes)
    _need(report.get('receiptSHA256') == receipt_sha, 'assessment/whole receipt identity')
    receipt = _mapping(_json(receipt_bytes, MAX_DATA), 'whole receipt')
    _need(receipt.get('status') == 'PASS' and receipt.get('ownedContextsRetired') is True and
          'sourcePins' in receipt and receipt['sourcePins'] == receipt.get('sourcePinsAfter'),
          'settled unchanged whole PASS required')
    producer = {name: receipt.get(name) for name in
                ('source', 'hostSource', 'acceptance', 'engineRevision')}
    _need(all(type(value) is str and value for value in producer.values()) and
          report.get('producer') == producer, 'exact whole producing tuple differs')
    expected_files = {}
    for artifact in _sequence(receipt.get('artifacts'), 256, 'whole artifacts'):
        _mapping(artifact, 'whole artifact')
        if artifact.get('format') != '3mf':
            continue
        filename = _filename(artifact.get('savedFile'))
        _need(filename not in expected_files, 'duplicate whole 3MF artifact')
        _integer(artifact.get('bytes'), 1, MAX_DATA, 'whole artifact bytes')
        _digest(artifact.get('sha256'))
        record = _mapping(inputs.get('whole/' + filename), 'manifest artifact')
        _need(record.get('sha256') == artifact['sha256'] and
              type(record.get('bytes')) is int and record['bytes'] == artifact['bytes'],
              'whole artifact/input-manifest binding')
        expected_files[filename] = artifact
    _need(0 < len(expected_files) <= MAX_FILES, 'bounded nonempty 3MF artifact roster required')
    files = _sequence(report.get('files'), MAX_FILES, 'assessment files')
    _need(len(files) == len(expected_files), 'complete actual assessment file roster differs')
    seen_files, index = set(), {}
    for file in files:
        _mapping(file, 'assessment file')
        filename = _filename(file.get('file'))
        _need(filename in expected_files and filename not in seen_files, 'assessment file identity')
        seen_files.add(filename)
        artifact = expected_files[filename]
        _need(file.get('sha256') == artifact['sha256'] and file.get('originalFileUnchanged') is True
              and file.get('sourceIntent') == 'NOT_CERTIFIED' and
              file.get('deviationCertificate') == 'NOT_CERTIFIED', 'artifact/source scope differs')
        package = _mapping(file.get('rawPackage'), 'raw package')
        _digest(package.get('xmlSHA256'))
        _need(package.get('unit') == 'millimeter', 'unsupported unit in reviewed observer profile')
        objects = _mapping(package.get('objects'), 'raw package objects')
        _need(0 < len(objects) <= MAX_OBJECTS, 'bounded object roster required')
        mesh_ids = set()
        for key, obj in objects.items():
            _mapping(obj, 'raw package object')
            object_id = _integer(obj.get('id'), 1, 2147483647, 'raw package object ID')
            _need(key == str(object_id) and obj.get('kind') in ('mesh', 'components'),
                  'unsupported raw object identity/kind')
            if obj['kind'] == 'mesh':
                mesh_ids.add(object_id)
        library = _mapping(file.get('lib3mf'), 'lib3mf content observation')
        _need(library.get('status') == 'PASS' and library.get('warnings') == [] and
              library.get('role') == 'package semantics; Float32 geometry is nonauthoritative' and
              library.get('version') == [2, 5, 0] and
              library.get('metadataReconciliation') == CONTENT_SCOPE and
              library.get('metadataPreserveSemantics') == PRESERVE_LIMIT and
              library.get('trianglePropertyReconciliation') == 'PASS',
              'scoped lib3mf content checks incomplete/nonpassing')
        conversion = library.get('maximumFloat32CoordinateChange')
        _need(type(conversion) in (int, float) and math.isfinite(conversion) and conversion >= 0,
              'Float32-view observation missing; it is not geometry authority')
        meshes = _sequence(file.get('meshes'), MAX_OBJECTS, 'actual mesh results')
        _need(len(meshes) == len(mesh_ids) and mesh_ids, 'complete raw object/mesh census required')
        seen_meshes = set()
        for mesh in meshes:
            object_id, row = _validate_mesh(snapshot, report_path, filename, package, mesh)
            _need(object_id in mesh_ids and object_id not in seen_meshes, 'duplicate/foreign mesh result')
            seen_meshes.add(object_id)
            row.update(artifactSHA256=artifact['sha256'], artifactBytes=artifact['bytes'])
            index[(filename, object_id)] = row
            if len(index) > 1024:
                raise EvidenceResourceLimit('complete mesh evidence census limit')
        _need(seen_meshes == mesh_ids, 'mesh evidence census differs')
    _need(seen_files == set(expected_files), 'incomplete actual artifact batch')
    provenance = {'evidenceCommit': evidence_commit, 'observerCommit': observer_commit,
        'buildSourceCommit': build_source_commit, 'assessmentSHA256': _sha(report_bytes),
        'buildCustodySHA256': _sha(build_bytes), 'acquisitionSHA256': _sha(acquisition_bytes),
        'observerSHA256': _sha(observer), 'cgalSourceSHA256': sources[SOURCE_CPP]['sha256'],
        'cgalCMakeSHA256': sources[SOURCE_CMAKE]['sha256'],
        'cgalExecutableSHA256': executable_sha,
        'executableProvenance': 'frozen completed build custody; not a fresh binary rehash',
        'inputManifestSHA256': _sha(manifest_bytes), 'receiptSHA256': receipt_sha,
        'producerSource': producer['source'], 'producerHostSource': producer['hostSource'],
        'producerAcceptance': producer['acceptance'], 'engineRevision': producer['engineRevision'],
        'completeBatchFiles': len(files), 'completeBatchMeshes': len(index)}
    return _BoundCGALAssessment(index, provenance, _ISSUER)
