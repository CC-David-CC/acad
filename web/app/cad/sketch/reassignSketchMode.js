import React from 'react';
import mapContext from 'ui/mapContext';
import Button from 'ui/components/controls/Button';
import {assertLegacyGeometry} from 'cad/model/workerGeometry';

export default function initReassignSketchMode(ctx) {
  ctx.services.ui.registerComponent('ReassignSketchTool', ReassignSketchTool);


  let detach = null;
  
  function exit() {
    ctx.streams.ui.sockets.headsUpHelper.next(null);
    if (detach) {
      detach();
      detach = null;
    }
  }

  function enter(fromId) {
    const source = ctx.services.cadRegistry.findFace(fromId);
    if (!source) throw new Error('Sketch reassignment requires an existing source face.');
    assertLegacyGeometry(source, 'Reassigning a sketch');
    ctx.streams.ui.sockets.headsUpHelper.next('ReassignSketchTool');
    detach = ctx.streams.selection.face.attach(faces => {
      const face = faces[0];
      if (face && face.id !== fromId) {
        ctx.services.sketcher.reassignSketch(fromId, face);
        exit();
      }
    });
  }
  return {enter, exit};
}

function ReassignSketchToolImp({from, cancel}) {
  return <div style={{
    margin: 10
  }}>
    Reassign sketch from {from}. Pick a target face. <Button onClick={cancel}>cancel</Button>
  </div>;
}

const ReassignSketchTool = mapContext(ctx => ({
  from: ctx.services.selection.face.single.id,
  cancel: ctx.services.sketcher.reassignSketchMode.exit
}))(ReassignSketchToolImp);
