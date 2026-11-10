"""Proposed exact finite-cylinder wall certificate; SOURCE ONLY, UNQUALIFIED.

General analytic-support adapter, not a CAD geometry generator. Every original
vertex/index is retained. Whole-mesh CGAL validity and source/patch assignment
remain separate prerequisites, not submitted boolean flags. Independent review
is required before this source can replace any acceptance predicate.
"""
from collections import Counter, defaultdict
from fractions import Fraction as Q
import math


class CertificateResourceLimit(RuntimeError):
    """Input/work domain exceeded; does not assert invalid geometry."""


def bounded_number(value):
    # All represented binary64 values and exact signed-permutation differences
    # of two such values fit these dyadic bounds. No arbitrary rational source.
    if type(value) is float:
        require(math.isfinite(value), 'nonfinite numeric input')
    elif type(value) is int:
        if value.bit_length() > 2100:
            raise CertificateResourceLimit('integer input bit limit')
    elif type(value) is Q:
        n, d = value.numerator, value.denominator
        if n.bit_length() > 2100 or d.bit_length() > 1075 or d & (d-1):
            raise CertificateResourceLimit('exact input must be a bounded represented dyadic')
    else:
        raise ValueError('cylindrical surface certificate: unsupported numeric input type')
    return Q(value)


def bounded_declared_budget(value):
    # Declared tolerances may be exact decimal rationals, unlike represented
    # geometry. Keep the same bit bounds, without rounding either budget.
    if type(value) is Q:
        if value.numerator.bit_length() > 2100 or value.denominator.bit_length() > 1075:
            raise CertificateResourceLimit('declared budget rational input bit limit')
        return value
    return bounded_number(value)


def bounded_sequence(value, maximum, label):
    require(type(value) in (list, tuple), label+' must be a bounded concrete sequence')
    if len(value) > maximum:
        raise CertificateResourceLimit(label+' count limit')
    return value


def require(condition, reason):
    if not condition:
        raise ValueError('cylindrical surface certificate: '+reason)


def cross2(a, b):
    return a[0]*b[1]-a[1]*b[0]


def sub(a, b):
    return tuple(x-y for x, y in zip(a, b))


def cross3(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2],
            a[0]*b[1]-a[1]*b[0])


def squared_radius_range(points):
    """Exact extrema over the ENTIRE projected convex triangle, not samples."""
    signs = [cross2(a, b) for a, b in zip(points, points[1:]+points[:1])]
    area = sum(signs)
    if area and (all(s >= 0 for s in signs) or all(s <= 0 for s in signs)):
        minimum = Q(0)
    else:
        distances = []
        for a, b in zip(points, points[1:]+points[:1]):
            delta = sub(b, a)
            den = sum(v*v for v in delta)
            t = max(Q(0), min(Q(1), -sum(x*y for x, y in zip(a, delta))/den)) if den else Q(0)
            distances.append(sum((a[k]+t*delta[k])**2 for k in range(2)))
        minimum = min(distances)
    return minimum, max(sum(x*x for x in p) for p in points)


def winding(points):
    """Exact signed ray crossing; refuse edges containing the ray origin."""
    result = 0
    for a, b in zip(points, points[1:]+points[:1]):
        require(a != (0, 0), 'zero winding vector')
        turn = cross2(a, b)
        require(turn != 0 or sum(x*y for x, y in zip(a, b)) > 0,
                'winding edge passes through origin')
        if a[1] <= 0 < b[1] and turn > 0:
            result += 1
        elif b[1] <= 0 < a[1] and turn < 0:
            result -= 1
    return result


def radial_error_squared_within(rho_squared, radius, allowance_squared):
    """Prove (sqrt(rho_squared)-radius)^2 <= allowance_squared exactly."""
    if allowance_squared < 0 or rho_squared < 0:
        return False
    left = rho_squared+radius*radius-allowance_squared
    return left <= 0 or left*left <= 4*radius*radius*rho_squared


