import {
  AddAngleBetweenDimTool,
  AddCircleDimTool,
  AddFreeDimTool,
  AddHorizontalDimTool,
  AddVerticalDimTool
} from "../tools/dim";
import {
  MeasureAngleBetweenAngle,
  MeasureCircleToolIcon,
  MeasureFreeToolIcon,
  MeasureHorizontalToolIcon,
  MeasureVerticalToolIcon
} from "../icons/tools/ToolIcons";

export default [

  {
    id: 'MeasureDistance',
    shortName: 'Measure Distance (reference)',
    kind: 'Tool',
    description: 'Measure distance between two points (reference only; does not constrain geometry)',
    icon: MeasureFreeToolIcon,

    invoke: (ctx) => {
      ctx.viewer.toolManager.takeControl(new AddFreeDimTool(ctx.viewer, ctx.viewer.dimLayer));
    }

  },


  {
    id: 'MeasureHDistance',
    shortName: 'Measure Horizontal Distance',
    kind: 'Tool',
    description: 'Measure horizontal distance between two points',
    icon: MeasureHorizontalToolIcon,

    invoke: (ctx) => {
      ctx.viewer.toolManager.takeControl(new AddHorizontalDimTool(ctx.viewer, ctx.viewer.dimLayer));
    }

  },

  {
    id: 'MeasureVDistance',
    shortName: 'Measure Vertical Distance',
    kind: 'Tool',
    description: 'Measure vertical distance between two points',
    icon: MeasureVerticalToolIcon,

    invoke: (ctx) => {
      ctx.viewer.toolManager.takeControl(new AddVerticalDimTool(ctx.viewer, ctx.viewer.dimLayer));
    }

  },

  {
    id: 'MeasureCircle',
    shortName: 'Measure Radius',
    kind: 'Tool',
    description: 'Measure circle or arc radius (reference only)',
    icon: MeasureCircleToolIcon,

    invoke: (ctx) => {
      ctx.viewer.toolManager.takeControl(new AddCircleDimTool(ctx.viewer, ctx.viewer.dimLayer));
    }

  },

  {
    id: 'MeasureAngleBetween',
    shortName: 'Measure Angle Between',
    kind: 'Tool',
    description: 'Measure angle between',
    icon: MeasureAngleBetweenAngle,

    invoke: (ctx) => {
      ctx.viewer.toolManager.takeControl(new AddAngleBetweenDimTool(ctx.viewer, ctx.viewer.dimLayer));
    }

  },
];
