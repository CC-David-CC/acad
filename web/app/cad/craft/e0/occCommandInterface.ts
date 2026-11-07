import {CallCommand} from "cad/craft/e0/interact";
import {MObject} from "cad/model/mobject";
import {OCCCommands} from "cad/craft/e0/OCI";
import {assertLegacyCommandName, requireLegacyPointer} from 'cad/model/workerGeometry';
import CadError from 'utils/errors';

export type OCCCommandInterface = OCCCommands;

const pushedModels = new Map<string, MObject>();

export function clearImplicitModels() {
  pushedModels.clear();
}

export const OCI: OCCCommandInterface = new Proxy({}, {
  get: function (target, prop: string, receiver) {
    return prop in target ? target[prop] : function(...argums) {
      if (typeof prop !== 'string') {
        return undefined;
      }
      prop = prop.replace(/^_/, '');
      // Check every operand before registering any of them or calling OCC.
      // A worker-owned or missing representation must not become a stale name.
      argums.forEach(arg => {
        if (arg instanceof MObject) requireLegacyPointer(arg, prop);
        else if (typeof arg === 'string') assertLegacyCommandName(arg, prop);
      });
      const args = argums.map(arg => {
        const type = typeof arg;
        if (type === 'object') {
          if (arg instanceof MObject) {
            if (pushedModels.get(arg.id) !== arg) {
              if (__CAD_APP.occService.io.pushModel(arg, arg.id) !== true) {
                throw new CadError({kind:CadError.KIND.INVALID_INPUT, code:'LEGACY_GEOMETRY_UNAVAILABLE',
                  userMessage:'The engine could not register the selected geometry. No operation was performed.'});
              }
              pushedModels.set(arg.id, arg);
            }
            return arg.id;
          }
          return JSON.stringify(arg);
        } else {
          return arg + "";
        }
      });
      console.log("ARGUMENTS:", args);
      const returnCode = CallCommand(prop, [prop, ...args]);
      // if (returnCode !== 0) {
      //   throw 'command execution fail: ' + prop;
      // }
      return returnCode;
    };
  },
}) as any;


