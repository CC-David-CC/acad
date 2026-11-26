import React from 'react';

import ls from './ControlBar.less';
import cx from 'classnames';

export default function ControlBar({left, right}) {

  return <div className={cx(ls.root, 'mid-typography')} data-cad-control-bar>
    <div className={ls.left}>
      {left}
    </div>
    <div className={ls.right}>
      {right}
    </div>
  </div>
}

export function ControlBarButton({onElement, disabled, children, onClick, ...props}) {
  // mapActionBehavior
  return <button type="button" className={cx(ls.button, 'disable-selection', {disabled})}
                 disabled={disabled} onClick={onClick} ref={onElement} {...props}>
    {children}
  </button>
}