import {combine, state, StateStream} from 'lstream';
import initializeBySchema from '../schema/initializeBySchema';
import {clone} from 'gems/objects';
import materializeParams from '../schema/materializeParams';
import {createFunctionList} from 'gems/func';
import {CraftHistory, OperationRequest} from "cad/craft/craftBundle";
import {NewOperationCall, ParamsPath, WizardService, WizardState, WorkingRequest} from "cad/craft/wizard/wizardTypes";
import _ from "lodash";
import {OperationParamValue} from "cad/craft/schema/schema";
import {ApplicationContext} from "cad/context";
import {Operation} from "cad/craft/operationBundle";
import produce from "immer"

const signalAborted = Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted')!.get!);

// This is a bounded proof for navigation, not a new operation-param schema.
// Unprovable/large data remains an ordinary editable wizard request.
const PREVIEW_MAX_OBJECTS = 1024;
const PREVIEW_MAX_FIELDS = 4096;
const PREVIEW_MAX_BYTES = 262144;
function previewKeys(value: any, limit: number): string[] | null {
  // Refuse a large ordinary JSON object before allocating its full key list.
  // Detached params were already created by the existing JSON clone above.
  const keys: string[] = [];
  for (const key in value) {
    if (!Object.hasOwn(value, key) || keys.length >= limit) return null;
    keys.push(key);
  }
  const all = Reflect.ownKeys(value);
  if (all.length !== keys.length + (Array.isArray(value) ? 1 : 0)) return null;
  return Array.isArray(value) ? [...keys, 'length'] : keys;
}
function previewData(actual: any, expected: any): object[] | null {
  const pending = [[actual, expected]], objects: object[] = [];
  let fields = 0, bytes = 0;
  while (pending.length) {
    const [a, b] = pending.pop();
    if (typeof b === 'string') {
      bytes += 2 * b.length;
      if (bytes > PREVIEW_MAX_BYTES || !Object.is(a, b)) return null;
    } else if (b === null || typeof b === 'number' || typeof b === 'boolean') {
      bytes += 32;
      if (bytes > PREVIEW_MAX_BYTES || !Object.is(a, b)) return null;
    } else {
      if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return null;
      for (const value of [a, b]) {
        const proto = Object.getPrototypeOf(value);
        if (Array.isArray(value) ? proto !== Array.prototype : proto !== null && proto !== Object.prototype) return null;
      }
      if (objects.length >= PREVIEW_MAX_OBJECTS) return null;
      objects.push(b);
      // Check lengths before enumerating to avoid an unbounded sparse array.
      if (Array.isArray(b) && (b.length > PREVIEW_MAX_FIELDS || a.length !== b.length)) return null;
      const keys = previewKeys(b, PREVIEW_MAX_FIELDS - fields), actualKeys = previewKeys(a, PREVIEW_MAX_FIELDS - fields);
      if (!keys || !actualKeys) return null;
      fields += keys.length;
      if (fields > PREVIEW_MAX_FIELDS || keys.length !== actualKeys.length || Array.isArray(b) && keys.length !== b.length + 1) return null;
      for (const key of keys) {
        if (typeof key !== 'string') return null;
        bytes += 2 * key.length;
        if (bytes > PREVIEW_MAX_BYTES) return null;
        const own = Object.getOwnPropertyDescriptor(a, key), copy = Object.getOwnPropertyDescriptor(b, key);
        if (!own || !copy || !Object.hasOwn(own, 'value') || !Object.hasOwn(copy, 'value') || own.enumerable !== copy.enumerable || key !== 'length' && !copy.enumerable) return null;
        pending.push([own.value, copy.value]);
      }
    }
  }
  return objects;
}

