import {FcCancel, FcCheckmark} from "react-icons/fc";
import {RiExternalLinkLine} from "react-icons/ri";
import {toast} from 'react-toastify';

import {saveAndExitEditor} from '../craft/unconsumedSketchSave.mjs';

const saveAndExit = editor => saveAndExitEditor(editor, toast);

export default [
  {
    id: 'sketchSaveAndExit',
    appearance: {
      info: 'save sketch changes and exit',
      label: 'commit',
      icon: FcCheckmark,

    },
    invoke: ({services}) => saveAndExit(services.sketcher.inPlaceEditor)
  },
  {
    id: 'sketchExit',
    appearance: {
      info: 'drop sketch changes and exit',
      label: 'exit sketch',
      icon: FcCancel,
    },
    invoke: ({services}) => {
      services.sketcher.inPlaceEditor.exit();
    }
  },
  {
    id: 'sketchOpenInTab',
    appearance: {
      info: 'save changes and open sketch 2D in a tab',
      label: '2D',
      icon: RiExternalLinkLine,
    },
    invoke: async ({services}) => {
      const face = services.sketcher.inPlaceEditor.face;
      await saveAndExit(services.sketcher.inPlaceEditor);
      services.sketcher.sketchFace2D(face);
    }
  }
]
