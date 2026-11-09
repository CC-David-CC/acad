import {Materializer, Type, Types} from "cad/craft/schema/types/index";
import {ApplicationContext} from "cad/context";
import {BaseSchemaField, OperationParamsErrorReporter} from "cad/craft/schema/schema";

export interface NumberTypeSchema extends BaseSchemaField {

  type: Types.number,

  dimension?: 'length' | 'angle';

  min: number;

  max: number;

}

export const NumberType: Type<any, number, NumberTypeSchema> = {

  resolve(ctx: ApplicationContext,
          value: any,
          md: NumberTypeSchema,
          reportError: OperationParamsErrorReporter,
          materializer: Materializer): number {

    try {
      const valueType = typeof value;
      if (valueType === 'string') {
        const expressionService: any = ctx.expressionService;
        if (expressionService.isTyped === true) {
          if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())) value = Number(value);
          else {
            if (!md.dimension) throw new Error('Typed parameter requires a dimension-aware field.');
            value = expressionService.resolveQuantity(value.trim(), md.dimension);
          }
        } else {
          value = expressionService.evaluateExpression(value);
        }
      } else if (valueType !== 'number') {
        reportError('invalid value');
      }
    } catch (e) {
      reportError('unable to evaluate expression');
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      reportError('expected a finite number');
      return value;
    }

    if (md.min !== undefined) {
      if (value < md.min) {
        reportError('less than allowed');
      }
    }
    if (md.max !== undefined) {
      if (value > md.max) {
        reportError('greater than allowed');
      }
    }
    return value;
  }
}
