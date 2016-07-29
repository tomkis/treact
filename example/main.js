import { createStore } from 'redux';
import { h, createRender } from '../src/index';

let memoizedOnClick = null;

const View = ({ greeted, dispatch }) => {
  // Obviously we don't want to change the handler with each render
  if (!memoizedOnClick) {
    memoizedOnClick = () => dispatch({ type: 'SayHi' });
  }

  if (greeted) {
    return h('p', {}, [
      h('text', { text: 'Hello World!' })
    ]);
  } else {
    return h('button', { onClick: memoizedOnClick }, [
      h('text', { text: 'Say Hi!' })
    ]);
  }
};

const render = createRender(document.getElementById('app'));

// This is obviously not ideal because it returns new reference of the
// props on every render, but this affects only TOP level component.
// So from performance perspective it is not a big deal.
const doRender = (state, dispatch) => render(h(View, { ...state, dispatch }));

// So the idea is that you would use some State container
// and pass everything top-down through the Component hierarchy.
// I used redux obviously here but this could as well be a single
// mutable variable without any library.
const store = createStore((appState, action) => {
  switch (action.type) {
    case 'SayHi':
      return {
        ...appState,
        greeted: true
      };
    default:
      return appState;
  }
}, {
  greeted: false
});

// On any store change we call render again
store.subscribe(() => doRender(store.getState(), store.dispatch));
doRender();
