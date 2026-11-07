import {merge, state, StateStream, Stream} from 'lstream';
import {indexArray} from 'gems/iterables';
import {ApplicationContext} from "cad/context";
import {desktopFileMode} from '../desktopFileActions';
import {evaluateMath, parseMathDefinitions} from 'gems/safeExpression.mjs';
import {decodePhysicalSource} from '../parameters/physicalSource.mjs';
import {createCandidateExpressionFacade} from '../parameters/candidateExpressionFacade.mjs';
import {consumePreparedPhysicalState} from '../parameters/preparedPhysicalState.mjs';
import {registerExpressionPublication} from '../parameters/expressionPublication.mjs';
import {createLegacyExpressionFacade} from '../parameters/legacyNumericExpressions.mjs';

export const BundleName = "@Expressions";

export function activate(ctx: ApplicationContext) {
  let _evaluateExpression: (string) => any = () => {};
  let typedFacade:any = null, acceptedPhysicalSource:string = null, acceptedPhysicalRevisions:readonly number[] = null;

  const script$ = state('');
  const list$ = state([]);
  const makeTable = varList => {
    const table=indexArray(varList.filter(i => !i.dimension || i.dimension === 'scalar'), i => i.name, i => i.value);
    return varList.some(i => i.dimension) ? Object.freeze(table) : table;
  };
  const table$ = state(makeTable([]));
  // A prepared batch has already installed the matching table before any
  // list observer runs. Do not emit a second revision in that case.
  list$.attach(varList => {
    const table=makeTable(varList),prior=table$.value,keys=Object.keys(table),old=Object.keys(prior);
    if (keys.length!==old.length || keys.some(key => !Object.prototype.hasOwnProperty.call(prior,key) || !Object.is(table[key],prior[key]))) table$.next(table);
  });
  const synced$ = merge(script$.map(() => false), list$.map(() => true));
  const errors$ = state([]);

  function refreshLegacyExpressions() {
    if (typedFacade) {
      if (script$.value !== acceptedPhysicalSource) { errors$.next([{line:0,message:'Typed definitions must be changed through the parameter command.'}]); return; }
      return;
    }
    const {varList, errors, evaluateExpression} = rebuildVariableTable(script$.value);
    list$.next(varList);
    errors$.next(errors);
    _evaluateExpression = evaluateExpression;
  }

  function load(script) {
    const typed=decodePhysicalSource(script);
    if(typed){
      const result=consumePreparedPhysicalState(ctx.expressionService,script);
      const facade=createCandidateExpressionFacade(ctx.expressionService,script,{revision:'restore',ok:true,result},'restore');
      typedFacade=facade;acceptedPhysicalSource=script;script$.next(script);list$.next(facade.list$.value);errors$.next([]);acceptedPhysicalRevisions=[script$.revision,list$.revision,errors$.revision,table$.revision];return;
    }
    typedFacade=null;acceptedPhysicalSource=null;acceptedPhysicalRevisions=null;script$.next(script);refreshLegacyExpressions();
  }

  function reevaluateExpressions(source = script$.value) {
    if (desktopFileMode) {
      const craft:any=ctx.craftService;
      if (!craft?.applyLegacyExpressions || !craft?.inspectAuthoredEdits) return Promise.reject(Error('Expression editing is not ready.'));
      return craft.applyLegacyExpressions({revision:craft.inspectAuthoredEdits().revision,source});
    }
    refreshLegacyExpressions();
  }

  function evaluateExpression(expr) {
    if (typedFacade) throw Error('Typed parameters require a dimension-aware consumer.');
    if (typeof expr === 'number') {
      return expr;      
    }
    let value = desktopFileMode && !Object.prototype.hasOwnProperty.call(table$.value,expr) ? undefined : table$.value[expr];
    if (value === undefined) {
      value = _evaluateExpression(expr);
    }
    return value;
  }


  ctx.actionService.registerAction({
    id: 'expressionsUpdateTable',
    appearance: {
      info: 'reevaluate expression script (happens automatically on script focus lost)',
      label: 'update expressions',
    },
    invoke: () => {
      return reevaluateExpressions();
    }
  });

  const currentPhysical=()=>!!typedFacade && script$.value===acceptedPhysicalSource && !!acceptedPhysicalRevisions && script$.revision===acceptedPhysicalRevisions[0] && list$.revision===acceptedPhysicalRevisions[1] && errors$.revision===acceptedPhysicalRevisions[2] && table$.revision===acceptedPhysicalRevisions[3] && errors$.value.length===0;

  ctx.expressionService = {
    script$, list$, table$, synced$, errors$,
    get isTyped() { return !!typedFacade; },
    hasCurrentPhysicalResult: currentPhysical,
    resolveQuantity: (name,dimension) => { if (!currentPhysical()) throw Error('Typed parameters are unavailable.'); return typedFacade.resolveQuantity(name,dimension); },
    reevaluateExpressions, load, evaluateExpression,
    signature: ''
  };

  registerExpressionPublication(ctx.expressionService,(source,response,revision)=>{
    let facade:any;
    const legacyEvaluator = expr => evaluateMath(expr,Object.create(null));
    const legacy=response?.result?.kind==='legacy-numeric-v1';
    if (legacy) facade=createLegacyExpressionFacade(ctx.expressionService,source,response,revision);
    else if (source==='') {
      facade=Object.create(ctx.expressionService);Object.defineProperty(facade,'isTyped',{value:false});
      Object.assign(facade,{script$:Object.freeze({value:'',revision:script$.revision}),list$:Object.freeze({value:Object.freeze([]),revision:list$.revision}),errors$:Object.freeze({value:Object.freeze([]),revision:errors$.revision}),table$:Object.freeze({value:Object.freeze(Object.create(null)),revision:table$.revision}),evaluateExpression:legacyEvaluator});Object.freeze(facade);
    } else facade=createCandidateExpressionFacade(ctx.expressionService,source,response,revision);
    let installed=false;
    const streams=[script$,list$,errors$,table$], versions=streams.map(stream=>stream.revision), postVersions=Object.freeze(versions.map(version=>version+1)), oldFacade=typedFacade, oldSource=acceptedPhysicalSource;
    const changes=[{stream:script$,value:source},{stream:list$,value:facade.list$.value},{stream:errors$,value:facade.errors$.value},{stream:table$,value:facade.table$.value}].map(Object.freeze);
    return Object.freeze({facade,changes:Object.freeze(changes),
      isCurrent:()=>typedFacade===oldFacade && acceptedPhysicalSource===oldSource && streams.every((stream,i)=>stream.revision===versions[i]),
      wasInstalled:()=>installed,
      isInstalled:()=>installed&&streams.every((stream,i)=>stream.revision===postVersions[i]&&stream.value===(changes[i] as any).value)&&(legacy?_evaluateExpression===facade.evaluateExpression:source===''?typedFacade===null:typedFacade===facade),
      // Called synchronously immediately after the prepared batch commits and
      // before notification; all values/revisions were preflighted by craft.
      installBinding(){installed=true;const numeric=legacy||source==='';typedFacade=numeric?null:facade;acceptedPhysicalSource=numeric?null:source;acceptedPhysicalRevisions=numeric?null:postVersions;if(numeric)_evaluateExpression=legacy?facade.evaluateExpression:legacyEvaluator;}
    });
  });
  table$.attach(() => ctx.expressionService.signature = Date.now() + '');

  load('');
}

