import {PatternGeneratorSchema} from '../generators/patternGenerator';
import {patternSelection,patternCount,patternStep,patternInputData,derivePatternData,patternFail} from '../generators/patternSource.mjs';
import {NoIcon} from '../icons/NoIcon';
import {Generator} from "../id-generator";
import {SketchGenerator} from "../generators/sketchGenerator";
import {MirrorGeneratorSchema} from "../generators/mirrorGenerator";
import {MirrorGeneratorIcon, OffsetGeneratorIcon} from "../icons/generators/GeneratorIcons";
import {OffsetTool} from "../tools/offset";

export default [
  {
    id:'AssociativeSketchPattern',shortName:'Sketch pattern',kind:'Generator',
    description:'Translate original sketch roots. Total instances includes seed;4 means three additional copies.',icon:NoIcon,
    wizard:[{name:'objects',type:'selection',label:'Original objects',minQuantity:1,maxQuantity:16,capture:'highlight',filter:null},{name:'count',type:'number',label:'TOTAL instances INCLUDING seed (4 = three copies)'},{name:'stepX',type:'number',label:'Step X (mm, literal)'},{name:'stepY',type:'number',label:'Step Y (mm, literal)'}],
    invoke:(ctx,raw)=>{
      const keys=Reflect.ownKeys(raw||{});if(keys.length!==4||!['objects','count','stepX','stepY'].every(k=>Object.getOwnPropertyDescriptor(raw,k)?.enumerable&&Object.hasOwn(Object.getOwnPropertyDescriptor(raw,k),'value')))patternFail('PATTERN_INVALID','Use explicit original objects/count/step components.');
      const count=patternCount(raw.count),step=patternStep({x:raw.stepX,y:raw.stepY}),objects=raw.objects;
      if(!Array.isArray(objects)||objects.length<1||objects.length>16)patternFail('PATTERN_TARGET','Select1..16 actual original roots.');
      const ids=patternSelection(objects.map(o=>o?.id)),pm=ctx.viewer.parametricManager,ordered=ids.map(id=>objects.find(o=>o.id===id));
      for(const o of ordered){if(o.parent||o.isGenerated||o.readOnly||!pm.stages.includes(o.stage)||!o.stage.objects.has(o)||[...o.constraints].some(c=>['StraightSlot','RigidGroup'].includes(c.schema?.id)))patternFail('PATTERN_TARGET','Use ordinary independent native sketch roots.');
        patternInputData(o.TYPE,o.write());for(let instance=1;instance<count;instance++)derivePatternData(o.TYPE,o.write(),step,instance);}
      if(pm.stages.reduce((n,s)=>n+s.generators.size,0)>=256)patternFail('PATTERN_LIMIT','Pattern exceeds256 generators.');
      const generator=new SketchGenerator({objects:ordered,count,stepX:step.x,stepY:step.y},PatternGeneratorSchema);
      pm.addGenerator(generator);
    }
  },


  {
    id: 'Mirror',
    shortName: 'Mirror',
    kind: 'Generator',
    description: 'Mirror Objects',
    icon: MirrorGeneratorIcon,

    wizard: MirrorGeneratorSchema.params,

    invoke: (ctx, params) => {

      const {viewer} = ctx;
      const generator = new SketchGenerator(params, MirrorGeneratorSchema);
      viewer.parametricManager.addGenerator(generator);

    }

  },


  {
    id: 'Offset',
    shortName: 'Offset',
    kind: 'Generator',
    description: 'Offset',
    icon: OffsetGeneratorIcon,

    invoke: (ctx) => {
      ctx.viewer.toolManager.takeControl(new OffsetTool(ctx.viewer));
    }

  },


];

