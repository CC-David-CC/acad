import Mousetrap from 'mousetrap';
import DefaultKeymap from './keymaps/default';
import {isMenuAction} from '../dom/menu/menuBundle';
import {state} from 'lstream';

export const BundleName = "@Keyboard";

export function activate(ctx) {

  const {services, streams} = ctx;

  streams.ui.keymap = state(DefaultKeymap);
  const keymap = DefaultKeymap;
  //to attach to a dom element: Mousetrap(domElement).bind(...
  for (const action of Object.keys(keymap)) {
    const dataProvider = getDataProvider(action, services);
    Mousetrap.bind(keymap[action], (e) => {
      // A disabled document action must not steal undo from an active editor.
      if ((action === 'AuthoredUndo' || action === 'AuthoredRedo') && !ctx.streams.action.state[action]?.value?.enabled) return;
      e.preventDefault();
      ctx.actionService.run(action, dataProvider ? dataProvider() : undefined)
    });
  }
  Mousetrap.bind('esc', services.menu.closeAll)
}

function getDataProvider(action, services) {
  if (isMenuAction(action)) {
    return function() {
      const {left, top, width, height} = services.dom.viewerContainer.getBoundingClientRect();
      return {
        x: left + width * 0.5,
        y: top + height * 0.5,
        centered: true
      }      
    }
  }
  return null;
}


