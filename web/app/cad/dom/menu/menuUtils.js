export const menuAboveElementHint = el => {
  const {top, left} = el.getBoundingClientRect();
  const controlBar = el.closest('[data-cad-control-bar]');
  const menuTop = controlBar?.getBoundingClientRect().top ?? top;
  return ({
    orientationUp: true,
    flatBottom: true,
    x: left,
    y: document.documentElement.clientHeight - menuTop
  });
};
