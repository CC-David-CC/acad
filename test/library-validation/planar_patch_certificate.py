"""Indexed planar ownership, exact incidence and reviewed CGAL coverage.

SOURCE ONLY until Root's complete actual-artifact execution. No repair, fitted
reference or success fallback. Complete mesh validity, analytic wall/deviation
and authored source/material custody remain separate caller obligations.
"""
from collections import defaultdict
from fractions import Fraction as Q
import hashlib
import json
import math
from pathlib import Path
import struct
from types import MappingProxyType

from cylindrical_surface_certificate import (
    CertificateResourceLimit, bounded_number, squared_radius_range)
from planar_coverage import invoke_planar_coverage

MAX_VERTICES = 150000
MAX_TRIANGLES = 100000
MAX_BYTES = 8388608
MAX_CYLINDERS = 32
MAX_PATCHES = 32
MAX_EVIDENCE_BYTES = 8388608
INCIDENCE = Q(1e-6)
DEFLECTION = Q(.01)
CONFIG_KEYS = frozenset(('executable', 'expected_executable_sha256', 'cpp_source',
                         'build_source', 'output_dir'))


def _need(ok, reason):
    if not ok:
        raise ValueError('planar patch certificate: '+reason)


def _seq(value, minimum, maximum, name):
    _need(type(value) in (list, tuple), name+' must be a concrete list/tuple')
    if len(value) > maximum:
        raise CertificateResourceLimit('planar patch '+name+' count limit')
    _need(len(value) >= minimum, name+' count')
    return value


def _f64(value):
    _need(type(value) in (int, float), 'original finite binary64 numeric type')
    if type(value) is int:
        _need(value.bit_length() <= 1024, 'original binary64 integer range')
    try:
        result = float(value)
    except (OverflowError, ValueError):
        raise ValueError('planar patch certificate: original binary64 range')
    _need(math.isfinite(result), 'finite original binary64')
    _need(type(value) is float or int(result) == value, 'no rounded input integer')
    return result


def _cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2],
            a[0]*b[1]-a[1]*b[0])


def _delta(a, b):
    return tuple(a[i]-b[i] for i in range(3))


def _json_bytes(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'),
                       allow_nan=False)+'\n').encode('utf-8')


def _file_bytes(path, limit):
    with path.open('rb') as stream:
        value = stream.read(limit+1)
    if len(value) > limit:
        raise CertificateResourceLimit('planar evidence/source byte limit')
    return value


def _sha(value):
    return hashlib.sha256(value).hexdigest()


def _ids_sha(ids):
    digest = hashlib.sha256()
    for index in ids:
        digest.update(struct.pack('<Q', index))
    return digest.hexdigest()


def _thaw(value, budget):
    # Only the invoker's deeply immutable, already bounded evidence is copied.
    budget[0] += 1
    if budget[0] > 20000:
        raise CertificateResourceLimit('planar invocation evidence node limit')
    if type(value) in (dict, MappingProxyType):
        _need(all(type(k) is str for k in value), 'invocation evidence keys')
        return {k: _thaw(v, budget) for k, v in value.items()}
    if type(value) in (list, tuple):
        return [_thaw(v, budget) for v in value]
    _need(value is None or type(value) in (str, int, float, bool),
          'invocation evidence value type')
    return value


