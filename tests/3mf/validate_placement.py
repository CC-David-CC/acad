"""Independent fixture reader: placement/grouping evidence, not mesh qualification."""
import itertools
import sys
import xml.etree.ElementTree as ET
import zipfile

with zipfile.ZipFile(sys.argv[1]) as archive:
    root = ET.fromstring(archive.read('3D/3dmodel.model'))
ns = {'m': 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
assert root.attrib['unit'] == 'millimeter'
resources = root.find('m:resources', ns)
objects = {o.attrib['id']: o for o in resources.findall('m:object', ns)}
materials = resources.find('m:basematerials', ns).findall('m:base', ns)
assert [(m.attrib['name'], m.attrib['displaycolor']) for m in materials] == [('PLA', '#00FF00')]
identity = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]

def leaves(object_id, outer=()):
    obj = objects[object_id]
    mesh = obj.find('m:mesh', ns)
    if mesh is not None:
        assert obj.attrib['pindex'] == '0'
        points = []
        for vertex in mesh.find('m:vertices', ns):
            point = [float(vertex.attrib[k]) for k in ('x', 'y', 'z')]
            for matrix in outer:
                point = [sum(point[j] * matrix[j * 3 + k] for j in range(3)) + matrix[9 + k] for k in range(3)]
            points.append(tuple(point))
        return {obj.attrib['name']: set(points)}
    result = {}
    for component in obj.find('m:components', ns):
        matrix = [float(v) for v in component.attrib.get('transform', ' '.join(map(str, identity))).split()]
        children = leaves(component.attrib['objectid'], (matrix,) + outer)
        assert not result.keys() & children.keys()
        result.update(children)
    return result

builds = root.find('m:build', ns)
assert len(builds) == 2
groups = [leaves(item.attrib['objectid']) for item in builds]
assert [set(group) for group in groups] == [{'r1'}, {'r2', 'r3'}]
# Local Rz90 + (10,20,30), followed by authored Rx90 + (100,200,300).
assert groups[0]['r1'] == {(110-y, 170-z, 320+x) for x, y, z in itertools.product((0, 1), repeat=3)}
for name, offset in [('r2', 115), ('r3', 120)]:
    assert groups[1][name] == {(offset+x, 170+y, 320+z) for x, y, z in itertools.product((0, 1), repeat=3)}
print('Independent XML reader: three regions, two builds, noncommuting placements correct')
