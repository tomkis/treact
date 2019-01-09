import { h, createTreact } from '../src/index';

const { render, useState } = createTreact(document.getElementById('app'));

const Counter = () => {
  const [value, setState] = useState(0);
  const increment = () => {
    setState(value + 1);
  };

  return h('button', { onClick: increment }, [
    h('text', { text: value })
  ]);
};

const Root = () => h('div', {}, [
  h(Counter, {}),
  h(Counter, {})
]);

render(h(Root, {}));