def _snapshot(vertices, triangles, labels, local_exact, frame):
    _seq(vertices, 1, MAX_VERTICES, 'vertices')
    _seq(triangles, 1, MAX_TRIANGLES, 'triangles')
    nv, nt = len(vertices), len(triangles)
    if 32+24*nv+12*nt > MAX_BYTES:
        raise CertificateResourceLimit('planar original decoded mesh byte limit')
    _seq(labels, nt, nt, 'labels')
    _seq(local_exact, nv, nv, 'exact local vertices')
    _need(type(frame) is dict and len(frame) == 4 and set(frame) == {'origin', 'x', 'y', 'z'},
          'actual source frame fields')
    _seq(frame['origin'], 3, 3, 'frame origin')
    origin = tuple(_f64(x) for x in frame['origin'])
    axes = []
    for key in ('x', 'y', 'z'):
        _seq(frame[key], 3, 3, 'frame axis')
        _need(all(type(x) is int and x in (-1, 0, 1) for x in frame[key]),
              'exact signed axis values')
        axes.append(tuple(frame[key]))
    _need(all(sum(x*x for x in a) == 1 for a in axes) and
          all(sum(a[j]*b[j] for j in range(3)) == 0
              for i, a in enumerate(axes) for b in axes[:i]) and
          _cross(axes[0], axes[1]) == axes[2], 'right-handed signed permutation')
    points, world = [], []
    raw_array = hashlib.sha256()
    for original, supplied in zip(vertices, local_exact):
        _seq(original, 3, 3, 'original vertex')
        _seq(supplied, 3, 3, 'exact local vertex')
        p = tuple(_f64(x) for x in original)
        d = tuple(Q(p[j])-Q(origin[j]) for j in range(3))
        exact = tuple(sum(d[j]*a[j] for j in range(3)) for a in axes)
        actual = tuple(bounded_number(x) for x in supplied)
        _need(actual == exact, 'supplied locals equal original-world exact transform')
        world.append(p)
        points.append(exact)
        raw_array.update(struct.pack('<ddd', *p))
    faces = []
    for tri in triangles:
        _seq(tri, 3, 3, 'triangle')
        _need(all(type(v) is int and 0 <= v < nv for v in tri) and
              len(set(tri)) == 3, 'original triangle indices')
        faces.append(tuple(tri))
        raw_array.update(struct.pack('<QQQ', *tri))
    _need(all(type(label) is str and 0 < len(label) <= 32 for label in labels),
          'bounded actual patch labels')
    detached_frame = {'origin': origin, 'x': axes[0], 'y': axes[1], 'z': axes[2]}
    return (tuple(world), tuple(faces), tuple(labels), tuple(points),
            detached_frame, raw_array.hexdigest())


def _source_support(e, cylinders, low, high):
    _need(type(e) is dict and len(e) <= 32 and type(e.get('kind')) is str and
          e['kind'] in ('rectangle', 'circle', 'annulus'), 'analytic source kind')
    low, high = bounded_number(low), bounded_number(high)
    _need(low < high, 'positive actual source interval')
    rectangle = e['kind'] == 'rectangle'
    support = {'kind': e['kind'], 'low': low, 'high': high}
    expected = []
    if rectangle:
        width, height = bounded_number(e['width']), bounded_number(e['height'])
        _need(width > 0 and height > 0, 'positive original rectangle lengths')
        support.update(width=width, height=height)
        _need(bounded_number(e.get('inner', 0)) == 0, 'rectangle cannot carry annular inner wall')
    else:
        outer = bounded_number(e['outer'])
        inner = bounded_number(e.get('inner', 0))
        _need(outer > 0 and 0 <= inner < outer and
              (inner > 0 if e['kind'] == 'annulus' else inner == 0),
              'actual circle/annulus radii')
        support.update(outer=outer, inner=inner)
        expected.append({'id': 'outer', 'c': (Q(0), Q(0)), 'r': outer,
                         'low': low, 'high': high, 'sign': 1, 'blind': False})
        if inner:
            expected.append({'id': 'inner', 'c': (Q(0), Q(0)), 'r': inner,
                             'low': low, 'high': high, 'sign': -1, 'blind': False})
    holes = _seq(e.get('holes', []), 0, MAX_CYLINDERS, 'authored holes')
    for i, hole in enumerate(holes):
        _need(type(hole) is dict and len(hole) == 4 and set(hole) == {'u', 'v', 'radius', 'depth'},
              'authored finite hole fields')
        center = (bounded_number(hole['u']), bounded_number(hole['v']))
        radius = bounded_number(hole['radius'])
        depth = None if hole['depth'] is None else bounded_number(hole['depth'])
        _need(radius > 0 and (depth is None or 0 < depth < high-low),
              'positive circle radius/interior blind depth')
        expected.append({'id': 'hole'+str(i), 'c': center, 'r': radius,
                         'low': low if depth is None else high-depth,
                         'high': high, 'sign': -1, 'blind': depth is not None})
    if len(expected) > MAX_CYLINDERS:
        raise CertificateResourceLimit('planar cylinder-role count limit')
    _seq(cylinders, len(expected), len(expected), 'actual cylinder support census')
    for actual, wanted in zip(cylinders, expected):
        _need(type(actual) is dict and len(actual) in (6, 7) and set(actual) in (
            {'id', 'c', 'r', 'low', 'high', 'sign'},
            {'id', 'c', 'r', 'low', 'high', 'sign', 'blind'}), 'cylinder support fields')
        _seq(actual['c'], 2, 2, 'cylinder center')
        _need(type(actual['id']) is str and actual['id'] == wanted['id'] and
              type(actual['sign']) is int and actual['sign'] == wanted['sign'] and
              type(actual.get('blind', False)) is bool and
              actual.get('blind', False) == wanted['blind'], 'actual source cylinder identity/role')
        _need(tuple(bounded_number(v) for v in actual['c']) == wanted['c'] and
              all(bounded_number(actual[k]) == wanted[k] for k in ('r', 'low', 'high')),
              'actual cylinder support equals authored source arithmetic')
    return support, {c['id']: c for c in expected}


