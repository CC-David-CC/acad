import {runPrismSemantic} from '../../modules/engine/extrusion/prismSemanticClient';
import {captureSelectedRegionCurveIds,captureSelectedRegionInspection} from '../../modules/engine/extrusion/selectedRegionDescriptor.mjs';
(globalThis as any).descriptorTestApi=Object.freeze({runPrismSemantic,captureSelectedRegionCurveIds,captureSelectedRegionInspection});
