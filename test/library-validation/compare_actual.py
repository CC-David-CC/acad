#!/usr/bin/env python3
"""Read-only native library assessment of a settled whole's actual 3MF exports.

This is an assessment report, never a replacement Gate 1 qualification oracle.
No fixture geometry construction, repair, welding, reindexing or output rewriting.
"""
import argparse
import collections
import hashlib
import importlib.metadata
import json
import math
from pathlib import Path, PurePosixPath
import platform
import resource
import struct
import subprocess
import sys
import time
import traceback
import xml.etree.ElementTree as ET
import zipfile

NS = {'m': 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
IDENTITY = [1., 0., 0., 0., 1., 0., 0., 0., 1., 0., 0., 0.]
MAX_FILE = 128 * 1024 * 1024
MAX_ARRAY = 8 * 1024 * 1024
MAX_VERTICES, MAX_TRIANGLES = 150000, 100000


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def check(condition, reason):
    if not condition:
        raise ValueError(reason)


def transform(element):
    tokens = element.attrib.get('transform', '').split()
    values = list(map(float, tokens)) if tokens else IDENTITY.copy()
    check(len(values) == 12 and all(map(math.isfinite, values)), 'invalid transform')
    return values


def raw_model(path):
    check(path.stat().st_size <= MAX_FILE, 'archive size limit')
    with zipfile.ZipFile(path) as archive:
        entries = archive.infolist()
        check(len(entries) <= 256, 'archive entry limit')
        check(len({e.filename for e in entries}) == len(entries), 'duplicate ZIP entry')
        check(sum(e.file_size for e in entries) <= MAX_FILE, 'archive expansion limit')
        check(all(not PurePosixPath(e.filename).is_absolute() and
                  '..' not in PurePosixPath(e.filename).parts for e in entries),
              'unsafe ZIP name')
        check(archive.testzip() is None, 'ZIP CRC failure')
        xml = archive.read('3D/3dmodel.model')
    check(b'<!DOCTYPE' not in xml.upper() and b'<!ENTITY' not in xml.upper(), 'XML entities')
    root = ET.fromstring(xml)
    check(root.tag == '{' + NS['m'] + '}model', 'unsupported model namespace')
    objects, materials, meshes = {}, {}, {}
    raw_charge = 0
    for obj in root.findall('m:resources/m:object', NS):
        identity = int(obj.attrib['id'])
        check(identity > 0 and identity not in objects, 'duplicate/invalid object ID')
        row = {'id': identity, 'name': obj.attrib.get('name', ''),
               'type': obj.attrib.get('type', 'model')}
        mesh = obj.find('m:mesh', NS)
        if mesh is not None:
            tokens = [[v.attrib[k] for k in ('x', 'y', 'z')]
                      for v in mesh.findall('m:vertices/m:vertex', NS)]
            vertices = [list(map(float, v)) for v in tokens]
            faces = [[int(t.attrib[k]) for k in ('v1', 'v2', 'v3')]
                     for t in mesh.findall('m:triangles/m:triangle', NS)]
            check(0 < len(vertices) <= MAX_VERTICES and 0 < len(faces) <= MAX_TRIANGLES,
                  'raw mesh count limit')
            raw_charge += 24 * (len(vertices) + len(faces))
            check(raw_charge <= MAX_ARRAY, 'aggregate raw array budget')
            check(all(math.isfinite(v) for p in vertices for v in p), 'nonfinite vertex')
            check(all(0 <= i < len(vertices) for f in faces for i in f), 'index range')
            props = [{k: int(v) for k, v in t.attrib.items() if k not in ('v1', 'v2', 'v3')}
                     for t in mesh.findall('m:triangles/m:triangle', NS)]
            row.update(kind='mesh', vertices=len(vertices), triangles=len(faces),
                       propertyId=int(obj.attrib.get('pid', 0)),
                       propertyIndex=int(obj.attrib.get('pindex', 0)),
                       hasPid='pid' in obj.attrib, hasPindex='pindex' in obj.attrib)
            meshes[identity] = {'tokens': tokens, 'vertices': vertices, 'faces': faces,
                                'triangleProperties': props}
        else:
            components = obj.findall('m:components/m:component', NS)
            check(components, 'unsupported nonmesh/noncomponents object')
            row.update(kind='components', components=[
                {'objectId': int(c.attrib['objectid']), 'transform': transform(c)}
                for c in components])
        objects[identity] = row
    check(len(objects) <= 512, 'object count limit')
    for group in root.findall('m:resources/m:basematerials', NS):
        identity = int(group.attrib['id'])
        check(identity not in objects and identity not in materials, 'resource ID collision')
        materials[identity] = [dict(b.attrib) for b in group.findall('m:base', NS)]
    builds = [{'objectId': int(b.attrib['objectid']), 'transform': transform(b)}
              for b in root.findall('m:build/m:item', NS)]
    check(0 < len(builds) <= 256, 'build count limit')

    visited_instances = 0
    def visit(identity, stack):
        nonlocal visited_instances
        visited_instances += 1
        check(visited_instances <= 4096, 'component instance traversal limit')
        check(identity in objects and identity not in stack, 'missing/cyclic component')
        check(len(stack) < 64, 'component depth limit')
        for c in objects[identity].get('components', []):
            visit(c['objectId'], stack + [identity])
    for build in builds:
        visit(build['objectId'], [])
    metadata = [{ 'name': n.attrib.get('name'), 'value': n.text or '' }
                for n in root.findall('m:metadata', NS)]
    return {'xmlSHA256': sha(xml), 'unit': root.attrib.get('unit', 'millimeter'),
            'objects': objects, 'materials': materials, 'builds': builds,
            'metadata': metadata}, meshes


def array_hash(vertices, faces):
    return sha(b''.join(struct.pack('<ddd', *p) for p in vertices) +
               b''.join(struct.pack('<QQQ', *f) for f in faces))


def raw_topology(vertices, faces):
    edges, links = collections.defaultdict(list), collections.defaultdict(list)
    for face_id, (a, b, c) in enumerate(faces):
        for u, v in ((a, b), (b, c), (c, a)):
            edges[tuple(sorted((u, v)))].append((u, v, face_id))
        for v, a, b in ((a, b, c), (b, c, a), (c, a, b)):
            links[v].append((a, b))
    bad_edges = [list(e) for e, uses in edges.items() if len(uses) != 2 or
                 uses[0][:2] != uses[1][:2][::-1]]
    bad_links = []
    for vertex, pairs in links.items():
        graph = collections.defaultdict(list)
        for a, b in pairs:
            graph[a].append(b)
            graph[b].append(a)
        reached, pending = set(), [next(iter(graph))]
        while pending:
            node = pending.pop()
            if node not in reached:
                reached.add(node)
                pending.extend(graph[node])
        if len(reached) != len(graph) or any(len(n) != 2 for n in graph.values()):
            bad_links.append(vertex)
    return {'status': 'PASS' if not bad_edges and not bad_links else 'FAIL',
            'edges': len(edges), 'badEdgeCount': len(bad_edges), 'badEdgesFirst16': bad_edges[:16],
            'badVertexLinkCount': len(bad_links), 'badVertexLinksFirst16': bad_links[:16],
            'unusedVertices': len(vertices) - len(links),
            'eulerCharacteristic': len(links) - len(edges) + len(faces)}


def lib3mf_assessment(path, raw, meshes):
    import lib3mf
    wrapper = lib3mf.get_wrapper()
    model, reader = wrapper.CreateModel(), None
    result = {'role': 'package semantics; Float32 geometry is nonauthoritative',
              'version': list(wrapper.GetLibraryVersion())}
    try:
        reader = model.QueryReader('3mf')
        reader.SetStrictModeActive(True)
        reader.ReadFromFile(str(path))
        # API package IDs/PropertyIDs are not XML model IDs/positional indices.
        # Retain actual namespaces; reconcile enumerations, never add an offset.
        observed = {'resources': [], 'materials': [], 'objects': [], 'builds': []}
        result['observations'] = observed
        resources_by_unique, resources_by_model = {}, {}
        iterator = model.GetResources()
        while iterator.MoveNext():
            resource = iterator.GetCurrent()
            entry = {'uniqueId': resource.GetUniqueResourceID(),
                     'modelId': resource.GetModelResourceID(),
                     'part': resource.PackagePart().GetPath()}
            observed['resources'].append(entry)
            check(len(observed['resources']) <= 1024, 'library resource census limit')
            check(entry['part'].lstrip('/') == '3D/3dmodel.model',
                  'unassessed resource in another model part')
            check(entry['uniqueId'] not in resources_by_unique and
                  entry['modelId'] not in resources_by_model, 'duplicate resource identity')
            resources_by_unique[entry['uniqueId']] = entry
            resources_by_model[entry['modelId']] = entry
        check(set(resources_by_model) == set(raw['objects']) | set(raw['materials']),
              'unsupported or differing resource roster')
        property_indices, groups = {}, []
        for identity, expected in raw['materials'].items():
            unique_id = resources_by_model[identity]['uniqueId']
            group = model.GetBaseMaterialGroupByID(unique_id)
            property_ids = list(group.GetAllPropertyIDs())
            material_row = {'id': identity, 'uniqueId': unique_id, 'propertyIds': property_ids}
            observed['materials'].append(material_row)
            check(group.GetCount() == len(expected) == len(property_ids) and
                  len(set(property_ids)) == len(property_ids), 'material enumeration differs')
            property_indices[unique_id] = {pid: i for i, pid in enumerate(property_ids)}
            names = [group.GetName(pid) for pid in property_ids]
            colors = []
            for pid in property_ids:
                color = group.GetDisplayColor(pid)
                colors.append([color.Red, color.Green, color.Blue, color.Alpha])
            material_row.update(names=names, colorsRGBA=colors)
            check(names == [m['name'] for m in expected], 'material names differ')
            for actual, material in zip(colors, expected):
                token = material['displaycolor'].lstrip('#')
                check(actual == list(bytes.fromhex(token + ('FF' if len(token) == 6 else ''))),
                      'material appearance differs')
            groups.append(material_row)

        def material_reference(unique_id, property_id):
            if unique_id == 0:
                return (0, property_id)
            return (resources_by_unique[unique_id]['modelId'],
                    property_indices[unique_id][property_id])

        objects = []
        maximum_conversion = 0.
        iterator = model.GetObjects()
        while iterator.MoveNext():
            obj = iterator.GetCurrentObject()
            identity = obj.GetModelResourceID()
            expected = raw['objects'][identity]
            row = {'id': identity, 'uniqueId': obj.GetUniqueResourceID(), 'name': obj.GetName()}
            observed['objects'].append(row)
            check(row['name'] == expected['name'], 'library object name differs')
            if obj.IsMeshObject():
                check(expected['kind'] == 'mesh', 'library object kind differs')
                check(obj.GetVertexCount() == expected['vertices'] and
                      obj.GetTriangleCount() == expected['triangles'], 'library counts differ')
                pid, index, has_prop = obj.GetObjectLevelProperty()
                row['observedObjectProperty'] = {'uniqueId': pid, 'propertyId': index,
                                                'hasProperty': has_prop}
                check(has_prop == expected['hasPid'], 'library object-property presence differs')
                if has_prop:
                    mapped = material_reference(pid, index)
                    row['observedObjectProperty']['xmlReference'] = list(mapped)
                    check(mapped == (expected['propertyId'], expected['propertyIndex']),
                          'library material assignment differs')
                for i, p in enumerate(meshes[identity]['vertices']):
                    converted = obj.GetVertex(i).Coordinates
                    check(all(float(converted[k]) == struct.unpack('<f', struct.pack('<f', p[k]))[0]
                              for k in range(3)), 'unexpected coordinate conversion')
                    maximum_conversion = max(maximum_conversion,
                                             *(abs(converted[k]-p[k]) for k in range(3)))
                for i, face in enumerate(meshes[identity]['faces']):
                    check(list(obj.GetTriangle(i).Indices) == face, 'library face order differs')
                    prop = obj.GetTriangleProperties(i)
                    authored = meshes[identity]['triangleProperties'][i]
                    first = authored.get('p1', expected['propertyIndex'])
                    mapped = [material_reference(prop.ResourceID, pid) for pid in prop.PropertyIDs]
                    check(mapped == [(authored.get('pid', expected['propertyId']), p)
                                     for p in [first, authored.get('p2', first),
                                               authored.get('p3', first)]],
                          'library triangle material association differs')
                row.update(kind='mesh', vertices=obj.GetVertexCount(),
                           triangles=obj.GetTriangleCount(), propertyId=pid,
                           propertyIndex=index, hasObjectProperty=has_prop)
            else:
                check(obj.IsComponentsObject() and expected['kind'] == 'components',
                      'library object kind differs')
                children = []
                check(obj.GetComponentCount() == len(expected['components']), 'component count differs')
                for i, child in enumerate(expected['components']):
                    component = obj.GetComponent(i)
                    values = [float(v) for col in component.GetTransform().Fields for v in col]
                    check(component.GetObjectResource().GetModelResourceID() == child['objectId'],
                          'component target differs')
                    check(values == [struct.unpack('<f', struct.pack('<f', v))[0]
                                     for v in child['transform']], 'component placement differs')
                    children.append({'objectId': child['objectId'], 'transformFloat32': values})
                row.update(kind='components', components=children)
            objects.append(row)
        check({o['id'] for o in objects} == set(raw['objects']), 'library resource set differs')
        builds = []
        iterator = model.GetBuildItems()
        while iterator.MoveNext():
            item = iterator.GetCurrent()
            builds.append({'objectId': item.GetObjectResource().GetModelResourceID(),
                           'transform': [float(v) for col in item.GetObjectTransform().Fields for v in col]})
        observed['builds'] = builds
        check(len(builds) == len(raw['builds']), 'library build count differs')
        for actual, expected in zip(builds, raw['builds']):
            check(actual['objectId'] == expected['objectId'] and actual['transform'] ==
                  [struct.unpack('<f', struct.pack('<f', v))[0] for v in expected['transform']],
                  'library build target/placement differs')
        check(raw['unit'] == 'millimeter' and model.GetUnit() == lib3mf.ModelUnit.MilliMeter,
              'unassessed unit conversion')
        group = model.GetMetaDataGroup()
        observed_metadata = []
        for i in range(group.GetMetaDataCount()):
            entry = group.GetMetaData(i)
            namespace, name = entry.GetNameSpace(), entry.GetName()
            observed_metadata.append({'name': namespace+':'+name if namespace else name,
                                      'value': entry.GetValue()})
        observed['metadata'] = observed_metadata
        check(collections.Counter((m['name'], m['value']) for m in observed_metadata) ==
              collections.Counter((m['name'], m['value']) for m in raw['metadata']),
              'library metadata differs from raw package')
        result.update(status='PASS', objects=objects, builds=builds, materials=groups,
                      maximumFloat32CoordinateChange=maximum_conversion,
                      metadataReconciliation='PASS', trianglePropertyReconciliation='PASS')
    except Exception as error:
        result.update(status='UNCERTAIN', error=repr(error), traceback=traceback.format_exc())
    if reader is not None:
        result['warnings'] = [list(reader.GetWarning(i)) for i in range(reader.GetWarningCount())]
        if result.get('status') == 'PASS' and result['warnings']:
            result['status'] = 'UNCERTAIN'
    return result


def trimesh_assessment(vertices, faces):
    import networkx as nx
    import numpy as np
    import trimesh
    points = np.array(vertices, dtype='<f8')
    triangles = np.array(faces, dtype='<i8')
    expected = points.tobytes() + triangles.tobytes()
    mesh = trimesh.Trimesh(vertices=points, faces=triangles, process=False, validate=False)
    def component_count():
        graph = nx.Graph()
        graph.add_nodes_from(range(len(faces)))
        graph.add_edges_from(mesh.face_adjacency)
        return nx.number_connected_components(graph)
    measurements = {}
    for key, query in [('watertight', lambda: bool(mesh.is_watertight)),
                       ('windingConsistent', lambda: bool(mesh.is_winding_consistent)),
                       ('eulerCharacteristic', lambda: int(mesh.euler_number)),
                       ('faceConnectedComponents', component_count),
                       ('bounds', lambda: mesh.bounds.tolist()),
                       ('signedVolume', lambda: float(mesh.volume))]:
        measurements[key] = query()
        check(mesh.vertices.tobytes() + mesh.faces.tobytes() == expected,
              'Trimesh mutated raw array identity during '+key)
        check(points.tobytes() + triangles.tobytes() == expected,
              'Trimesh mutated constructor inputs during '+key)
    return {'status': 'PASS' if measurements['watertight'] and measurements['windingConsistent']
            else 'FAIL', 'measurements': measurements, 'arrayBitsAndIndicesUnchanged': True,
            'selfIntersection': 'NOT_RUN; CGAL responsibility',
            'sourceIntentAndDeviation': 'NOT_CERTIFIED'}


def cgal_assessment(executable, vertices, faces, directory):
    lines = [f'{len(vertices)} {len(faces)}']
    lines.extend(' '.join(struct.pack('>d', v).hex() for v in p) for p in vertices)
    lines.extend(' '.join(map(str, f)) for f in faces)
    data = ('\n'.join(lines)+'\n').encode('ascii')
    (directory/'cgal-input.txt').write_bytes(data)
    start = time.monotonic()
    child = subprocess.run([str(executable)], input=data, capture_output=True, timeout=120)
    (directory/'cgal-stdout.json').write_bytes(child.stdout)
    (directory/'cgal-stderr.txt').write_bytes(child.stderr)
    check(len(child.stdout) <= 65536, 'CGAL report size limit')
    return {'exitCode': child.returncode, 'wallSeconds': time.monotonic()-start,
            'inputSHA256': sha(data), 'report': json.loads(child.stdout)}


def run(args):
    receipt_path = args.whole/'receipt.json'
    receipt_bytes = receipt_path.read_bytes()
    receipt = json.loads(receipt_bytes)
    check(receipt['status'] == 'PASS' and receipt['ownedContextsRetired'] and
          receipt['sourcePins'] == receipt['sourcePinsAfter'], 'requires settled unchanged wholePASS')
    input_manifest_bytes = args.inputs.read_bytes()
    inventory = json.loads(input_manifest_bytes)
    check(sha(receipt_bytes) == inventory['inputs']['whole/receipt.json']['sha256'],
          'whole receipt custody mismatch')
    args.output.mkdir(exist_ok=False)
    executable_hash = sha(args.cgal.read_bytes())
    report = {'role': 'native library assessment, NOT Gate 1 qualification',
              'status': 'INCOMPLETE', 'receiptSHA256': sha(receipt_bytes),
              'producer': {k: receipt[k] for k in ('source', 'hostSource', 'acceptance', 'engineRevision')},
              'python': sys.version, 'platform': platform.platform(),
              'packages': {n: importlib.metadata.version(n) for n in ('lib3mf','trimesh','numpy','networkx')},
              'adapterSHA256': sha(Path(__file__).read_bytes()), 'cgalExecutableSHA256': executable_hash,
              'inputManifestSHA256': sha(input_manifest_bytes),
              'sourceIntentAndDeviation': 'NOT_CERTIFIED; full-surface proof remains required',
              'files': []}
    try:
        artifacts = [a for a in receipt['artifacts'] if a['format'] == '3mf']
        check(len(artifacts) == 6, 'this invocation requires complete six-export extent batch')
        for artifact in artifacts:
            path = args.whole/artifact['savedFile']
            check(path.parent == args.whole, 'unsupported nonlocal artifact path')
            before = path.read_bytes()
            expected = inventory['inputs']['whole/'+artifact['savedFile']]
            check(sha(before) == expected['sha256'] == artifact['sha256'] and
                  len(before) == expected['bytes'] == artifact['bytes'], 'artifact custody mismatch')
            start = time.monotonic()
            row = {'file': artifact['savedFile'], 'sha256': sha(before), 'meshes': [],
                   'sourceIntent': 'NOT_CERTIFIED', 'deviationCertificate': 'NOT_CERTIFIED'}
            report['files'].append(row)
            raw, meshes = raw_model(path)
            row['rawPackage'] = raw
            row['lib3mf'] = lib3mf_assessment(path, raw, meshes)
            for identity, mesh in meshes.items():
                vertices, faces = mesh['vertices'], mesh['faces']
                digest = array_hash(vertices, faces)
                directory = args.output/(path.stem+'-mesh-'+str(identity))
                directory.mkdir()
                (directory/'raw-inventory.json').write_text(json.dumps(mesh, allow_nan=False)+'\n')
                result = {'objectId': identity, 'rawArraySHA256': digest,
                          'rawTopology': raw_topology(vertices, faces),
                          'trimesh': trimesh_assessment(vertices, faces),
                          'cgal': cgal_assessment(args.cgal, vertices, faces, directory)}
                check(digest == array_hash(vertices, faces), 'adapter mutated original arrays')
                row['meshes'].append(result)
            check(path.read_bytes() == before, 'original exported file changed')
            row.update(originalFileUnchanged=True, wallSeconds=time.monotonic()-start)
        check(executable_hash == sha(args.cgal.read_bytes()), 'CGAL executable changed')
        check(report['adapterSHA256'] == sha(Path(__file__).read_bytes()), 'adapter source changed')
        check(receipt_path.read_bytes() == receipt_bytes and
              args.inputs.read_bytes() == input_manifest_bytes, 'evidence inputs changed')
        report['sourceAndEvidenceInputsUnchanged'] = True
        report['status'] = 'ASSESSMENT_COMPLETE_NOT_QUALIFIED'
    except Exception as error:
        report.update(status='ASSESSMENT_FAILED', error=repr(error), traceback=traceback.format_exc())
        raise
    finally:
        report['peakProcessRSSKiB'] = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        report['peakChildRSSKiB'] = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
        (args.output/'report.json').write_text(json.dumps(report, indent=2, allow_nan=False)+'\n')
        print(json.dumps({'status': report['status'], 'files':len(report['files']),
                          'report':str(args.output/'report.json')}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('whole', type=Path)
    parser.add_argument('inputs', type=Path)
    parser.add_argument('cgal', type=Path)
    parser.add_argument('output', type=Path)
    run(parser.parse_args())
