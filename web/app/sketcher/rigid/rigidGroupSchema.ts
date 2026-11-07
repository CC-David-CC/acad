import {Polynomial, POW_1_FN, SIN_FN, COS_FN} from '../constr/polynomial';
import {RigidGroup} from './rigidGroup';

function coordinate(value, translation, angle, u, v, y) {
  return new Polynomial(0).monomial(1).term(value, POW_1_FN).monomial(-1).term(translation, POW_1_FN)
    .monomial(-u).term(angle, y ? SIN_FN : COS_FN)
    .monomial(y ? -v : v).term(angle, y ? COS_FN : SIN_FN);
}

// The group owns the transform. Every original endpoint is still a distinct
// solver object, so existing constraints retain their world-coordinate meaning.
export const RigidGroupSchema = {
  id: 'RigidGroup', name: 'Rigid group',
  defineParamsScope: ([group, ...members], cb) => {
    if (!(group instanceof RigidGroup) || members.length !== group.members.length) throw Error('Invalid rigid group ownership');
    group.visitParams(cb);
    members.forEach((segment, i) => {
      const authored = group.members[i];
      if (!segment || segment.TYPE !== 'Segment' || segment.id !== authored.id || segment.a.id !== authored.a || segment.b.id !== authored.b) throw Error('Invalid rigid member');
      segment.a.visitParams(cb); segment.b.visitParams(cb);
    });
  },
  collectPolynomials: (out, [tx, ty, angle, ...coordinates], _constants, [group]) => {
    group.points.forEach((point, i) => {
      out.push(coordinate(coordinates[2*i], tx, angle, point.x, point.y, false));
      out.push(coordinate(coordinates[2*i+1], ty, angle, point.x, point.y, true));
    });
  },
};