def _specs(support, cylinders):
    low, high = support['low'], support['high']
    cap_outer = ('ymin', 'xmax', 'ymax', 'xmin') if support['kind'] == 'rectangle' else ('wall-outer',)
    negative = [c for c in cylinders.values() if c['sign'] == -1]
    specs = {
        'bottom': {'axis': 2, 'value': low, 'sign': -1, 'axes': (0, 1),
                   'outer': tuple(reversed(cap_outer)),
                   'holes': tuple(sorted('wall-'+c['id'] for c in negative if not c['blind']))},
        'top': {'axis': 2, 'value': high, 'sign': 1, 'axes': (0, 1),
                'outer': cap_outer,
                'holes': tuple(sorted('wall-'+c['id'] for c in negative))}}
    if support['kind'] == 'rectangle':
        specs.update({
            'xmin': {'axis': 0, 'value': Q(0), 'sign': -1, 'axes': (1, 2),
                     'outer': ('ymin', 'top', 'ymax', 'bottom'), 'holes': ()},
            'xmax': {'axis': 0, 'value': support['width'], 'sign': 1, 'axes': (1, 2),
                     'outer': ('bottom', 'ymax', 'top', 'ymin'), 'holes': ()},
            'ymin': {'axis': 1, 'value': Q(0), 'sign': -1, 'axes': (2, 0),
                     'outer': ('bottom', 'xmax', 'top', 'xmin'), 'holes': ()},
            'ymax': {'axis': 1, 'value': support['height'], 'sign': 1, 'axes': (2, 0),
                     'outer': ('xmin', 'top', 'xmax', 'bottom'), 'holes': ()}})
    for c in cylinders.values():
        if c['blind']:
            specs['floor-'+c['id']] = {
                'axis': 2, 'value': c['low'], 'sign': 1, 'axes': (0, 1),
                'outer': ('wall-'+c['id'],), 'holes': ()}
    if len(specs) > MAX_PATCHES:
        raise CertificateResourceLimit('planar patch invocation count limit')
    return specs


def _runs(values):
    result = []
    for value in values:
        if not result or result[-1] != value:
            result.append(value)
    if len(result) > 1 and result[0] == result[-1]:
        result.pop()
    return tuple(result)


def _cyclic_equal(actual, expected):
    return len(actual) == len(expected) and any(
        actual == expected[i:]+expected[:i] for i in range(len(expected)))


def _loops(records):
    # Actual selected-face use, actual opposite neighbor; no coordinate joining.
    outgoing, incoming = {}, {}
    for row in records:
        u, v = row[0], row[1]
        _need(u not in outgoing and v not in incoming, 'branched indexed patch boundary')
        outgoing[u], incoming[v] = row, u
    _need(outgoing and set(outgoing) == set(incoming), 'closed oriented patch boundary census')
    remaining, cycles = set(outgoing), []
    while remaining:
        start, at, ids, uses = min(remaining), min(remaining), [], []
        seen = set()
        while at not in seen:
            _need(at in remaining, 'boundary enters another indexed loop')
            seen.add(at)
            ids.append(at)
            row = outgoing[at]
            uses.append(row)
            at = row[1]
        _need(at == start and len(ids) >= 3, 'one simple original indexed loop')
        remaining.difference_update(ids)
        cycles.append({'ids': tuple(ids), 'uses': tuple(uses),
                       'runs': _runs([row[2] for row in uses])})
    return cycles