export function activate(ctx: ApplicationContext) {

  const {streams, services} = ctx;

  const insertOperation$ = state<NewOperationCall>(null);

  let REQUEST_COUNTER = 1;
  let reservedWizardFeatureId: string | null = null;
  const passivePreviews = new WeakMap<WorkingRequest, {
    modifications: StateStream<CraftHistory>, state: CraftHistory, revision: number,
    history: OperationRequest[], pointer: number, hints: CraftHistory['hints'],
    entry: OperationRequest, type: string, suppressed: OperationRequest['suppressed'], params: OperationRequest['params'],
    project: ApplicationContext['projectService'], generation: number, signal: AbortSignal
  }>();

  const workingRequest$: StateStream<WorkingRequest> = combine<[NewOperationCall, CraftHistory]>(
    insertOperation$,
    ctx.craftService.modifications$
  ).map<NewOperationCall|OperationRequest>(([insertOperationReq, mods]) => {

    let operation;
    let params;

    if (insertOperationReq !== null) {
      operation = ctx.operationService.get(insertOperationReq.type);
      params = initializeBySchema(operation.schema, ctx);
      if (insertOperationReq.initialOverrides) {
        applyOverrides(params, insertOperationReq.initialOverrides);
      }

      if (reservedWizardFeatureId !== null) ctx.projectService.counterGenerator.releaseFeatureId(reservedWizardFeatureId);
      reservedWizardFeatureId = ctx.projectService.counterGenerator.generateFeatureId();
      params.featureId = reservedWizardFeatureId;

      return {
        type: operation.id,
        params,
        requestKey: REQUEST_COUNTER++
      }
    } else {
      const {pointer, history, hints} = mods
      if (pointer !== history.length - 1) {
        const entry = history[pointer + 1], {type, params} = entry;
        const request: WorkingRequest = {
          type,
          params: clone(params),
          hints,
          requestKey: REQUEST_COUNTER++
        };
        // Only this exact derived request can carry navigation provenance.
        // Never freeze the history entry, its params, or its hints.
        try {
          const hintKeys = hints && previewKeys(hints, 1);
          const noFocus = hints && Object.getOwnPropertyDescriptor(hints, 'noWizardFocus');
          if (hintKeys?.length === 1 && noFocus?.enumerable && Object.hasOwn(noFocus, 'value') && noFocus.value === true) {
            const objects = previewData(params, request.params);
            const project = ctx.projectService, generation = project.documentGeneration, signal = project.documentSignal;
            if (objects && project.isDocumentCurrent(generation) && !signalAborted(signal)) {
              // The existing clone is reused; the hint clone has one data field.
              request.hints = Object.freeze({noWizardFocus: noFocus.value});
              for (const object of objects) Object.freeze(object);
              Object.freeze(request);
              passivePreviews.set(request, {modifications: ctx.craftService.modifications$, state: mods,
                revision: ctx.craftService.modifications$.revision, history, pointer, hints, entry, type,
                suppressed: entry.suppressed, params, project, generation, signal});
            }
          }
        } catch {
          // Proof failure must not prevent the ordinary wizard from opening.
        }
        return request;
      } else {
        return null;
      }
    }

  }).remember(null);

  const materializedWorkingRequest$ = workingRequest$.map(req => {
    if (req == null) {
      return null;
    }
    const params = {};
    const errors = [];
    const operation = ctx.services.operation.get(req.type);

    materializeParams(ctx, req.params, operation.schema, params, errors);
    if (errors.length !== 0) {
      return null;
    }
    return {
      type: req.type,
      params
    };
  }).remember(null).filter(r => r !== null).throttle(500);

  const state$ = state<WizardState>({});
  let disposerList = createFunctionList();

  // reset effect
  workingRequest$.pairwise().attach(([old, curr]) => {
    if (old !== null && old.requestKey !== curr?.requestKey) {
      disposerList.call();
      disposerList = createFunctionList();
    }

    if (curr !== null && old?.requestKey !== curr.requestKey) {
      const newState: WizardState = {};
      if (curr) {
        const op = ctx.operationService.get(curr.type);
        if (op.defaultActiveField) {
          newState.activeParam = op.defaultActiveField;
        }
      }
      state$.next(newState);
    }

  })

  const invalidatePassivePreview = () => {
    const request = workingRequest$.value;
    if (request) passivePreviews.delete(request);
  };
  const updateParams = mutator => {
    // Even an explicit no-op edit is a draft, not passive navigation.
    invalidatePassivePreview();
    workingRequest$.update((req: WorkingRequest) => produce(req, draft => {
      mutator(draft.params)
    }));
  };
  const updateState = mutator => {
    invalidatePassivePreview();
    state$.update((state: WizardState) => produce(state, draft => {
      mutator(draft);
    }));
  };
  const updateParam = (path: ParamsPath, value: OperationParamValue) => {
    updateParams(params => {
      // if (operation.onParamsUpdate) {
      //   operation.onParamsUpdate(params, name, value, params[name]);
      // }
      if (!Array.isArray(path)) {
        path = [path]
      }

      _.set(params, path, value);
    });
  };

  const readParam = (path: ParamsPath) => {
    return _.get(workingRequest$.value.params, path);
  };

  const getWorkingRequest = () => workingRequest$.value;
  const hasActiveOperation = () => {
    const request = getWorkingRequest();
    if (request === null) return false;
    try {
      const witness = passivePreviews.get(request);
      if (!witness || insertOperation$.value !== null) return true;
      const {modifications, state: source, revision, history, pointer, hints, entry, type, suppressed, params, project, generation, signal} = witness;
      const noFocus = hints && Object.getOwnPropertyDescriptor(hints, 'noWizardFocus');
      return ctx.craftService.modifications$ !== modifications || modifications.value !== source || modifications.revision !== revision ||
        source.history !== history || source.pointer !== pointer || source.hints !== hints ||
        !noFocus?.enumerable || !Object.hasOwn(noFocus, 'value') || noFocus.value !== true || previewKeys(hints, 1)?.length !== 1 ||
        pointer < -1 || pointer >= history.length - 1 || history[pointer + 1] !== entry ||
        entry.type !== type || request.type !== type || entry.suppressed !== suppressed || entry.params !== params || !Object.isFrozen(request) ||
        ctx.projectService !== project || project.documentGeneration !== generation || project.documentSignal !== signal ||
        !project.isDocumentCurrent(generation) || signalAborted(signal) || previewData(params, request.params) === null;
    } catch {
      return true;
    }
  };

  //legacy
  streams.wizard = {
    insertOperation: insertOperation$,
  };

  const releaseNewOperationId = () => {
    if (reservedWizardFeatureId !== null) ctx.projectService.counterGenerator.releaseFeatureId(reservedWizardFeatureId);
    reservedWizardFeatureId = null;
  };
  const cancel = () => {
    releaseNewOperationId();
    insertOperation$.next(null);
  };

  const wizardService: WizardService = {

    open: (type: string, initialOverrides: NewOperationCall) => {
      releaseNewOperationId();
      streams.wizard.insertOperation.next({
        type,
        initialOverrides
      });
    },

    cancel,
    
    applyWorkingRequest: () => {
      invalidatePassivePreview();
      const {type, params} = getWorkingRequest();
      const request = clone({type, params});
      const setError = error => updateState(state => state.error = error);
      if (insertOperation$.value) {
        ctx.craftService.modify(request, cancel, setError);
      } else {
        ctx.craftService.modifyInHistoryAndStep(request, () => {}, setError);
      }
    },
    
    isInProgress: () => getWorkingRequest() !== null,
    hasActiveOperation,

    get workingRequest() {
      return getWorkingRequest();
    },

    get operation(): Operation<any> {
      const req = getWorkingRequest();
      if (!req) {
        return null;
      }
      return ctx.operationService.get(req.type);
    },

    workingRequest$, materializedWorkingRequest$, state$,
    updateParams, updateParam, readParam, updateState,
    addDisposer: (disposer) => disposerList.add(disposer)
  };

  ctx.wizardService = services.wizard = wizardService;
}

export interface WizardBundleContext {
  wizardService: WizardService
}

function applyOverrides(params, initialOverrides) {
  Object.assign(params, initialOverrides);
}

export const BundleName = "@Wizard";
