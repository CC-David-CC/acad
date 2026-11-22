import CoreActions from '../actions/coreActions';
import HistoryActions from '../actions/historyActions';
import UsabilityActions from '../actions/usabilityActions';
import {createAuthoredHistoryActions} from '../actions/authoredHistoryActions';
import menuConfig from './menuConfig';
import React from 'react';
import OperationHistory from '../craft/ui/OperationHistory';
import Expressions from '../expressions/Expressions';
import {SelectionView} from "../dom/components/SelectionView";
import {GrSelect} from "react-icons/gr";
import {Explorer} from "cad/dom/components/Explorer";
import {contributeComponent} from 'cad/dom/components/ContributedComponents';
import {EnclosureMaterials, openEnclosureMaterials} from 'cad/projectManager/ui/EnclosureMaterials';
import {desktopFileMode} from '../desktopFileActions';

export const BundleName = "@UIConfig";

export function activate(ctx) {
  const {services, streams} = ctx;
  const menusLeft = ['menu.file', 'menu.edit', 'menu.craft', 'menu.primitives', 'menu.views', 'menu.viewModes'];
  if (!__ACAD_SOURCE_OCCT__) menusLeft.splice(3, 0, 'menu.boolean');
  streams.ui.controlBars.left.value = menusLeft;
  streams.ui.controlBars.right.value = [
    ['Info', {label: null}],
    ['RefreshSketches', {label: null}],
    ['ShowSketches', {label: 'sketches'}], ['DeselectAll', {label: null}], ['ToggleCameraMode', {label: null}]
  ];

  streams.ui.toolbars.headsUpQuickActions.value = desktopFileMode ? ['Save', 'menu.workbenches'] : ['Save', 'StlExport', 'menu.workbenches'];
  
  ctx.actionService.registerActions(desktopFileMode ? CoreActions : CoreActions.filter(action => !['DesktopSaveAs','DesktopExport3MF','DesktopExportSTEP','DesktopDimensionedRectangle','DesktopEditRectangleDimensions'].includes(action.id)));
  contributeComponent(EnclosureMaterials);
  ctx.actionService.registerAction({id:'EnclosureMaterials', appearance:{cssIcons:['cube'],label:'Enclosure materials…',info:'Assign body and lid materials'}, invoke:openEnclosureMaterials});
  ctx.actionService.registerActions(HistoryActions);
  ctx.actionService.registerActions(UsabilityActions);
  ctx.actionService.registerActions(createAuthoredHistoryActions(ctx));

  const menus = desktopFileMode ? menuConfig.map(menu => menu.id === 'file' ? {...menu, actions: ['NativeFormatImport', 'Save', 'DesktopSaveAs', 'DesktopExport3MF', 'DesktopExportSTEP', 'ExportFaceToDXF', 'EnclosureMaterials', '-', 'ReassignSketch']} : menu.id === 'craft' ? {...menu, actions: ['DesktopEditRectangleDimensions', '-', ...menu.actions]} : menu.id === 'primitives' ? {...menu, actions: ['DesktopDimensionedRectangle', '-', ...menu.actions]} : menu) : menuConfig;
  const sourceMenuActions = {
    file: ['NativeFormatImport', 'Save', 'DesktopSaveAs'],
    craft: ['DesktopEditRectangleDimensions', 'WORKER_RECTANGLE_EXTRUDE_V1'],
    primitives: ['DesktopDimensionedRectangle', 'PLANE'],
  };
  services.menu.registerMenus(__ACAD_SOURCE_OCCT__
    ? menus.filter(menu => !['boolean', 'datum'].includes(menu.id)).map(menu =>
      sourceMenuActions[menu.id] ? {...menu, actions: sourceMenuActions[menu.id]} : menu)
    : menus);

  services.ui.registerFloatView('project', Explorer, 'Model', 'cubes');
  services.ui.registerFloatView('history', OperationHistory, 'Modifications', 'history');
  services.ui.registerFloatView('expressions', Expressions, 'Expressions', 'percent');
  services.ui.registerFloatView('selection', SelectionView, 'Selection', GrSelect);
}