def _assign_loops(cycles, spec):
    outer = [c for c in cycles if _cyclic_equal(c['runs'], spec['outer'])]
    _need(len(outer) == 1, 'unique outer loop with exact expected adjacent roles')
    remaining = [c for c in cycles if c is not outer[0]]
    holes = []
    for role in spec['holes']:
        matches = [c for c in remaining if c['runs'] == (role,)]
        _need(len(matches) == 1, 'unique hole loop for actual '+role)
        holes.append(matches[0])
        remaining.remove(matches[0])
    _need(not remaining, 'no extra/missing/foreign patch boundary loops')
    return outer[0], holes


def _circle_edge(points, first, second, c):
    xy = [(points[v][0]-c['c'][0], points[v][1]-c['c'][1]) for v in (first, second)]
    # Exact endpoint incidence and full chord bound, not endpoint-only evidence.
    lower, upper = max(Q(0), c['r']-INCIDENCE), c['r']+INCIDENCE
    _need(all(lower*lower <= sum(q*q for q in p) <= upper*upper for p in xy),
          'actual indexed rim vertices on named source circle')
    minimum, _ = squared_radius_range([xy[0], xy[1], xy[1]])
    allowed = max(Q(0), c['r']-DEFLECTION-INCIDENCE)
    _need(minimum >= allowed*allowed, 'entire actual indexed circular rim chord bound')


def _plane_and_domain(points, faces, selected, spec, support, cylinders, cycles):
    axis, value, sign = spec['axis'], spec['value'], spec['sign']
    maximum, minimum_area = Q(0), None
    for face in selected:
        ps = [points[v] for v in faces[face]]
        deviation = max(abs(p[axis]-value) for p in ps)
        _need(deviation <= INCIDENCE, 'entire original triangle plane incidence')
        maximum = max(maximum, deviation)
        normal = _cross(_delta(ps[1], ps[0]), _delta(ps[2], ps[0]))
        _need(sign*normal[axis] > 0, 'original exact projected outward orientation')
        area = sign*normal[axis]
        minimum_area = area if minimum_area is None else min(minimum_area, area)
        _need(all(support['low']-INCIDENCE <= p[2] <= support['high']+INCIDENCE for p in ps),
              'complete original planar triangle finite axial range')
        if support['kind'] == 'rectangle':
            _need(all(-INCIDENCE <= p[0] <= support['width']+INCIDENCE and
                      -INCIDENCE <= p[1] <= support['height']+INCIDENCE for p in ps),
                  'complete original planar triangle finite rectangle range')
        else:
            _need(all(p[0]*p[0]+p[1]*p[1] <= (support['outer']+INCIDENCE)**2 for p in ps),
                  'complete original planar triangle finite outer disk')
    for cycle in cycles:
        for u, v, neighbor, _, _ in cycle['uses']:
            if neighbor.startswith('wall-'):
                # Closed analytic labels from the exact source inventory;
                # these are never opaque Native/source identity strings.
                _circle_edge(points, u, v, cylinders[neighbor[5:]])
    return {'axis': axis, 'valueExact': str(value), 'originalSign': sign,
            'incidenceBudgetExact': str(INCIDENCE),
            'maximumVertexDeviationExact': str(maximum),
            'minimumSignedProjectedDoubleAreaExact': str(minimum_area)}


def _loop_evidence(cycle, role):
    digest = hashlib.sha256()
    for u, v, neighbor, face, other in cycle['uses']:
        digest.update(struct.pack('<QQQQ', u, v, face, other))
        encoded = neighbor.encode('ascii')
        digest.update(struct.pack('<Q', len(encoded)))
        digest.update(encoded)
    return {'role': role, 'vertices': len(cycle['ids']),
            'orientedOriginalVertexIdsSha256': _ids_sha(cycle['ids']),
            'orientedActualEdgeOwnersSha256': digest.hexdigest(),
            'cyclicAdjacentRoles': list(cycle['runs'])}