def certify_full_cylinder(vertices, triangles, triangle_ids, center, radius,
                          low, high, orientation, deflection, plane_incidence):
    """Proposed complete cylindrical-annulus projection/distance certificate.

    Coordinates may be Fractions so an exact frame conversion need not round.
    Two constant-Z actual rims may differ from source endpoints within incidence.
    Radial projection plus an affine axial map must cover the finite target once
    within the original Euclidean deflection budget. No welding or mesh repair.
    """
    bounded_sequence(vertices, 150000, 'vertices')
    bounded_sequence(triangles, 100000, 'triangles')
    bounded_sequence(triangle_ids, 100000, 'wall face IDs')
    bounded_sequence(center, 2, 'center')
    if 32+24*len(vertices)+12*len(triangles) > 8388608:
        raise CertificateResourceLimit('original decoded mesh byte limit')
    radius, low, high = map(bounded_number, (radius, low, high))
    epsilon, incidence = map(bounded_declared_budget, (deflection, plane_incidence))
    center = tuple(map(bounded_number, center))
    require(len(center) == 2 and radius > 0 and high > low and epsilon > 0 and
            incidence >= 0 and type(orientation) is int and orientation in (-1, 1),
            'invalid support/budget')
    ids = list(triangle_ids)
    require(all(type(i) is int and 0 <= i < len(triangles) for i in ids), 'face index')
    require(0 < len(ids) <= 100000 and len(set(ids)) == len(ids), 'face census')
    for i in ids:
        tri = bounded_sequence(triangles[i], 3, 'triangle')
        require(len(tri) == 3 and
                all(type(v) is int and 0 <= v < len(vertices) for v in tri) and
                len(set(tri)) == 3, 'original vertex indices')
    used_vertices = {v for i in ids for v in triangles[i]}
    for v in used_vertices:
        bounded_sequence(vertices[v], 3, 'vertex')
        require(len(vertices[v]) == 3, 'vertex arity')
    points = {v: tuple(map(bounded_number, vertices[v])) for v in used_vertices}
    require(len(points) <= 150000 and all(len(p) == 3 for p in points.values()), 'vertex census')
    edges, links, ranges = defaultdict(list), defaultdict(dict), []
    for face in ids:
        tri = triangles[face]
        ps = [points[v] for v in tri]
        normal = cross3(sub(ps[1], ps[0]), sub(ps[2], ps[0]))
        xy = [(p[0]-center[0], p[1]-center[1]) for p in ps]
        minimum, maximum = squared_radius_range(xy)
        require(minimum > 0, 'triangle reaches cylinder axis')
        ranges.append((minimum, maximum))
        # Jacobian numerator is affine over a triangle: strict sign at all
        # vertices proves the sign everywhere, without point sampling.
        require(all(orientation*(normal[0]*p[0]+normal[1]*p[1]) > 0 for p in xy),
                'radial projection fold/degeneracy')
        a, b, c = tri
        for u, v in ((a, b), (b, c), (c, a)):
            edges[tuple(sorted((u, v)))].append((face, u, v))
        for v, u, w in ((a, b, c), (b, c, a), (c, a, b)):
            require(u not in links[v], 'branched vertex link')
            links[v][u] = w
    adjacency, boundary = defaultdict(set), {}
    for uses in edges.values():
        require(len(uses) in (1, 2), 'nonmanifold wall edge')
        if len(uses) == 2:
            a, b = uses
            require(a[1:] == b[1:][::-1], 'inconsistent wall winding')
            adjacency[a[0]].add(b[0])
            adjacency[b[0]].add(a[0])
        else:
            _, a, b = uses[0]
            require(a not in boundary, 'branched oriented boundary')
            boundary[a] = b
    reached, pending = set(), [ids[0]]
    while pending:
        face = pending.pop()
        if face not in reached:
            reached.add(face)
            pending.extend(adjacency[face]-reached)
    require(len(reached) == len(ids), 'disconnected wall')
    require(len(points)-len(edges)+len(ids) == 0, 'wall is not annular')
    require(boundary and set(boundary) == set(boundary.values()), 'boundary cycle incidence')
    remaining, cycles = set(boundary), []
    while remaining:
        start, cycle, seen = min(remaining), [], set()
        at = start
        while at not in seen:
            require(at in remaining, 'boundary repeats another component')
            seen.add(at)
            cycle.append(at)
            at = boundary[at]
        require(at == start and len(cycle) >= 3, 'non-simple boundary cycle')
        remaining.difference_update(cycle)
        cycles.append(cycle)
    require(len(cycles) == 2, 'exactly two complete boundary rims')
    require(all(len({points[v][2] for v in cycle}) == 1 for cycle in cycles),
            'rims are not constant axial levels')
    cycles.sort(key=lambda cycle: points[cycle[0]][2])
    actual_low, actual_high = [points[cycle[0]][2] for cycle in cycles]
    require(actual_low < actual_high and abs(actual_low-low) <= incidence and
            abs(actual_high-high) <= incidence, 'finite rim positions')
    require(all(actual_low <= p[2] <= actual_high for p in points.values()), 'axial range')
    rim_kind = {}
    for which, cycle in enumerate(cycles):
        radial = [(points[v][0]-center[0], points[v][1]-center[1]) for v in cycle]
        require(winding(radial) == orientation*(1 if which == 0 else -1),
                'rim does not cover target circumference once')
        for v in cycle:
            rim_kind[v] = which
    interior_count = 0
    for vertex, successors in links.items():
        nodes = set(successors) | set(successors.values())
        predecessors = Counter(successors.values())
        require(all(n == 1 for n in predecessors.values()), 'nonmanifold vertex link')
        is_boundary = vertex in rim_kind
        starts, ends = nodes-set(predecessors), nodes-set(successors)
        require((len(starts), len(ends)) == ((1, 1) if is_boundary else (0, 0)),
                'vertex link must be one interval or cycle')
        start = next(iter(starts)) if is_boundary else min(nodes)
        ordered, seen, at = [], set(), start
        while at not in seen:
            seen.add(at)
            ordered.append(at)
            if at not in successors:
                break
            at = successors[at]
        require(seen == nodes and (at in ends if is_boundary else at == start),
                'disconnected vertex link')
        point = points[vertex]
        radial = (point[0]-center[0], point[1]-center[1])
        rho2 = sum(x*x for x in radial)
        projected = [(cross2(radial, sub(points[n], point)[:2]),
                      rho2*(points[n][2]-point[2])) for n in ordered]
        if is_boundary:
            lower = rim_kind[vertex] == 0
            require(projected[0][1] == projected[-1][1] == 0 and
                    all((v[1] >= 0 if lower else v[1] <= 0) for v in projected),
                    'boundary star not in target half-plane')
            direction = orientation*(1 if lower else -1)
            require(direction*projected[0][0] > 0 and direction*projected[-1][0] < 0,
                    'boundary star does not cover one half-neighborhood')
        else:
            require(winding(projected) == orientation, 'interior star degree is not one')
            interior_count += 1
    drift = max(abs(actual_low-low), abs(actual_high-high))
    radial_allowance_squared = epsilon*epsilon-drift*drift
    require(all(radial_error_squared_within(q, radius, radial_allowance_squared)
                for interval in ranges for q in interval), 'complete triangle distance budget')
    return {'scope': 'proposed finite full-cylinder surface certificate',
            'triangles': len(ids), 'vertices': len(points), 'edges': len(edges),
            'euler': 0, 'boundaryRimEdges': [len(c) for c in cycles],
            'interiorVertexStars': interior_count, 'orientation': orientation,
            'actualAxialLevelsExact': [str(actual_low), str(actual_high)],
            'maximumAxialDriftExact': str(drift), 'deflectionExact': str(epsilon),
            'minimumRadiusSquaredExact': str(min(a for a, b in ranges)),
            'maximumRadiusSquaredExact': str(max(b for a, b in ranges))}