function rebuildVariableTable(script) {
  if (desktopFileMode) return rebuildSafeVariableTable(script);
  const varList = [];
  const errors = [];
  if (script == null) return;
  const lines = script.split('\n');
  let evalContext = "(function() { \n";
  function evaluateExpression(expr) {
    return eval(evalContext + "return " + expr + "; \n})()");
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^\s*([^\s]+)\s*=(.+)$/);
    if (m != null && m.length === 3) {
      const name = m[1];
      try {
        const value = evaluateExpression(m[2]);
        varList.push({name, value});
        evalContext += "const " + name + " = " + value + ";\n"
      } catch (e) {
        errors.push({
          line: i, 
          message: e.message
        });
        console.log(e);
      }
    }
  }
  return {varList, errors, evaluateExpression}; 
}

function rebuildSafeVariableTable(script) {
  const {varList, errors, variables} = parseMathDefinitions(script);
  return {varList,errors,evaluateExpression: expr => evaluateMath(expr,variables)};
}

export interface ExpressionService {

  readonly isTyped: boolean;
  hasCurrentPhysicalResult(): boolean;
  resolveQuantity(name: string, dimension: string): number;

  script$: StateStream<string>;

  list$: StateStream<string[]>,

  table$: Stream<{[key:string]: string}>,

  synced$: Stream<any>,

  errors$: Stream<ExpressionError[]>

  reevaluateExpressions(source?: string): void | Promise<any>;

  load(script: string):void;

  evaluateExpression(string): any;

  signature: string;
}

export interface ExpressionError {
  message: string;
  line: string;
}

export interface ExpressionBundleContext {

  expressionService: ExpressionService;
}