def _support_evidence(support, cylinders):
    return {'kind': support['kind'],
            'quantitiesExact': {k: str(v) for k, v in support.items() if k != 'kind'},
            'cylinders': [{'id': c['id'], 'centerExact': [str(v) for v in c['c']],
                           'radiusExact': str(c['r']), 'lowExact': str(c['low']),
                           'highExact': str(c['high']), 'sign': c['sign'], 'blind': c['blind']}
                          for c in cylinders.values()]}


def _invocation_evidence(value, path):
    metadata = _thaw(value['metadata'], [0])
    expected = _json_bytes(metadata)
    _need(len(expected) <= 65536, 'bounded invocation metadata')
    raw = _file_bytes(path/'invocation.json', 65536)
    _need(raw == expected, 'exact actual invocation metadata file/return binding')
    report = value['report']
    captured = metadata['files']['capturedReport']
    if captured is not None:
        _need(captured['file'] == 'captured-report.json' and report is not None,
              'actual captured report identity')
        report_bytes = _file_bytes(path/'captured-report.json', 65536)
        _need(report_bytes == _json_bytes(_thaw(report, [0])) and
              len(report_bytes) == captured['bytes'] and
              _sha(report_bytes) == captured['sha256'], 'captured native report file/return binding')
    _need(metadata['status'] != 'PASS' or
          (report is not None and report['status'] == 'PASS' and captured is not None),
          'outer/native PASS agreement')
    return {'metadata': metadata, 'metadataFile': str(path/'invocation.json'),
            'metadataBytes': len(raw), 'metadataSha256': _sha(raw)}


