import { h, createRender } from '../src/index';

const View = ({ greeted }) => {
  if (greeted) {
    return h('p', {}, [
      h('text', { text: 'Hello World!' })
    ]);
  } else {
    return h('button', {}, [
      h('text', { text: 'Say Hi!' })
    ]);
  }
};

const render = createRender(document.getElementById('app'));

render(h(View, {
  greeted: false
}));