def certify_planar_patches(vertices, triangles, labels, local_exact, frame, e,
                           cylinders, lo, hi, planar_config):
    """Actual indexed planar patches; see PLANAR-PATCH-CERTIFICATE.md.

    Config: executable/expected_executable_sha256/cpp_source/build_source/
    output_dir. The last is a NEW absolute owned parent directory. Every patch
    gets one fresh child, explicit indexed loops and one no-retry invocation.
    Require returned status PASS and complete True. A nonPASS native invocation
    stops the sequence, retaining its custody and any unsettled-owner record.
    """
    _need(type(planar_config) is dict and len(planar_config) == 5 and set(planar_config) == CONFIG_KEYS,
          'exact planar invocation configuration')
    destination = planar_config['output_dir']
    _need(type(destination) is str and 0 < len(destination) <= 4096 and
          '\0' not in destination and Path(destination).is_absolute(),
          'new absolute owned output directory')
    world, faces, names, points, detached_frame, arrays_sha = _snapshot(
        vertices, triangles, labels, local_exact, frame)
    support, cylinder_map = _source_support(e, cylinders, lo, hi)
    specs = _specs(support, cylinder_map)
    expected_labels = set(specs) | {'wall-'+name for name in cylinder_map}
    _need(set(names) == expected_labels, 'complete exact planar/wall source-role census')
    by_label, edges = defaultdict(list), defaultdict(list)
    for face, tri in enumerate(faces):
        by_label[names[face]].append(face)
        for i in range(3):
            u, v = tri[i], tri[(i+1) % 3]
            edge = edges[tuple(sorted((u, v)))]
            _need(len(edge) < 2, 'original indexed edge has at most two uses')
            edge.append((face, u, v))
    adjacency = [[] for _ in faces]
    boundary = defaultdict(list)
    for uses in edges.values():
        _need(len(uses) == 2 and uses[0][1:] == uses[1][1:][::-1],
              'complete original indexed shell opposite edge uses')
        a, b = uses
        if names[a[0]] == names[b[0]]:
            adjacency[a[0]].append(b[0])
            adjacency[b[0]].append(a[0])
        else:
            for own, other in ((a, b), (b, a)):
                if names[own[0]] in specs:
                    boundary[names[own[0]]].append(
                        (own[1], own[2], names[other[0]], own[0], other[0]))
    prepared = []
    for label in sorted(specs):
        selected, spec = by_label[label], specs[label]
        reached, pending = set(), [selected[0]]
        while pending:
            face = pending.pop()
            if face not in reached:
                reached.add(face)
                pending.extend(v for v in adjacency[face] if v not in reached)
        _need(len(reached) == len(selected), 'one complete connected actual planar patch')
        cycles = _loops(boundary[label])
        outer, holes = _assign_loops(cycles, spec)
        plane = _plane_and_domain(points, faces, selected, spec, support, cylinder_map, cycles)
        prepared.append((label, selected, spec, outer, holes, plane))
    # Finish all source/ownership/plane checks before starting any child.
    output = Path(destination)
    output.mkdir(mode=0o700, parents=False, exist_ok=False)
    source = Path(__file__).resolve()
    source_before = _sha(_file_bytes(source, 131072))
    result = {'version': 1, 'scope': 'indexed-planar-patch-incidence-and-exact-projected-coverage',
              'status': 'ERROR', 'reason': 'NOT_COMPLETED', 'complete': False,
              'rawArraySha256': arrays_sha, 'labelsSha256': _sha(_json_bytes(names)),
              'vertices': len(world), 'triangles': len(faces),
              'sourceFrame': detached_frame,
              'analyticSupport': _support_evidence(support, cylinder_map),
              'expectedPatches': len(prepared), 'attemptedPatches': 0,
              'helperSource': {'sha256Before': source_before, 'sha256After': None},
              'limits': {'cylinders': MAX_CYLINDERS, 'planarPatches': MAX_PATCHES,
                         'evidenceBytes': MAX_EVIDENCE_BYTES},
              'sourceBinding': 'CALLER_REQUIRED', 'globalMeshValidity': 'CALLER_REQUIRED',
              'analyticWallAndDisplacement': 'CALLER_REQUIRED', 'patches': []}
    for index, (label, selected, spec, outer, holes, plane) in enumerate(prepared):
        child = output/('patch-'+str(index).zfill(2)+'-'+label)
        actual = invoke_planar_coverage(
            executable=planar_config['executable'],
            expected_executable_sha256=planar_config['expected_executable_sha256'],
            cpp_source=planar_config['cpp_source'], build_source=planar_config['build_source'],
            vertices=world, triangles=faces, selected_triangle_ids=selected,
            frame=detached_frame, projection_axes=spec['axes'], orientation=spec['sign'],
            outer={'kind': 'indexed', 'vertexIds': outer['ids']},
            holes=[{'kind': 'indexed', 'vertexIds': h['ids']} for h in holes],
            output_dir=str(child))
        invocation = _invocation_evidence(actual, child)
        row = {'label': label, 'selectedTriangles': len(selected),
               'originalSelectedIdsSha256': _ids_sha(selected), 'plane': plane,
               'projectionAxes': list(spec['axes']), 'originalSign': spec['sign'],
               'loops': [_loop_evidence(outer, 'outer')] +
                        [_loop_evidence(h, role) for h, role in zip(holes, spec['holes'])],
               'invocation': invocation}
        result['patches'].append(row)
        result['attemptedPatches'] += 1
        metadata = invocation['metadata']
        if metadata['status'] != 'PASS':
            result.update(status=metadata['status'], reason=metadata['reason'])
            break
    else:
        result.update(status='PASS', reason='ALL_EXPECTED_INDEXED_PLANAR_PATCHES', complete=True)
    after = _sha(_file_bytes(source, 131072))
    result['helperSource']['sha256After'] = after
    if after != source_before:
        result.update(status='CUSTODY_CHANGED', reason='PATCH_HELPER_SOURCE_CHANGED', complete=False)
    raw = _json_bytes(result)
    if len(raw) > MAX_EVIDENCE_BYTES:
        raise CertificateResourceLimit('planar aggregate evidence byte limit')
    target = output/'patch-certificate.json'
    with target.open('xb') as stream:
        stream.write(raw)
    return dict(result, evidenceFile=str(target), evidenceBytes=len(raw), evidenceSha256=_sha(raw))
